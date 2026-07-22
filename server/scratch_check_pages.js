const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function checkFieldPages() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const field of fields) {
    const name = field.getName();
    if (name.includes("ADDRESS") || name.includes("Address") || name.includes("address") || name.includes("CORRESPONDENC") || name.includes("Line 1")) {
      const widgets = field.acroField.getWidgets();
      if (widgets.length > 0) {
        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
          const page = pdfDoc.getPage(i);
          const { objectNumber, generationNumber } = page.ref;
          
          for (const widget of widgets) {
            const P = widget.dict.get(PDFDocument.PDFName.of('P'));
            if (P && P.objectNumber === objectNumber) {
              console.log(`Page ${i + 1}: ${name}`);
            }
          }
        }
      }
    }
  }
}

checkFieldPages().catch(console.error);
