import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME,
    port: process.env.RDS_PORT || 5432,
    // This logic fixes the error:
    // It checks if "localhost" is in the host name. If yes, it turns SSL OFF.
    ssl: process.env.RDS_HOSTNAME === 'localhost'
      ? false
      : { rejectUnauthorized: false }
  }
});

export default db;