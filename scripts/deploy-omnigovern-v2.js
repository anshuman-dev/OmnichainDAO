// Deployment script for OmniGovern on LayerZero V2
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// LayerZero V2 Endpoint addresses
const ENDPOINTS = {
  // Testnet endpoints
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  amoy: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  
  // Add mainnet endpoints when ready
};

// Chain IDs for LayerZero V2
const CHAIN_IDS = {
  sepolia: 40161,
  amoy: 40231,
};

// Network configurations
const NETWORKS = [
  {
    name: "sepolia",
    isHub: true,
    color: "#627EEA"
  },
  {
    name: "amoy",
    isHub: false,
    color: "#8247E5"
  }
];

// Deployment directory for artifacts
const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");

async function main() {
  console.log("Starting OmniGovern DAO deployment...");
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR);
  }
  
  // Check if we're deploying to multiple networks
  const deployToAll = process.env.DEPLOY_ALL === "true";
  
  if (deployToAll) {
    // Deploy to all networks
    for (const network of NETWORKS) {
      console.log(`\nDeploying to ${network.name}...`);
      await deployToNetwork(network);
    }
    
    // Configure trusted remotes after all deployments
    console.log("\nConfiguring trusted remotes...");
    await configureTrustedRemotes();
  } else {
    // Deploy to current network
    const networkName = hre.network.name;
    const network = NETWORKS.find(n => n.name === networkName);
    
    if (!network) {
      throw new Error(`Network ${networkName} not configured`);
    }
    
    console.log(`\nDeploying to ${network.name}...`);
    await deployToNetwork(network);
  }
  
  console.log("\nDeployment complete!");
}

async function deployToNetwork(network) {
  // Get network-specific configuration
  const endpoint = ENDPOINTS[network.name];
  if (!endpoint) {
    throw new Error(`No endpoint configured for ${network.name}`);
  }
  
  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy LayerZeroV2Adapter
  console.log("Deploying LayerZeroV2Adapter...");
  const LayerZeroV2Adapter = await hre.ethers.getContractFactory("LayerZeroV2Adapter");
  const adapter = await LayerZeroV2Adapter.deploy(endpoint, deployer.address);
  await adapter.deployed();
  console.log(`LayerZeroV2Adapter deployed to: ${adapter.address}`);
  
  // Deploy DVNConfigManager
  console.log("Deploying DVNConfigManager...");
  const DVNConfigManager = await hre.ethers.getContractFactory("DVNConfigManager");
  const dvnManager = await DVNConfigManager.deploy(endpoint, deployer.address);
  await dvnManager.deployed();
  console.log(`DVNConfigManager deployed to: ${dvnManager.address}`);
  
  // Deploy OmniGovernToken - only on the hub chain
  let tokenAddress = "";
  if (network.isHub) {
    console.log("Deploying OmniGovernToken...");
    const OmniGovernToken = await hre.ethers.getContractFactory("OmniGovernToken");
    const token = await OmniGovernToken.deploy(endpoint, deployer.address);
    await token.deployed();
    tokenAddress = token.address;
    console.log(`OmniGovernToken deployed to: ${token.address}`);
  } else {
    // On non-hub chains, we'll use the OFT from the hub
    console.log("OmniGovernToken will be connected from hub chain");
  }
  
  // Deploy OmniProposalExecutor
  console.log("Deploying OmniProposalExecutor...");
  const OmniProposalExecutor = await hre.ethers.getContractFactory("OmniProposalExecutor");
  const executor = await OmniProposalExecutor.deploy(endpoint, deployer.address);
  await executor.deployed();
  console.log(`OmniProposalExecutor deployed to: ${executor.address}`);
  
  // Save deployment
  const deployment = {
    network: network.name,
    chainId: CHAIN_IDS[network.name],
    endpoint: endpoint,
    contracts: {
      adapter: adapter.address,
      dvnManager: dvnManager.address,
      token: tokenAddress,
      executor: executor.address
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  const deploymentPath = path.join(DEPLOYMENTS_DIR, `${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`Deployment saved to ${deploymentPath}`);
  
  return deployment;
}

async function configureTrustedRemotes() {
  // Load all deployments
  const deployments = {};
  for (const network of NETWORKS) {
    const deploymentPath = path.join(DEPLOYMENTS_DIR, `${network.name}.json`);
    if (fs.existsSync(deploymentPath)) {
      deployments[network.name] = JSON.parse(fs.readFileSync(deploymentPath));
    }
  }
  
  // Get the hub deployment
  const hub = NETWORKS.find(n => n.isHub);
  if (!hub || !deployments[hub.name]) {
    throw new Error("Hub deployment not found");
  }
  
  // Configure each network
  for (const network of NETWORKS) {
    // Skip if deployment doesn't exist
    if (!deployments[network.name]) continue;
    
    // Set the current network
    await hre.network.provider.request({
      method: "hardhat_changeNetwork",
      params: [network.name]
    });
    
    console.log(`Configuring trusted remotes for ${network.name}...`);
    
    // Get adapter contract
    const adapter = await hre.ethers.getContractAt(
      "LayerZeroV2Adapter", 
      deployments[network.name].contracts.adapter
    );
    
    // Get executor contract
    const executor = await hre.ethers.getContractAt(
      "OmniProposalExecutor", 
      deployments[network.name].contracts.executor
    );
    
    // Authorize the executor as a handler for the adapter
    await adapter.authorizeHandler(executor.address, true);
    console.log(`Authorized executor as handler for adapter`);
    
    // If this is the hub, configure all satellite chains
    if (network.isHub) {
      // Get token
      const token = await hre.ethers.getContractAt(
        "OmniGovernToken", 
        deployments[network.name].contracts.token
      );
      
      // For each satellite, configure the chain on the executor
      for (const satellite of NETWORKS.filter(n => !n.isHub)) {
        // Skip if satellite deployment doesn't exist
        if (!deployments[satellite.name]) continue;
        
        const satelliteId = CHAIN_IDS[satellite.name];
        
        // Configure satellite chain on the executor
        await executor.configureChain(
          satelliteId,
          satellite.name,
          deployments[satellite.name].contracts.executor
        );
        console.log(`Configured ${satellite.name} on hub executor`);
      }
    } 
    // If this is a satellite, configure the hub
    else {
      const hubId = CHAIN_IDS[hub.name];
      
      // Configure hub chain on the executor
      await executor.configureChain(
        hubId,
        hub.name,
        deployments[hub.name].contracts.executor
      );
      console.log(`Configured ${hub.name} on satellite executor`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });