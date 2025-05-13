const { Pool } = require('pg');

const pool = new Pool({ // change the pool if you want to run locally
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT, 
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
