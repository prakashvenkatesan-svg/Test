const { startDigilocker } = require("../services/startDigilocker");
const axios = require("axios");
// CVL KRA: Aadhaar XML S3 upload service (fire-and-forget, does not affect existing flow)
const { uploadAadhaarXmlToS3 } = require("../services/aadhaarXmlS3Service");

const startDigilockerController = async (req, res) => {
  try {
    const result = await startDigilocker();

    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: "Unable to start DigiLocker",
      });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDigilockerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("DIGILOCKER FETCH ID:", id);

    const response = await axios.get(
      `https://dg.setu.co/api/digilocker/${id}/status`,
      {
        headers: {
          "x-client-id": process.env.DIGILOCKER_CLIENT_ID,
          "x-client-secret": process.env.DIGILOCKER_CLIENT_SECRET,
          "x-product-instance-id": process.env.DIGILOCKER_PRODUCT_ID,
        },
      },
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch DigiLocker details",
    });
  }
};

const getAadhaarData = async (req, res) => {
  try {
    const { id } = req.params;
    // application_id is passed as a query param by the frontend (e.g. ?application_id=123)
    const applicationId = req.query.application_id || null;

    const response = await axios.get(
      `https://dg.setu.co/api/digilocker/${id}/aadhaar`,
      {
        headers: {
          "x-client-id": process.env.DIGILOCKER_CLIENT_ID,
          "x-client-secret": process.env.DIGILOCKER_CLIENT_SECRET,
          "x-product-instance-id": process.env.DIGILOCKER_PRODUCT_ID,
        },
      },
    );

    // CVL KRA: Fire-and-forget Aadhaar XML S3 upload — does NOT block or affect the response below
    if (applicationId) {
      uploadAadhaarXmlToS3(applicationId, response.data).catch((err) =>
        console.error("[DigilockerController] Aadhaar XML S3 background upload error:", err.message),
      );
    }

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

module.exports = {
  startDigilockerController,
  getDigilockerDetails,
  getAadhaarData,
};
