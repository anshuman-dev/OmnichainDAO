const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * One-click deployment script for OmniGovern DAO
 * 
 * This script simplifies the deployment of OmniGovern DAO to multiple testnets by:
 * 1. Setting up the environment
 * 2. Deploying contracts to specified networks
 * 3. Configuring cross-chain messaging
 */

// Check for environment variables
function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('No .env file found. Setting up environment...');
    execSync('node scripts/deploy/setup-env.js', { stdio: 'inherit' });
    
    // Give the user time to set up their environment variables
    console.log('\nPlease edit the .env file to add your private key and API keys.');
    console.log('Press Enter when you are ready to continue...');
    execSync('read', { stdio: 'inherit' });
  } else {
    console.log('.env file found. Proceeding with deployment...');
  }
}

// Deploy DAO to a specific network
function deployToNetwork(network) {
  console.log(`\n=== Deploying to ${network} ===`);
  try {
    execSync(`npx hardhat run scripts/deploy/deploy-dao.js --network ${network}`, {
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.error(`Error deploying to ${network}:`, error.message);
    return false;
  }
}

// Configure trusted remotes for a network
function configureTrustedRemotes(network) {
  console.log(`\n=== Configuring trusted remotes for ${network} ===`);
  try {
    execSync(`npx hardhat run scripts/deploy/configure-trusted-remotes.js --network ${network}`, {
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.error(`Error configuring trusted remotes for ${network}:`, error.message);
    return false;
  }
}

// Main deployment function
async function main() {
  console.log('=== OmniGovern DAO Deployment ===\n');
  
  // Check and set up environment
  checkEnvironment();
  
  // Compile contracts
  console.log('\n=== Compiling contracts ===');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  
  // Get networks to deploy to
  console.log('\nWhich networks would you like to deploy to?');
  console.log('1. Ethereum Goerli');
  console.log('2. Polygon Mumbai');
  console.log('3. Arbitrum Goerli');
  console.log('4. Base Goerli');
  console.log('5. All networks');
  process.stdout.write('Enter your choice (1-5) or any other key to abort: ');
  
  const choice = execSync('read -n 1; echo $REPLY').toString().trim();
  
  let networks = [];
  switch (choice) {
    case '1': networks = ['goerli']; break;
    case '2': networks = ['mumbai']; break;
    case '3': networks = ['arbitrumGoerli']; break;
    case '4': networks = ['baseGoerli']; break;
    case '5': networks = ['goerli', 'mumbai', 'arbitrumGoerli', 'baseGoerli']; break;
    default:
      console.log('\nDeployment aborted.');
      return;
  }
  
  console.log(`\nDeploying to: ${networks.join(', ')}`);
  
  // Deploy to each network
  const deployedNetworks = [];
  for (const network of networks) {
    const success = deployToNetwork(network);
    if (success) {
      deployedNetworks.push(network);
    }
  }
  
  // Configure trusted remotes if we have multiple deployments
  if (deployedNetworks.length > 1) {
    console.log('\n=== Configuring cross-chain messaging ===');
    for (const network of deployedNetworks) {
      configureTrustedRemotes(network);
    }
  }
  
  // Summary
  console.log('\n=== Deployment Summary ===');
  if (deployedNetworks.length === 0) {
    console.log('No successful deployments.');
  } else {
    console.log(`Successfully deployed to: ${deployedNetworks.join(', ')}`);
    console.log('\nDeployment information can be found in the ./deployments directory.');
    
    if (deployedNetworks.length > 1) {
      console.log('\nCross-chain configuration:');
      console.log('- Trusted remotes have been configured between all networks');
      console.log('- Configuration details are saved in ./config/trusted-remotes.json');
    }
  }
  
  console.log('\nDeployment process completed!');
}

// Run the script
main()
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });