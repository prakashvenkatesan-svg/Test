const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { uploadToS3 } = require("../utils/s3Upload");

const router = express.Router();

const MIME_EXTENSION_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

let applicantPhotoColumnsCache = null;

const getApplicantPhotoColumns = async () => {
  if (applicantPhotoColumnsCache) {
    return applicantPhotoColumnsCache;
  }

  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'applicant_photo_uploads'
    `,
  );

  applicantPhotoColumnsCache = new Set(
    result.rows.map((row) => row.column_name),
  );

  return applicantPhotoColumnsCache;
};

const hasColumn = (columns, columnName) => columns.has(columnName);

const buildApplicantPhotoMutationPayload = ({
  columns,
  applicationId,
  fileName,
  mimeType,
  relativeFilePath,
  image,
}) => {
  const values = {
    application_id: applicationId,
  };

  if (hasColumn(columns, "file_name")) {
    values.file_name = fileName;
  }

  if (hasColumn(columns, "file_type")) {
    values.file_type = mimeType;
  }

  if (hasColumn(columns, "file_path")) {
    values.file_path = relativeFilePath;
  }

  if (hasColumn(columns, "photo_base64")) {
    values.photo_base64 = image;
  }

  if (hasColumn(columns, "updated_at")) {
    values.updated_at = "__NOW__";
  }

  return values;
};

const buildApplicantPhotoUpdateQuery = (values) => {
  const keys = Object.keys(values).filter((key) => key !== "application_id");
  const params = [values.application_id];

  const assignments = keys.map((key) => {
    const value = values[key];

    if (value === "__NOW__") {
      return `${key} = NOW()`;
    }

    params.push(value);
    return `${key} = $${params.length}`;
  });

  return {
    text: `
      UPDATE public.applicant_photo_uploads
      SET ${assignments.join(", ")}
      WHERE application_id = $1
      RETURNING *
    `,
    values: params,
  };
};

const buildApplicantPhotoInsertQuery = (values, columns) => {
  const keys = Object.keys(values);
  const params = [];

  const placeholders = keys.map((key) => {
    const value = values[key];

    if (value === "__NOW__") {
      return "NOW()";
    }

    params.push(value);
    return `$${params.length}`;
  });

  if (
    hasColumn(columns, "created_at") &&
    !keys.includes("created_at")
  ) {
    keys.push("created_at");
    placeholders.push("NOW()");
  }

  return {
    text: `
      INSERT INTO public.applicant_photo_uploads (
        ${keys.join(", ")}
      )
      VALUES (
        ${placeholders.join(", ")}
      )
      RETURNING *
    `,
    values: params,
  };
};
router.post("/generate-token", async (req, res) => {
  try {
    const { application_id } = req.body;
    if (!application_id) {
      return res.status(400).json({ success: false, message: "Application ID is required" });
    }
    
    const appResult = await pool.query(`SELECT current_step FROM public.kyc_applications WHERE id = $1`, [application_id]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    if (appResult.rows[0].current_step !== 'live_photo') {
      return res.status(400).json({ success: false, message: "Live photo step is not active" });
    }

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(`
      INSERT INTO public.otp_sessions (application_id, otp_hash, expires_at, is_used, created_at, mobile_number)
      VALUES ($1, $2, $3, false, NOW(), 'LIVE_PHOTO')
    `, [application_id, tokenHash, expiresAt]);

    res.json({ success: true, token });
  } catch (err) {
    console.error("GENERATE TOKEN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/validate-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const otpResult = await pool.query(`
      SELECT * FROM public.otp_sessions 
      WHERE otp_hash = $1 AND mobile_number = 'LIVE_PHOTO' 
      ORDER BY created_at DESC LIMIT 1
    `, [tokenHash]);

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const session = otpResult.rows[0];
    if (session.is_used) {
      return res.status(400).json({ success: false, message: "Token has already been used" });
    }
    if (new Date() > new Date(session.expires_at)) {
      return res.status(400).json({ success: false, message: "Token has expired" });
    }

    const appResult = await pool.query(`SELECT current_step FROM public.kyc_applications WHERE id = $1`, [session.application_id]);
    if (appResult.rows.length === 0 || appResult.rows[0].current_step !== 'live_photo') {
      return res.status(400).json({ success: false, message: "Live photo step is not active" });
    }

    res.json({ success: true, application_id: session.application_id });
  } catch (err) {
    console.error("VALIDATE TOKEN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/upload", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { image, application_id: applicationIdRaw, token } = req.body;
    let applicationId = Number(applicationIdRaw);
    let usedTokenId = null;

    if (token) {
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const otpResult = await client.query(`
        SELECT * FROM public.otp_sessions 
        WHERE otp_hash = $1 AND mobile_number = 'LIVE_PHOTO' 
        ORDER BY created_at DESC LIMIT 1
      `, [tokenHash]);

      if (otpResult.rows.length === 0) return res.status(400).json({ success: false, message: "Invalid token" });
      const session = otpResult.rows[0];
      if (session.is_used) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Token already used" });
      }
      if (new Date() > new Date(session.expires_at)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Token expired" });
      }
      
      const appResult = await client.query(`SELECT current_step FROM public.kyc_applications WHERE id = $1`, [session.application_id]);
      if (appResult.rows.length === 0 || appResult.rows[0].current_step !== 'live_photo') {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Live photo step is not active" });
      }

      applicationId = session.application_id;
      usedTokenId = session.id;
    } else {
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Valid application ID is required",
        });
      }
    }

    if (!image || typeof image !== "string") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invalid image format",
      });
    }

    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];
    const extension = MIME_EXTENSION_MAP[mimeType];

    if (!extension) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Unsupported image type",
      });
    }

    if (!base64Data || !base64Data.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Captured image is empty",
      });
    }

    const imageBuffer = Buffer.from(base64Data, "base64");

    if (!imageBuffer.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Captured image is empty",
      });
    }

    // Create server/uploads/photos folder if not exists
    const isLambda = !!process.env.AWS_EXECUTION_ENV;
    const uploadDir = isLambda 
      ? "/tmp/uploads/photos" 
      : path.join(__dirname, "../uploads/photos");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `photo_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const relativeFilePath = `/uploads/photos/${fileName}`;

    fs.writeFileSync(filePath, imageBuffer);

    // Upload to S3 if configured (with error tolerance)
    await uploadToS3("clients" + relativeFilePath, imageBuffer, mimeType);

    const applicantPhotoColumns = await getApplicantPhotoColumns();
    const mutationValues = buildApplicantPhotoMutationPayload({
      columns: applicantPhotoColumns,
      applicationId,
      fileName,
      mimeType,
      relativeFilePath,
      image,
    });

    const updateQuery = buildApplicantPhotoUpdateQuery(mutationValues);
    const updateResult = await client.query(updateQuery.text, updateQuery.values);

    if (updateResult.rows.length === 0) {
      const insertQuery = buildApplicantPhotoInsertQuery(
        mutationValues,
        applicantPhotoColumns,
      );
      await client.query(insertQuery.text, insertQuery.values);
    }

    if (usedTokenId) {
      await client.query(`UPDATE public.otp_sessions SET is_used = true WHERE id = $1`, [usedTokenId]);
    }

    await client.query(
      `
      UPDATE public.kyc_applications
      SET current_step = 'signature_upload', updated_at = NOW()
      WHERE id = $1
      `,
      [applicationId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      fileName,
      path: relativeFilePath,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("PHOTO UPLOAD ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
