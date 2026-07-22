/**
 * aadhaarXmlS3Service.js
 *
 * Handles uploading the Aadhaar XML payload (received from Digilocker/Setu)
 * to S3 under clients/uploads/aadhaar-xmls/<PANNUMBER>.XML and records
 * the S3 key in cvlkra_data.aadhaar_xml_s3_key.
 *
 * This service is intentionally fire-and-forget safe:
 *   - All DB/S3 errors are caught and logged internally.
 *   - It never throws to the caller.
 */

const pool = require("../config/db");
const { uploadToS3 } = require("../utils/s3Upload");

const S3_PREFIX = "clients/uploads/aadhaar-xmls";

/**
 * Fetches the PAN number for a given application_id.
 * Priority: identity_verifications → pan_verifications → cvlkra_data
 *
 * @param {number|string} applicationId
 * @returns {Promise<string|null>} Uppercase PAN or null
 */
const getPanByApplicationId = async (applicationId) => {
  try {
    const result = await pool.query(
      `
      SELECT COALESCE(
        NULLIF(BTRIM((
          SELECT iv.pan_number
          FROM public.identity_verifications iv
          WHERE iv.application_id = $1
          ORDER BY iv.updated_at DESC NULLS LAST, iv.id DESC
          LIMIT 1
        )), ''),
        NULLIF(BTRIM((
          SELECT pv.pan_number
          FROM public.pan_verifications pv
          WHERE pv.application_id = $1::text
          ORDER BY pv.updated_at DESC NULLS LAST, pv.id DESC
          LIMIT 1
        )), ''),
        NULLIF(BTRIM((
          SELECT cd.app_pan_no
          FROM public.cvlkra_data cd
          WHERE cd.application_id = $1
          ORDER BY cd.updated_at DESC NULLS LAST, cd.id DESC
          LIMIT 1
        )), '')
      ) AS pan_number
      `,
      [applicationId],
    );
    const pan = result.rows[0]?.pan_number;
    return pan ? String(pan).trim().toUpperCase() : null;
  } catch (err) {
    console.error("[AadhaarXmlS3] Failed to fetch PAN for application", applicationId, ":", err.message);
    return null;
  }
};

/**
 * Saves the aadhaar_xml_s3_key to cvlkra_data for the given application.
 * Uses INSERT ... ON CONFLICT so it works whether a cvlkra_data row exists or not.
 *
 * @param {number|string} applicationId
 * @param {string} s3Key
 */
const saveAadhaarXmlS3KeyToCvlkra = async (applicationId, s3Key) => {
  try {
    // First check if a row exists, if so UPDATE only the new column.
    // If no row exists, we do a minimal INSERT so we don't violate mandatory-field
    // requirements – just the application_id and the new column.
    const existing = await pool.query(
      `SELECT id FROM public.cvlkra_data WHERE application_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [applicationId],
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE public.cvlkra_data
         SET aadhaar_xml_s3_key = $1, updated_at = NOW()
         WHERE application_id = $2`,
        [s3Key, applicationId],
      );
      console.info(
        `[AadhaarXmlS3] Updated cvlkra_data.aadhaar_xml_s3_key for application_id=${applicationId}`,
      );
    } else {
      // No cvlkra_data row yet – insert a minimal stub so the Lambda can pick it up later.
      await pool.query(
        `INSERT INTO public.cvlkra_data (application_id, aadhaar_xml_s3_key, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (application_id) DO UPDATE
           SET aadhaar_xml_s3_key = EXCLUDED.aadhaar_xml_s3_key,
               updated_at = NOW()`,
        [applicationId, s3Key],
      );
      console.info(
        `[AadhaarXmlS3] Inserted minimal cvlkra_data row with aadhaar_xml_s3_key for application_id=${applicationId}`,
      );
    }
  } catch (err) {
    console.error(
      "[AadhaarXmlS3] Failed to save aadhaar_xml_s3_key to cvlkra_data for application_id",
      applicationId,
      ":",
      err.message,
    );
  }
};

