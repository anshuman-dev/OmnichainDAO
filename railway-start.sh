#!/bin/bash

# Make the script exit on any error
set -e

# Explicitly export database variables to ensure they're available
if [ ! -z "$DATABASE_URL" ]; then
  export DATABASE_URL="$DATABASE_URL"
  export PGDATABASE="$PGDATABASE"
  export PGHOST="$PGHOST"
  export PGUSER="$PGUSER"
  export PGPASSWORD="$PGPASSWORD"
  export PGPORT="$PGPORT"
  
  echo "Database URL is set. Attempting to verify connection..."
  
  # Verify database connection
  node -e "
    try {
      const { Pool } = require('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      pool.query('SELECT 1').then(() => {
        console.log('Database connection verified successfully');
        process.exit(0);
      }).catch(err => {
        console.error('Database connection test failed:', err.message);
        process.exit(1);
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  " && {
    echo "Running database migrations..."
    npm run db:push || echo "Database migration failed but continuing with application startup..."
  } || {
    echo "Skipping migrations due to connection failure."
  }
else
  echo "Warning: DATABASE_URL is not set! The application will run in demo mode without persistent storage."
fi

# Start the application
echo "Starting application..."
npm run start