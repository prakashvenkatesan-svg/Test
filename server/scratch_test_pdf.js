require('dotenv').config();
const { prepareApplicationPdf } = require('./pdf-flow/services/pdfStepService');

async function testPdf() {
  try {
    const result = await prepareApplicationPdf(52);
    console.log('PDF Generated Successfully at:', result.outputPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

testPdf().finally(() => process.exit(0));
