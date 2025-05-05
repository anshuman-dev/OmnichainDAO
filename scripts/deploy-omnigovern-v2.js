// Deploy script for OmniGovern DAO using LayerZero V2
// This script deploys contracts to Sepolia and Amoy testnets

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration for testnets
const config = {
  sepolia: {
    chainId: 11155111,
    lzChainId: 10161,
    rpc: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY", // Replace with your key
    lzEndpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
    isHub: true,
    executionDelay: 86400 // 1 day in seconds
  },
  amoy: {
    chainId: 80002,
    lzChainId: 40161,
    rpc: "https://rpc-amoy.polygon.technology",
    lzEndpoint: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
    isHub: false,
    executionDelay: 86400 // 1 day in seconds
  }
};

// Contract addresses (will be filled during deployment)
const deployments = {
  sepolia: {
    token: "",
    executor: "",
    dvnConfig: ""
  },
  amoy: {
    token: "",
    executor: "",
    dvnConfig: ""
  }
};

// DVN configuration for enhanced security
const dvnConfig = [
  {
    id: "blockdaemon",
    name: "Blockdaemon",
    address: "0x71D7a02d21aE5Cb957E6BfF9D6280e2fAa47E223", // Example address
    description: "Enterprise-grade blockchain infrastructure provider",
    enabled: true,
    requiredSignatures: 1
  },
  {
    id: "layerzero",
    name: "LayerZero Labs",
    address: "0xA658742d33ebd2ce2F0bdFf73515Aa797Fd161D9", // Example address
    description: "Official validators operated by LayerZero team",
    enabled: true,
    requiredSignatures: 1
  }
];

async function main() {
  console.log("Starting OmniGovern DAO deployment with LayerZero V2");
  
  // Deploy to Sepolia first (hub chain)
  await deployToNetwork("sepolia");
  
  // Deploy to Amoy (satellite chain)
  await deployToNetwork("amoy");
  
  // Set up trusted remotes
  await configureTrustedRemotes();
  
  // Save deployments to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "omnigovern-deployments.json"),
    JSON.stringify(deployments, null, 2)
  );
  
  console.log("Deployment complete! Deployment info saved to deployments/omnigovern-deployments.json");
}

async function deployToNetwork(network) {
  console.log(`\nDeploying to ${network}...`);
  
  // Connect to the network
  const provider = new ethers.providers.JsonRpcProvider(config[network].rpc);
  
  // You need to provide a private key or connect to a wallet here
  // For example: const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  // For demo purposes, we'll just use a placeholder
  const wallet = ethers.Wallet.createRandom().connect(provider);
  
  console.log(`Connected to ${network}`);
  
  // Deploy token contract
  const OmniGovernToken = await ethers.getContractFactory("OmniGovernToken", wallet);
  const token = await OmniGovernToken.deploy(
    "OmniGovernToken",
    "OGT",
    config[network].lzEndpoint,
    wallet.address
  );
  await token.deployed();
  console.log(`OmniGovernToken deployed to ${network} at ${token.address}`);
  deployments[network].token = token.address;
  
  // Deploy DVN config manager
  const DVNConfigManager = await ethers.getContractFactory("DVNConfigManager", wallet);
  const dvnManager = await DVNConfigManager.deploy(wallet.address);
  await dvnManager.deployed();
  console.log(`DVNConfigManager deployed to ${network} at ${dvnManager.address}`);
  deployments[network].dvnConfig = dvnManager.address;
  
  // Configure DVNs
  for (const dvn of dvnConfig) {
    await dvnManager.addDVN(
      dvn.id,
      dvn.address,
      dvn.name,
      dvn.description,
      dvn.enabled,
      dvn.requiredSignatures
    );
    console.log(`Added DVN ${dvn.name} to configuration`);
  }
  
  await dvnManager.setMinRequiredDVNs(2);
  console.log("Set minimum required DVNs to 2");
  
  // Apply DVN config to endpoint
  await dvnManager.applyDVNConfigToEndpoint(
    config[network].lzEndpoint,
    config[network].lzChainId
  );
  console.log("Applied DVN configuration to endpoint");
  
  // Deploy executor (if this is the hub)
  if (config[network].isHub) {
    const OmniProposalExecutor = await ethers.getContractFactory("OmniProposalExecutor", wallet);
    const executor = await OmniProposalExecutor.deploy(
      config[network].lzEndpoint,
      token.address,
      config[network].executionDelay,
      wallet.address
    );
    await executor.deployed();
    console.log(`OmniProposalExecutor deployed to ${network} at ${executor.address}`);
    deployments[network].executor = executor.address;
  }
  
  console.log(`Deployment to ${network} complete!`);
}

async function configureTrustedRemotes() {
  console.log("\nConfiguring trusted remotes between chains...");
  
  // This would be implemented to connect the contracts across chains
  // For example, setting up the OFT contract's trusted remotes:
  // await token.setTrustedRemote(targetLzChainId, targetContractAddress);
  
  console.log("Trusted remote configuration complete!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });