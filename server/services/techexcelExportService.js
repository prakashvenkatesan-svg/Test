const pool = require("../config/db");
const { insertTechexcelData } = require("../queries/techexcelQueries");

const createHttpError = (message, statusCode, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

const exportApplicationToTechexcel = async (applicationId) => {
  try {
    // 1. Fetch application details joined with related tables to build the "userRecord"
    // Adjust this query if you need to fetch from different tables or specific columns
    const query = `
      SELECT 
        ka.id AS application_id,
        COALESCE(ka.client_code, cc.client_code) AS client_code,
        ka.boid AS inst_boid,
        ka.esign_signed_at AS agreement_date,
        iv.full_name,
        iv.dob AS birth_date,
        iv.gender AS sex,
        pd.father_name AS father_husband_name,
        pd.mother_name,
        pd.marital_status,
        pd.annual_income,
        pd.occupation,
        cd.email AS email_id,
        cd.mobile_number AS mobile_no,
        iv.pan_number AS pan_no,
        bd.bank_name AS not_bank_name,
        bd.account_number AS not_bank_account_no,
        bd.ifsc_code AS not_ifsc,
        iv.address_1 AS resi_address1,
        iv.address_2 AS resi_address2,
        iv.pincode AS pin_code,
        iv.pincode AS r_pin_code,
        iv.state AS state,
        iv.state AS r_state
        -- Add any other specific columns you need from personal_details, etc.
      FROM public.kyc_applications ka
      LEFT JOIN public.personal_details pd ON pd.application_id = ka.id
      LEFT JOIN public.contact_details cd ON cd.application_id = ka.id
      LEFT JOIN public.identity_verifications iv ON iv.application_id = ka.id
      LEFT JOIN public.bank_details bd ON bd.application_id = ka.id
      LEFT JOIN public.client_codes cc ON cc.pan_number = iv.pan_number
      WHERE ka.id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [applicationId]);
    const userRecord = result.rows[0];

    if (!userRecord) {
      throw createHttpError("Application not found for techexcel export", 404);
    }

    // Parse full_name into first, middle, last
    const nameParts = (userRecord.full_name || "").trim().split(/\s+/);
    userRecord.first_name = nameParts[0] || "";
    userRecord.last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    userRecord.middle_name = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    // Hardcoded fields based on Techexcel requirements
    userRecord.category = "I"; // Individual
    userRecord.category_dup = "I";
    userRecord.ckycflag = "N";
    userRecord.csc_flg = "N";
    userRecord.con_not = "Electronic";
    userRecord.country = "India";
    userRecord.r_country = "India";
    userRecord.city = userRecord.resi_address2 || ""; 
    userRecord.r_city = userRecord.city;
    userRecord.client_nature = "Individual";

    // Map `client_id` for the Techexcel query (upsert key)
    userRecord.client_id = userRecord.client_code || userRecord.application_id.toString();
    userRecord.client_name = userRecord.full_name || "";

    // Fetch and map nominees (up to 3)
    const nomineeQuery = `
      SELECT nominee_name, relation, dob, email, mobile, nominee_address, pan, allocation_percentage
      FROM public.nominee_details
      WHERE application_id = $1
      ORDER BY id ASC
      LIMIT 3;
    `;
    const nomineeResult = await pool.query(nomineeQuery, [applicationId]);
    const nominees = nomineeResult.rows;

    if (nominees[0]) {
      userRecord.nomination_name = nominees[0].nominee_name;
      userRecord.nom_relation = nominees[0].relation;
      userRecord.nom_dob = nominees[0].dob;
      userRecord.nom_email = nominees[0].email;
      userRecord.nom_phone = nominees[0].mobile;
      userRecord.nom_address = nominees[0].nominee_address;
      userRecord.nom_pan = nominees[0].pan;
      userRecord.share_percentage = nominees[0].allocation_percentage;
    }
    if (nominees[1]) {
      userRecord.nomination_name2 = nominees[1].nominee_name;
      userRecord.nom_relation2 = nominees[1].relation;
      userRecord.nom_dob2 = nominees[1].dob;
      userRecord.nom_email2 = nominees[1].email;
      userRecord.nom_phone2 = nominees[1].mobile;
      userRecord.nom2_address = nominees[1].nominee_address;
      userRecord.nom_pan2 = nominees[1].pan;
      userRecord.share_percentage2 = nominees[1].allocation_percentage;
    }
    if (nominees[2]) {
      userRecord.nomination_name3 = nominees[2].nominee_name;
      userRecord.nom_relation3 = nominees[2].relation;
      userRecord.nom_dob3 = nominees[2].dob;
      userRecord.nom_email3 = nominees[2].email;
      userRecord.nom_phone3 = nominees[2].mobile;
      userRecord.nom3_address = nominees[2].nominee_address;
      userRecord.nom_pan3 = nominees[2].pan;
      userRecord.share_percentage3 = nominees[2].allocation_percentage;
    }

    // 2. Insert into techexcel table using the generated query
    const insertResult = await insertTechexcelData(userRecord);

    return {
      application_id: applicationId,
      id: insertResult.rows[0]?.id || null,
      success: true
    };
  } catch (error) {
    console.error(`Techexcel export failed for application ${applicationId}:`, error.message);
    throw error;
  }
};

module.exports = {
  exportApplicationToTechexcel,
};
