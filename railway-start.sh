
#!/bin/bash

# Make the script exit on any error
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
MAX_RETRIES=30
COUNT=0
until [ $COUNT -gt $MAX_RETRIES ]
do
  if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL is not set! The application will run in demo mode without persistent storage."
    break
  fi
  
  npm run db:push && break
  
  COUNT=$((COUNT+1))
  echo "Database not ready yet (attempt: $COUNT/$MAX_RETRIES)..."
  sleep 2
done

if [ $COUNT -gt $MAX_RETRIES ]; then
  echo "Database setup timed out, but continuing with application startup..."
fi

# Start the application
echo "Starting application..."
npm run start
