const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function run() {
  try {
    const pdfBytes = fs.readFileSync('../Prakash_Preview.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Page 25 is index 24
    if (pages.length > 24) {
      const page = pages[24]; // Page 25
      
      // Stamp 1
      page.drawRectangle({
        x: 130, y: 487, width: 105, height: 35, color: rgb(0, 1, 0), opacity: 0.3, borderColor: rgb(0, 0.8, 0), borderWidth: 2
      });

      // Stamp 2
      page.drawRectangle({
        x: 130, y: 406, width: 105, height: 35, color: rgb(0, 1, 0), opacity: 0.3, borderColor: rgb(0, 0.8, 0), borderWidth: 2
      });

      // Stamp 3
      page.drawRectangle({
        x: 130, y: 340, width: 105, height: 35, color: rgb(0, 1, 0), opacity: 0.3, borderColor: rgb(0, 0.8, 0), borderWidth: 2
      });
      
      // Stamp 4
      page.drawRectangle({
        x: 130, y: 277, width: 105, height: 35, color: rgb(0, 1, 0), opacity: 0.3, borderColor: rgb(0, 0.8, 0), borderWidth: 2
      });
      
      const modifiedPdfBytes = await pdfDoc.save();
      fs.writeFileSync('../Visual_Preview_Page25.pdf', modifiedPdfBytes);
      console.log('Visual_Preview_Page25.pdf generated successfully!');
    } else {
      console.log('PDF does not have 25 pages.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
