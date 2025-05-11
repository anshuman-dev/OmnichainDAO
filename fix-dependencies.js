// This script moves @vitejs/plugin-react from devDependencies to dependencies
const fs = require('fs');

// Read the current package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Check if @vitejs/plugin-react is in devDependencies
if (packageJson.devDependencies && packageJson.devDependencies['@vitejs/plugin-react']) {
  // Get the version
  const version = packageJson.devDependencies['@vitejs/plugin-react'];
  
  // Add to dependencies if it's not already there
  if (!packageJson.dependencies['@vitejs/plugin-react']) {
    packageJson.dependencies['@vitejs/plugin-react'] = version;
    console.log(`Added @vitejs/plugin-react@${version} to dependencies`);
  }
  
  // Write back to package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json successfully');
} else {
  console.log('@vitejs/plugin-react not found in devDependencies');
}