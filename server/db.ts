import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// For Neon DB WebSocket connection
try {
  neonConfig.webSocketConstructor = ws;
} catch (error: any) {
  console.warn("Could not set WebSocket constructor:", error?.message || "Unknown error");
}

// Create a mock DB implementation that doesn't throw errors
const createMockDb = () => {
  console.warn("Using mock database implementation for demo mode");
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

// Initialize variables
let pool = null;
let db = null;

// Function to safely check if DATABASE_URL is available
function getDatabaseUrl() {
  // Check both process.env and import.meta.env
  const dbUrl = process.env.DATABASE_URL || 
               (typeof import.meta !== 'undefined' && import.meta.env?.DATABASE_URL);
  
  if (!dbUrl) {
    console.warn("DATABASE_URL not found in environment variables");
    return null;
  }
  
  return dbUrl;
}

// Initialize database connection
try {
  const dbUrl = getDatabaseUrl();
  
  if (dbUrl) {
    console.log("Database URL found, attempting connection...");
    try {
      pool = new Pool({ connectionString: dbUrl });
      // Simple test query to verify connection
      pool.query('SELECT 1').then(() => {
        console.log("Database connection successful");
      }).catch((err: any) => {
        console.error("Database connection test failed:", err?.message || "Unknown error");
      });
      
      db = drizzle(pool, { schema });
    } catch (dbErr: any) {
      console.error("Failed to initialize database:", dbErr?.message || "Unknown error");
      db = createMockDb();
    }
  } else {
    // No database URL found, use mock implementation
    db = createMockDb();
  }
} catch (error: any) {
  console.error("Error during database initialization:", error?.message || "Unknown error");
  db = createMockDb();
}

export { pool, db };