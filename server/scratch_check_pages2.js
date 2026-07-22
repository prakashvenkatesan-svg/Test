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
      for (let w = 0; w < widgets.length; w++) {
        const widget = widgets[w];
        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
          const page = pdfDoc.getPage(i);
          if (page.node.get(pdfDoc.context.obj('Annots'))) {
            const annots = page.node.get(pdfDoc.context.obj('Annots')).array;
            if (annots) {
               for(let a=0; a < annots.length; a++){
                 if (annots[a] === widget.ref) {
                   console.log(`Page ${i + 1}: ${name}`);
                 }
               }
            }
          }
        }
      }
    }
  }
}

checkFieldPages().catch(console.error);
