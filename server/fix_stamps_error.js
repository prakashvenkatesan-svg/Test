require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const delRes = await pool.query("DELETE FROM public.stamp_paper_master WHERE stamp_number LIKE 'STAMP%' AND stamp_number > 'STAMP010' AND status = 'AVAILABLE'");
    console.log('Deleted ' + delRes.rowCount + ' unused dummy rows.');
    
    let count = 0;
    const startNum = 145607;
    for(let i=0; i<100; i++) {
      const num = startNum + i;
      const stampNumber = 'DF' + num;
      const fileName = stampNumber + '.pdf';
      // Adjust path if needed.
      const s3Path = 'stamp_papers/' + fileName;
      
      const res = await pool.query('SELECT id FROM public.stamp_paper_master WHERE stamp_number = $1', [stampNumber]);
      if (res.rows.length === 0) {
        await pool.query(
          "INSERT INTO public.stamp_paper_master (stamp_number, image_name, image_path, status) VALUES ($1, $2, $3, 'AVAILABLE')",
          [stampNumber, fileName, s3Path]
        );
        count++;
      }
    }
    console.log('Successfully inserted ' + count + ' real stamp papers.');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
