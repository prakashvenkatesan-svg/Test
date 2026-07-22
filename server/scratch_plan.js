const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function run() {
  // We can't easily extract text with pdf-lib. 
  // Let's just adjust the Y coordinates.
  // The user explicitly requested:
  // "Name and Father's/Spouse's Name values are starting from the second line instead of the first line. 
  // Please adjust... so both values start from the first available line."
  
  // So for Name, instead of x: 145, y: 620
  // we want x: 220, y: 638
  
  // For Father's Name, instead of x: 145, y: 579
  // we want x: 220, y: 597
  
  // Let's check if y=597 is the first line for Father's Name.
  // We know Maiden Name field is at y=594.3.
  // If Maiden Name field is at 594.3, and it's x=145...
  // Wait! If Maiden Name is at 594.3, and Father's Name L1 is at 594.3?
  // No, if Maiden Name is at 594, then Father's Name is at 575!
  // If Father's Name L1 is at 575, then we should use x: 220, y: 579!
  // Previously we used x: 145, y: 579. 
  // 145 put it on the SECOND line (because there's no label at x=145).
  // 220 puts it on the FIRST line (next to the label)!
}
run().catch(console.error);
