const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  const templatePath = path.join(__dirname, "templates", "account_opening_form_v4.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  
  form.getField("Name").setText("NAME SECOND LINE (613)");
  form.getField("Maiden name").setText("MAIDEN NAME (594)");
  form.getField("FathersSpouses Name 1").setText("FATHER NAME (575)");
  form.getField("Date of birth").setText("01-01-1990 (558)");
  
  // also draw text at x=220, y=634 and x=220, y=575
  const page = pdfDoc.getPages()[0];
  page.drawText("NAME FIRST LINE (634)", { x: 220, y: 636, size: 8 });
  page.drawText("FATHER FIRST LINE (596)", { x: 220, y: 596, size: 8 });
  page.drawText("FATHER L1? (577)", { x: 220, y: 577, size: 8 });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('scratch_test_fields.pdf', pdfBytes);
  console.log('Saved scratch_test_fields.pdf');
}

run().catch(console.error);
