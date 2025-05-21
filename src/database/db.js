const { Pool } = require("pg");
const configurations = require("../config/configuration");

const pool = new Pool({
  host: configurations.db_host,
  user: configurations.pg_username,
  password: configurations.pg_password,
  database: configurations.pg_database,
  port: configurations.pg_port || 5432,
});

async function connectWithRetry() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await pool.query("SELECT 1");
      console.log("Connected to DB");
      return pool;
    } catch (err) {
      retries++;
      console.log(`DB connection failed, retrying ${retries}/${maxRetries}...`);
      await new Promise((res) => setTimeout(res, 2000)); // wait 2 seconds
    }
  }
  throw new Error("Failed to connect to DB after retries");
}

module.exports = {
  pool,
  connectWithRetry,
};
