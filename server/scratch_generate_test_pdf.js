const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function generateTestPdf() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const field of fields) {
    const name = field.getName();
    if (name.includes("ADDRESS") || name.includes("Address") || name.includes("address") || name.includes("CORRESPONDENC") || name.includes("Line 1")) {
      try {
        if (field.constructor.name === "PDFTextField") {
          field.setText("TEST_FIELD: " + name);
        }
      } catch (e) {}
    }
  }

  const outputPath = path.join(__dirname, "test_address_fields.pdf");
  fs.writeFileSync(outputPath, await pdfDoc.save());
  console.log("Generated test PDF at", outputPath);
}

generateTestPdf().catch(console.error);
