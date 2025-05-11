import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Setup database connection or provide mock implementation for development/demo
let pool;
let db;

if (process.env.DATABASE_URL) {
  // Real database connection
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
  console.log("Database connection established");
} else {
  // For deployment demo without a real database
  console.warn("DATABASE_URL not found. Using memory fallback for demo purposes.");
  
  // This is a simplified mock implementation that will allow the app to start
  // without a real database for demo purposes
  const mockDb = {
    select: () => ({ from: () => ({ where: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [{ id: 1 }] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [{ id: 1 }] }) }) }),
    query: () => Promise.resolve([]),
  };
  
  db = mockDb;
}

export { pool, db };