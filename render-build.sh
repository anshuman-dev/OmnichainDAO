#!/bin/bash

# Render build script - ensures all required packages are installed

# First, install the basic dependencies to get Node running
echo "Installing initial dependencies..."
npm install

# Run the fix-dependencies script to ensure @vitejs/plugin-react is in dependencies
echo "Fixing package dependencies..."
node fix-dependencies.js

# Explicitly install the missing package
echo "Explicitly installing @vitejs/plugin-react..."
npm install @vitejs/plugin-react

# Install all other dependencies
echo "Installing remaining dependencies..."
npm install --include=dev

# Create a custom build command that uses our vite.config.js instead of vite.config.ts
echo "Creating custom build script..."
cat > custom-build.js << 'EOF'
const { execSync } = require('child_process');

// Run Vite build with specific config file
console.log('Running Vite build...');
try {
  execSync('npx vite build --config vite.config.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Vite build failed:', error.message);
  process.exit(1);
}

// Run esbuild for server
console.log('Running esbuild for server...');
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
    { stdio: 'inherit' });
} catch (error) {
  console.error('esbuild failed:', error.message);
  process.exit(1);
}

console.log('Build completed successfully!');
EOF

# Run our custom build script
echo "Running custom build..."
node custom-build.js

echo "Build completed successfully!"