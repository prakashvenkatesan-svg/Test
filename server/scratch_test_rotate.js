const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 500]);
  
  page.drawRectangle({
    x: 100, y: 100, width: 300, height: 200, borderColor: rgb(1, 0, 0), borderWidth: 2
  });

  // Draw unrotated
  // page.drawRectangle({ x: 100, y: 100, width: 300, height: 200, color: rgb(0, 1, 0), opacity: 0.5 });

  // If we have an image that is 200 wide, 300 high (portrait)
  // We swap it to 300 wide, 200 high on the page.
  // Wait, I can just use drawRectangle to simulate the image rotation since it also takes rotate!
  
  // Rotate -90 degrees
  // If we want it to fit exactly in x=100, y=100, width=300, height=200
  // When rotated -90:
  // The bottom-left corner of the original image (which is 200x300) will be placed at (x,y).
  // Then it rotates -90 around that corner.
  // So the top-left of the original image swings to the top-right of the box.
  page.drawRectangle({
    x: 100, // wait
    y: 100 + 200, // if we put y at the TOP of the box
    width: 200, // original width
    height: 300, // original height
    rotate: degrees(-90),
    color: rgb(0, 0, 1),
    opacity: 0.5
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('rotation_test.pdf', pdfBytes);
  console.log('Saved rotation_test.pdf');
}
run();
