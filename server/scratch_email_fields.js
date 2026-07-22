const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const pages = pdfDoc.getPages();
  
  const fields = form.getFields();
  fields.forEach(field => {
    try {
      const widgets = field.acroField.getWidgets();
      widgets.forEach((widget, index) => {
        const pageRef = widget.P();
        const pageIndex = pages.findIndex(p => p.ref === pageRef);
        const name = field.getName();
        if (name.toLowerCase().includes("email") || name.toLowerCase().includes("e-mail") || name.toLowerCase().includes("ecn")) {
           console.log(`Field: ${name}, Page: ${pageIndex + 1}, Widget: ${index}, Rect: y=${widget.getRectangle().y}`);
        }
      });
    } catch(e) {}
  });
}

run().catch(console.error);
