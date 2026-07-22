const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function listFields() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v2.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const field of fields) {
    const name = field.getName();
    if (name.includes("ADDRESS") || name.includes("Address") || name.includes("address") || name.includes("CORRESPONDENC") || name.includes("1 ADDRESS")) {
      console.log(name);
    }
  }
}

listFields().catch(console.error);
