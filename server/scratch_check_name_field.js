const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const field = form.getField("Name");
  const widgets = field.acroField.getWidgets();
  const pages = pdfDoc.getPages();
  widgets.forEach((widget, index) => {
    const ref = widget.P();
    let pageIndex = -1;
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].ref === ref) {
        pageIndex = i;
        break;
      }
    }
    const rect = widget.getRectangle();
    console.log(`Name Widget: ${index}, Page: ${pageIndex + 1}, x=${rect.x}, y=${rect.y}`);
  });
}

run().catch(console.error);
