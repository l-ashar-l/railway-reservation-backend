const dotenv = require("dotenv");
dotenv.config();

const configurations =  Object.freeze({
  db_host: process.env.DB_HOST ?? "db",
  pg_username: process.env.DB_USER ?? "postgres",
  pg_password: process.env.DB_PASS ?? "postgres",
  pg_database: process.env.DB_NAME ?? "railway",
  pg_port: process.env.DB_PORT ?? 5432,
  port: process.env.PORT ?? 3000,
});

module.exports = configurations;