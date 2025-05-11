import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Setup database connection with retries
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

let pool;
let db;

async function connectWithRetry(retries = MAX_RETRIES) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('SELECT 1'); // Test the connection
    db = drizzle(pool, { schema });
    console.log("Database connection established successfully");
  } catch (error) {
    console.error(`Database connection attempt failed:`, error.message);
    
    if (retries > 0) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retries - 1);
    }
    
    console.warn("Failed to connect to database, using fallback mode");
    // Fallback to mock implementation
    db = {
      select: () => ({ from: () => ({ where: () => [] }) }),
      insert: () => ({ values: () => ({ returning: () => [{ id: 1 }] }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => [{ id: 1 }] }) }) }),
      query: () => Promise.resolve([]),
    };
  }
}

// Initialize connection
await connectWithRetry();

export { pool, db };