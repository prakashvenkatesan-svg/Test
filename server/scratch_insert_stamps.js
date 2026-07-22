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
    let count = 0;
    const startNum = 145607;
    for(let i=0; i<100; i++) {
      const num = startNum + i;
      const stampNumber = 'DF' + num;
      const fileName = stampNumber + '.pdf';
      const s3Path = 'stamp_papers/Stamp paper/' + fileName;
      
      const res = await pool.query('SELECT id FROM public.stamp_paper_master WHERE stamp_number = $1', [stampNumber]);
      if (res.rows.length === 0) {
        await pool.query(
          "INSERT INTO public.stamp_paper_master (stamp_number, image_name, image_path, status) VALUES ($1, $2, $3, 'AVAILABLE')",
          [stampNumber, fileName, s3Path]
        );
        count++;
      }
    }
    console.log('Successfully inserted ' + count + ' stamp papers.');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
