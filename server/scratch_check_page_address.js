const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function checkFieldPages() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const field = form.getField("ADDRESS");
  if (!field) return;

  const widgets = field.acroField.getWidgets();
  for (let w = 0; w < widgets.length; w++) {
    const widget = widgets[w];
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const annots = page.node.get(pdfDoc.context.obj('Annots'));
      if (annots && annots.array) {
        for(let a=0; a < annots.array.length; a++){
          if (annots.array[a] === widget.ref) {
             console.log(`Field "ADDRESS" is on Page ${i + 1}`);
          }
        }
      }
    }
  }
}

checkFieldPages().catch(console.error);
