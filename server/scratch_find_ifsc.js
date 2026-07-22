const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const fields = form.getFields();
  fields.forEach(field => {
    const name = field.getName();
    if (/ifsc/i.test(name)) {
      console.log(`- ${name}`);
    }
  });
}

run().catch(console.error);
