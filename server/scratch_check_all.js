const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function checkAllTemplates() {
  const templatesDir = path.join(__dirname, "templates");
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.pdf'));

  for (const file of files) {
    console.log(`\nChecking ${file}...`);
    const templatePath = path.join(templatesDir, file);
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    for (const field of fields) {
      const name = field.getName();
      if (name.includes("ADDRESS") || name.includes("Address") || name.includes("address") || name.includes("CORRESPONDENC") || name.includes("Line 1")) {
        console.log("  ", name);
      }
    }
  }
}

checkAllTemplates().catch(console.error);
