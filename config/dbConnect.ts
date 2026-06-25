import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let connectionString = "";

if (process.env.NODE_ENV === "DEVELOPMENT") connectionString = process.env.DB_URI as string;
if (process.env.NODE_ENV === "PRODUCTION") connectionString = process.env.DB_URI as string;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === "PRODUCTION" ? { rejectUnauthorized: false } : false
});

const dbHost = new URL(connectionString).hostname;

pool.connect((err: Error | undefined, client, release) => {
    if (err) {
        console.error(`PostgreSQL Connection Error:`, err.message);
    } else {
        console.log(`PostgreSQL Connected With HOST: ${dbHost}`);
        release();
    }
});

export default pool;