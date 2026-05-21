require('dotenv').config();
const { Pool } = require("pg");

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "goihunt",
    password: "admin",
    port: 5432,
  });
}

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Koneksi database GAGAL:', err.stack);
  } else {
    console.log('✅ Koneksi database BERHASIL! Waktu server DB:', res.rows[0].now);
  }
});

module.exports = pool;