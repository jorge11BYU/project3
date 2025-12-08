import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    // This logic fixes the error:
    // It checks if "localhost" is in the host name. If yes, it turns SSL OFF.
    ssl: process.env.DB_HOST === 'localhost' 
      ? false 
      : { rejectUnauthorized: false }
  }
});

export default db;