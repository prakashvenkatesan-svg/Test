const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function run() {
  const templatePath = path.join(__dirname, 'templates', 'account_opening_form_v2.pdf');
  const fallbackPath = path.join(__dirname, 'templates', 'account_opening_form.pdf');
  
  const targetPath = fs.existsSync(templatePath) ? templatePath : fallbackPath;
  console.log("Using template:", targetPath);
  
  const pdfBytes = fs.readFileSync(targetPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  
  const fields = form.getFields();
  const fieldData = fields.map(f => {
    const widgets = f.acroField.getWidgets();
    const rect = widgets.length > 0 ? widgets[0].getRectangle() : null;
    return {
      name: f.getName(),
      type: f.constructor.name,
      rect
    };
  });
  
  console.log(JSON.stringify(fieldData, null, 2));
}

run().catch(console.error);
