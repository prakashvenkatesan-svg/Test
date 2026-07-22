const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function listFields() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const field of fields) {
    const name = field.getName();
    if (name === '3' || name === '3_2' || name === '3_3' || name.toLowerCase().includes("maiden") || name.toLowerCase().includes("spouse") || name.toLowerCase().includes("fathers")) {
      console.log(name);
    }
  }
}

listFields().catch(console.error);
