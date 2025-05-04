const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Setup script for creating a .env file with deployment configuration
 */

// Testnets we're supporting
const SUPPORTED_TESTNETS = [
  {
    name: 'goerli',
    chainId: 5,
    rpcUrl: 'https://ethereum-goerli.publicnode.com'
  },
  {
    name: 'mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com'
  },
  {
    name: 'arbitrumGoerli',
    chainId: 421613,
    rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc'
  },
  {
    name: 'baseGoerli',
    chainId: 84531,
    rpcUrl: 'https://goerli.base.org'
  }
];

// Generate a template .env file
function generateEnvTemplate() {
  const template = [
    '# Private key for deployments (DO NOT COMMIT!)',
    'PRIVATE_KEY=',
    '',
    '# Etherscan API keys for verification',
    'ETHERSCAN_API_KEY=',
    'POLYGONSCAN_API_KEY=',
    'ARBISCAN_API_KEY=',
    'BASESCAN_API_KEY=',
    '',
    '# RPC URLs for each testnet'
  ];
  
  // Add RPC URLs for each testnet
  SUPPORTED_TESTNETS.forEach(testnet => {
    const envVarName = `${testnet.name.toUpperCase()}_URL`;
    template.push(`${envVarName}=${testnet.rpcUrl}`);
  });
  
  return template.join('\n');
}

// Check if we're already in a Hardhat project
function checkHardhatProject() {
  const hardhatConfigPath = path.join(process.cwd(), 'hardhat.config.js');
  return fs.existsSync(hardhatConfigPath);
}

// Create the .env file
function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('.env file already exists. Do you want to overwrite it? (y/N)');
    // This is a simple sync prompt for the script
    const response = execSync('read -n 1 -r; echo $REPLY').toString().trim().toLowerCase();
    
    if (response !== 'y') {
      console.log('Aborting...');
      return false;
    }
  }
  
  // Generate and write the .env file
  const template = generateEnvTemplate();
  fs.writeFileSync(envPath, template);
  
  console.log('.env file created successfully!');
  console.log('Please edit it to add your private key and API keys.');
  
  // Add .env to .gitignore if it's not already there
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('.env')) {
      fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n');
      console.log('Added .env to .gitignore');
    }
  } else {
    fs.writeFileSync(gitignorePath, '# Environment variables\n.env\n');
    console.log('Created .gitignore with .env entry');
  }
  
  return true;
}

// Create deployments directory
function createDeploymentsDir() {
  const deploymentsDir = path.join(process.cwd(), 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
    console.log('Created deployments directory');
  }
}

// Main function
function main() {
  console.log('Setting up OmniGovern DAO deployment environment...');
  
  if (!checkHardhatProject()) {
    console.error('Error: Not in a Hardhat project directory!');
    console.error('Please run this script from the root of your Hardhat project.');
    process.exit(1);
  }
  
  if (createEnvFile()) {
    createDeploymentsDir();
    
    console.log('\nEnvironment setup complete!');
    console.log('\nNext steps:');
    console.log('1. Edit the .env file to add your private key and API keys');
    console.log('2. Run `npx hardhat compile` to compile the contracts');
    console.log('3. Deploy to a testnet with:');
    console.log('   npx hardhat run scripts/deploy/deploy-dao.js --network <network_name>');
    console.log('\nSupported testnets:');
    SUPPORTED_TESTNETS.forEach(testnet => {
      console.log(`- ${testnet.name} (chainId: ${testnet.chainId})`);
    });
  }
}

// Run the script
main();