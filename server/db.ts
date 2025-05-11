import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Create a mock DB implementation for demo mode
const createMockDb = () => {
  console.warn("Using mock database for demo mode");
  return {
    select: () => ({ 
      from: () => ({ 
        where: () => [],
        orderBy: () => [] 
      }) 
    }),
    insert: () => ({ 
      values: () => ({ 
        returning: () => [{ id: 1, createdAt: new Date() }] 
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ 
          returning: () => [{ id: 1, updatedAt: new Date() }] 
        }) 
      }) 
    }),
    query: () => Promise.resolve([]),
    delete: () => ({ 
      where: () => ({ 
        returning: () => [] 
      }) 
    }),
  };
};

// Initialize database connection with simple error handling
let pool = null;
let db;

try {
  if (process.env.DATABASE_URL) {
    console.log("Connecting to database...");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    pool.query('SELECT NOW()').then(() => {
      console.log("Database connection successful!");
    }).catch(err => {
      console.error("Database connection test failed:", err);
    });
    
    db = drizzle(pool, { schema });
  } else {
    console.warn("No DATABASE_URL found. Using mock database.");
    db = createMockDb();
  }
} catch (error) {
  console.error("Database initialization error:", error);
  db = createMockDb();
}

export { pool, db };