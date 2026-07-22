// const sendMail = require("../utils/mailSender");
const { ensureClientCode } = require("../services/clientCodeService");
const pool = require("../config/db");

// MAIN API
const generateClientCodeAfterPayment = async (req, res) => {
  try {
    const { email, panNumber, application_id } = req.body;

    // VALIDATION
    if (!application_id) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required to ensure client code",
      });
    }

    // ENSURE CLIENT CODE (generates if not exists, fetches if exists)
    const clientCode = await ensureClientCode(application_id);

    if (!clientCode) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate client code. Please ensure PAN and email are provided in KYC application.",
      });
    }

    console.log("CLIENT CODE ENSURED FOR APPLICATION:", application_id, "CODE:", clientCode);

    // FETCH THE SAVED RECORD FOR RESPONSE (optional, but preserves API structure)
    let recordData = null;
    const existingResult = await pool.query(
      `SELECT * FROM client_codes WHERE client_code = $1 ORDER BY id DESC LIMIT 1`,
      [clientCode]
    );
    if (existingResult.rows.length > 0) {
      recordData = existingResult.rows[0];
    }

    // SEND EMAIL (If needed)
    // await sendMail(email, clientCode);

    return res.status(200).json({
      success: true,
      message: "Client code ensured and automations triggered.",
      clientCode,
      data: recordData,
    });
  } catch (error) {
    console.error("ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

module.exports = {
  generateClientCodeAfterPayment,
};

