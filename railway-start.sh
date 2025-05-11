#!/bin/bash

# Script for starting the application on Railway

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set! The application will run in demo mode without persistent storage."
else
  echo "Database URL is set. Checking database connection..."
  # Try to run a migration to make sure the database is set up
  npm run db:push || { echo "Database migration failed but continuing with application startup..."; }
fi

# Start the application
npm run start