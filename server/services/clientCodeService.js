const pool = require("../config/db");
const { runPostClientCodeAutomations } = require("./postClientCodeAutomationService");

// GENERATE CLIENT CODE
async function generateClientCode(panNumber) {
  const cleanPan = panNumber.trim().toUpperCase();

  // GET 5TH CHARACTER
  const fifthChar = cleanPan[4];

  // FIND MAX SEQUENCE FOR THIS LETTER IN DB
  const query = `
    SELECT client_code
    FROM client_codes
    WHERE client_code LIKE $1
    ORDER BY CAST(SUBSTRING(client_code FROM 2) AS INTEGER) DESC
    LIMIT 1;
  `;
  
  const result = await pool.query(query, [`${fifthChar}%`]);
  
  let nextSequence = 100001;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].client_code;
    const lastNumber = parseInt(lastCode.substring(1), 10);
    if (!isNaN(lastNumber)) {
      nextSequence = lastNumber + 1;
    }
  }

  // CREATE CODE
  const clientCode = `${fifthChar}${nextSequence}`;

  return clientCode;
}

// Ensure client code exists for an application (idempotent)
async function ensureClientCode(applicationId) {
  try {
    // 1. Fetch application details to get PAN and email
    const appQuery = `
      SELECT 
        (SELECT email FROM contact_details WHERE application_id = ka.id LIMIT 1) as email,
        (SELECT pan_number FROM identity_verifications WHERE application_id = ka.id LIMIT 1) as pan_number
      FROM kyc_applications ka
      WHERE ka.id = $1
    `;
    const appResult = await pool.query(appQuery, [applicationId]);
    
    if (appResult.rows.length === 0) {
      console.warn(`[ClientCodeService] Application ${applicationId} not found`);
      return null;
    }

    const { email, pan_number: panNumber } = appResult.rows[0];

    if (!panNumber) {
      console.warn(`[ClientCodeService] No PAN found for application ${applicationId}`);
      return null;
    }

    const cleanPan = panNumber.trim().toUpperCase();
    const safeEmail = email ? email.trim() : null;

    // 2. Check if a client code already exists for this PAN
    // Also include email as a fallback mapping logic (aligned with PDF query)
    let existingQuery = `
      SELECT client_code 
      FROM client_codes 
      WHERE UPPER(BTRIM(pan_number)) = $1
    `;
    
    let queryParams = [cleanPan];
    
    if (safeEmail) {
      existingQuery += ` OR UPPER(BTRIM(email)) = UPPER($2)`;
      queryParams.push(safeEmail);
    }
    
    existingQuery += ` ORDER BY id DESC LIMIT 1`;
    
    const existingResult = await pool.query(existingQuery, queryParams);

    if (existingResult.rows.length > 0) {
      console.log(`[ClientCodeService] Client code already exists for application ${applicationId}:`, existingResult.rows[0].client_code);
      return existingResult.rows[0].client_code;
    }

    // 3. Generate a new client code
    const newClientCode = await generateClientCode(cleanPan);
    console.log(`[ClientCodeService] Generated new client code for application ${applicationId}:`, newClientCode);

    // 4. Save to DB
    const insertQuery = `
      INSERT INTO client_codes (
        email,
        pan_number,
        client_code,
        created_at
      )
      VALUES ($1, $2, $3, NOW())
      RETURNING client_code;
    `;
    
    await pool.query(insertQuery, [safeEmail, cleanPan, newClientCode]);

    // 5. Run automations (e.g. BSE export)
    try {
      await runPostClientCodeAutomations({
        applicationId,
        email: safeEmail,
        panNumber: cleanPan,
      });
    } catch (autoErr) {
      console.error(`[ClientCodeService] Automation failed for application ${applicationId}:`, autoErr);
      // We don't throw here, as the code was successfully generated.
    }

    return newClientCode;
  } catch (error) {
    console.error(`[ClientCodeService] Error ensuring client code for application ${applicationId}:`, error);
    return null;
  }
}

module.exports = {
  generateClientCode,
  ensureClientCode
};
