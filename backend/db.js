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

module.exports = pool;