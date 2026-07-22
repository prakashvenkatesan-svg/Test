const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const fieldsToCheck = ["PAN NUMBER", "5 A PAN"];
  
  fieldsToCheck.forEach(fieldName => {
    try {
      const field = form.getField(fieldName);
      const widgets = field.acroField.getWidgets();
      widgets.forEach((widget, index) => {
        const ref = widget.P();
        const pages = pdfDoc.getPages();
        let pageIndex = -1;
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].ref === ref) {
            pageIndex = i;
            break;
          }
        }
        console.log(`Field: ${fieldName}, Widget: ${index}, Page: ${pageIndex + 1}`);
      });
    } catch(e) {}
  });
}

run().catch(console.error);
