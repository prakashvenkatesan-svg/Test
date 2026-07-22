const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function checkFields() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v3.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  const field1 = form.getField("1 ADDRESS FOR CORRESPONDENCRESIDENCERow1");
  const field2 = form.getField("1 ADDRESS FOR CORRESPONDENCRESIDENCERow2");
  
  if (field1) {
    const widgets = field1.acroField.getWidgets();
    const rect = widgets[0].getRectangle();
    console.log("Row1:", rect);
  }
  
  if (field2) {
    const widgets = field2.acroField.getWidgets();
    const rect = widgets[0].getRectangle();
    console.log("Row2:", rect);
  }
}

checkFields().catch(console.error);
