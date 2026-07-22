const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 500]);
  
  // Target box: 100, 100, width: 300, height: 200
  page.drawRectangle({
    x: 100, y: 100, width: 300, height: 200, borderColor: rgb(1, 0, 0), borderWidth: 2
  });

  // Image original dims: width 200, height 300
  // Target is rotated, so final on-page is width 300, height 200
  const originalDrawWidth = 200;
  const originalDrawHeight = 300;
  const drawWidth = 300; // physical width
  const drawHeight = 200; // physical height

  const drawX = 100;
  const drawY = 100 + drawHeight; // 300

  page.drawRectangle({
    x: drawX,
    y: drawY,
    width: originalDrawWidth,
    height: originalDrawHeight,
    rotate: degrees(-90),
    color: rgb(0, 0, 1),
    opacity: 0.5
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('rotation_test2.pdf', pdfBytes);
  console.log('Saved rotation_test2.pdf');
}
run();
