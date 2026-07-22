const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const pages = pdfDoc.getPages();
  const page1 = pages[0]; 
  
  const fields = form.getFields();
  fields.forEach(field => {
    try {
      const widgets = field.acroField.getWidgets();
      widgets.forEach((widget, index) => {
        if (widget.P() === page1.ref) {
          const rect = widget.getRectangle();
          const name = field.getName();
          if (rect.y > 630 && rect.y < 700) {
            console.log(`Field on Page 1: ${name}, Widget: ${index}, Rect: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
          }
        }
      });
    } catch(e) {}
  });
}

run().catch(console.error);
