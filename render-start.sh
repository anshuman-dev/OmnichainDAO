#!/bin/bash

# Render start script - ensures proper port binding and database connection

# Check if PORT is set by Render
if [ -z "$PORT" ]; then
  export PORT=5000
  echo "PORT not set, defaulting to 5000"
else
  echo "Using PORT: $PORT"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set! Application will run in demo mode without persistent data."
else
  echo "Database URL is set. Application will connect to the database."
  
  # Check database connection
  echo "Testing database connection..."
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    pool.query('SELECT NOW()')
      .then(() => {
        console.log('Database connection successful');
        process.exit(0);
      })
      .catch(err => {
        console.error('Database connection failed:', err.message);
        process.exit(0); // Continue even if database connection fails
      });
  "
  
  # Run migrations
  echo "Running database migrations..."
  npm run db:push || echo "Migration failed, but continuing startup..."
fi

# Start the application
echo "Starting application..."
npm start