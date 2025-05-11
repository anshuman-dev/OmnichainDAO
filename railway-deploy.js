// This script is used by Railway to start the application
// It ensures DATABASE_URL is properly set before starting

console.log('Starting deployment process...');

// Check if DATABASE_URL exists
if (process.env.DATABASE_URL) {
  console.log('Database URL is set. Application will use the database.');
  
  // Print database connection details (without exposing credentials)
  console.log(`Database host: ${process.env.PGHOST || 'Not set'}`);
  console.log(`Database name: ${process.env.PGDATABASE || 'Not set'}`);
  console.log(`Database port: ${process.env.PGPORT || 'Not set'}`);
  console.log(`Database user: ${process.env.PGUSER ? 'Set' : 'Not set'}`);
  console.log(`Database password: ${process.env.PGPASSWORD ? 'Set' : 'Not set'}`);
} else {
  console.log('WARNING: DATABASE_URL is not set. The application will run in demo mode without persistent storage.');
}

// Import and run the application
console.log('Starting application with npm start...');

// Use child_process to start the application
const { spawn } = require('child_process');
const process = require('process');

// Run npm start
const child = spawn('npm', ['start'], { 
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`Application exited with code ${code}`);
  process.exit(code);
});