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
  
  // Draw red rectangles to see where these fields actually are
  page1.drawRectangle({ x: 77, y: 634.2, width: 200, height: 18, color: require('pdf-lib').rgb(1, 0, 0), opacity: 0.5 });
  page1.drawRectangle({ x: 145, y: 613.7, width: 200, height: 18, color: require('pdf-lib').rgb(0, 1, 0), opacity: 0.5 });
  page1.drawRectangle({ x: 145, y: 594.3, width: 200, height: 18, color: require('pdf-lib').rgb(0, 0, 1), opacity: 0.5 });
  page1.drawRectangle({ x: 145, y: 575.7, width: 200, height: 18, color: require('pdf-lib').rgb(1, 1, 0), opacity: 0.5 });
  
  const outBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(__dirname, "scratch_test_boxes.pdf"), outBytes);
  console.log("Created scratch_test_boxes.pdf");
}

run().catch(console.error);
