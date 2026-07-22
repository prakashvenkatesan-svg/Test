const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const pages = pdfDoc.getPages();
  const page10 = pages[9];
  
  const fields = form.getFields();
  fields.forEach(field => {
    const widgets = field.acroField.getWidgets();
    widgets.forEach(widget => {
      if (widget.P() === page10.ref) {
        const rect = widget.getRectangle();
        if (rect.y > 700 && rect.y < 750 && rect.x > 380 && rect.x < 450) {
          console.log(`Potential overlapping field: ${field.getName()} at x=${rect.x}, y=${rect.y}`);
        }
      }
    });
  });
}

run().catch(console.error);
