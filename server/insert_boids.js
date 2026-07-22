const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.MASTER_DB_USER,
  host: process.env.MASTER_DB_HOST,
  database: process.env.MASTER_DB_NAME,
  password: process.env.MASTER_DB_PASSWORD,
  port: process.env.MASTER_DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const boidsPath = path.join('..', 'BOID and Stamp paper', 'BOID', '08DPT1U.100800.930448');
  const lines = fs.readFileSync(boidsPath, 'utf8').split('\n');
  
  const boidsToInsert = [];
  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('H~')) continue;
    
    const parts = line.split('~');
    const boid = parts[0].trim();
    if (boid.length === 16) {
      boidsToInsert.push(boid);
    }
  }
  
  console.log('Found ' + boidsToInsert.length + ' BOIDs to insert.');
  
  try {
    const existingBoidsRes = await pool.query('SELECT boid_number FROM public.boid_master');
    const existingBoids = new Set(existingBoidsRes.rows.map(r => r.boid_number));
    
    let inserted = 0;
    for (const boid of boidsToInsert) {
      if (!existingBoids.has(boid)) {
        await pool.query("INSERT INTO public.boid_master (boid_number, status) VALUES ($1, 'AVAILABLE')", [boid]);
        inserted++;
      }
    }
    
    console.log('Successfully inserted ' + inserted + ' new BOIDs.');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