/**
 * Converts an Aadhaar response (object or string) to an XML buffer ready for S3.
 *
 * The Setu Digilocker /aadhaar endpoint returns a JSON object with parsed Aadhaar
 * data. If that JSON contains a `xml` / `rawXml` / `aadhaarXml` string field we use
 * it directly as-is. Otherwise we wrap the entire payload in a minimal XML envelope
 * so CVL KRA receives a valid .XML file.
 *
 * @param {object|string} aadhaarPayload  Raw response.data from Setu
 * @returns {Buffer}
 */
const buildXmlBuffer = (aadhaarPayload) => {
  // Case 1: The response is already a raw XML string (starts with '<')
  if (typeof aadhaarPayload === "string" && aadhaarPayload.trim().startsWith("<")) {
    return Buffer.from(aadhaarPayload, "utf-8");
  }

  // Case 2: The response object has an embedded raw XML field
  const obj = typeof aadhaarPayload === "object" && aadhaarPayload !== null ? aadhaarPayload : {};
  const embeddedXml =
    obj.xml || obj.rawXml || obj.aadhaarXml || obj.raw_xml || obj.offlineXml || obj.offline_xml;

  if (typeof embeddedXml === "string" && embeddedXml.trim().startsWith("<")) {
    return Buffer.from(embeddedXml, "utf-8");
  }

  // Case 3: Wrap JSON payload in an XML envelope so the file has .XML extension content
  const jsonString = JSON.stringify(aadhaarPayload, null, 2);
  const xmlString =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<AadhaarEkycData source="DigiLocker" generatedAt="${new Date().toISOString()}">\n` +
    `  <RawPayload><![CDATA[${jsonString}]]></RawPayload>\n` +
    `</AadhaarEkycData>`;

  return Buffer.from(xmlString, "utf-8");
};

/**
 * Main entry point.
 *
 * Uploads the Aadhaar XML/data to S3 as <PANNUMBER>.XML and records the key
 * in cvlkra_data. Completely safe to call fire-and-forget – never throws.
 *
 * @param {number|string} applicationId
 * @param {object|string} aadhaarPayload  The raw response.data from Setu /aadhaar
 * @returns {Promise<void>}
 */
const uploadAadhaarXmlToS3 = async (applicationId, aadhaarPayload) => {
  try {
    if (!applicationId) {
      console.warn("[AadhaarXmlS3] uploadAadhaarXmlToS3 called without applicationId – skipping.");
      return;
    }

    // 1. Resolve PAN
    const pan = await getPanByApplicationId(applicationId);
    if (!pan) {
      console.warn(
        `[AadhaarXmlS3] PAN not found for application_id=${applicationId}. Cannot name the XML file. Skipping.`,
      );
      return;
    }

    // 2. Build XML buffer
    const xmlBuffer = buildXmlBuffer(aadhaarPayload);

    // 3. Upload to S3 → clients/uploads/aadhaar-xmls/<PANNUMBER>.XML
    const s3Key = `${S3_PREFIX}/${pan}.XML`;
    const uploaded = await uploadToS3(s3Key, xmlBuffer, "application/xml");

    if (!uploaded) {
      console.warn(`[AadhaarXmlS3] S3 upload returned false for ${s3Key} (application_id=${applicationId}).`);
      return;
    }

    console.info(`[AadhaarXmlS3] Successfully uploaded ${s3Key} for application_id=${applicationId}`);

    // 4. Record S3 key in cvlkra_data
    await saveAadhaarXmlS3KeyToCvlkra(applicationId, s3Key);
  } catch (err) {
    // Safety net – must never propagate to the HTTP request handler
    console.error("[AadhaarXmlS3] Unexpected error in uploadAadhaarXmlToS3:", err.message);
  }
};

module.exports = {
  uploadAadhaarXmlToS3,
};
