const fs = require('fs');

const mappingDoc = fs.readFileSync('d:\\Prakash\\NEW KYC 26-06-2026-29\\NEW KYC 26-06-2026-29\\techexcel_field_mapping.md', 'utf8');

const regex = /"([^"]+)":\s*userRecord\.([^ ]+)\s*\|\|/g;
let match;
const fields = [];
const dbFields = [];

while ((match = regex.exec(mappingDoc)) !== null) {
  fields.push(`"${match[1]}"`); // Quoted API field (table column)
  dbFields.push(match[2]);
}

const query = `
const insertTechexcelData = async (userRecord) => {
  const query = \`
    INSERT INTO public.techexcel (
      ${fields.join(',\n      ')}
    ) VALUES (
      ${fields.map((_, i) => '$' + (i + 1)).join(', ')}
    )
    ON CONFLICT (Client_id) DO UPDATE SET
      ${fields.map((f, i) => `${f} = EXCLUDED.${f}`).join(',\n      ')}
    RETURNING *;
  \`;

  const values = [
    ${dbFields.map(dbf => `userRecord.${dbf} || ""`).join(',\n    ')}
  ];

  return await pool.query(query, values);
};

module.exports = {
  insertTechexcelData
};
`;

fs.writeFileSync('d:\\Prakash\\NEW KYC 26-06-2026-29\\NEW KYC 26-06-2026-29\\server\\queries\\techexcelQueries.js', `const pool = require("../config/db");\n\n${query}`);
console.log('Queries file generated.');
