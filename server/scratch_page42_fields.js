const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const pages = pdfDoc.getPages();
  const page42 = pages[41]; // Index 41 is Page 42
  
  const fields = form.getFields();
  fields.forEach(field => {
    try {
      const widgets = field.acroField.getWidgets();
      widgets.forEach((widget, index) => {
        if (widget.P() === page42.ref) {
          const rect = widget.getRectangle();
          console.log(`Field on Page 42: ${field.getName()}, Widget: ${index}, Rect: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
        }
      });
    } catch(e) {}
  });
}

run().catch(console.error);
