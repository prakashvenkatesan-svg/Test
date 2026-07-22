const fs = require('fs');
const path = require('path');

function findPdfs(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findPdfs(filePath));
    } else if (filePath.endsWith('.pdf')) {
      results.push(filePath);
    }
  }
  return results;
}

console.log(findPdfs(__dirname));
