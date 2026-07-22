const pool = require("./config/db");
const { exportApplicationToBse } = require("./services/bseExportService");
const { exportApplicationToCdsl } = require("./services/cdslExportService");
const { exportApplicationToNsdl } = require("./services/nsdlExportService");

async function debugExports() {
  const appId = 65; 
  try {
    console.log("Testing BSE Export for App", appId);
    const bseResult = await exportApplicationToBse(appId);
    console.log("BSE Export Success:", bseResult);
  } catch (err) {
    console.error("BSE Export Failed:", err.message);
  }

  try {
    console.log("\nTesting CDSL Export for App", appId);
    const cdslResult = await exportApplicationToCdsl(appId);
    console.log("CDSL Export Success:", cdslResult);
  } catch (err) {
    console.error("CDSL Export Failed:", err.message);
  }
  
  try {
    console.log("\nTesting NSDL Export for App", appId);
    const nsdlResult = await exportApplicationToNsdl(appId);
    console.log("NSDL Export Success:", nsdlResult);
  } catch (err) {
    console.error("NSDL Export Failed:", err.message);
  }

  process.exit(0);
}

debugExports();
