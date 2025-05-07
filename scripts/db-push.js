#!/usr/bin/env node
const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');
const { migrate } = require('drizzle-orm/neon-serverless/migrator');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Pushing schema changes to database...');
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error during schema push:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});