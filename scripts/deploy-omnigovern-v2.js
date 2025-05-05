// Script to deploy the OmniGovern DAO contracts with LayerZero V2 integration
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration
const TOKEN_NAME = "OmniGovern Token";
const TOKEN_SYMBOL = "OMGOV";
const INITIAL_SUPPLY = ethers.utils.parseEther("1000000"); // 1 million tokens

// Chain information
const CHAIN_INFO = {
  sepolia: {
    id: 11155111,
    layerzero_id: 10161,
    name: "Sepolia",
    lzEndpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
    isHub: true,
  },
  amoy: {
    id: 80002,
    layerzero_id: 40161,
    name: "Polygon Amoy",
    lzEndpoint: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
    isHub: false,
  },
};

// DVN information - addresses are from LayerZero docs
const DVN_INFO = {
  blockdaemon: {
    address: "0x71D7a02d21aE5Cb957E6BfF9D6280e2fAa47E223",
    requiredSignatures: 1,
  },
  layerzero: {
    address: "0xA658742d33ebd2ce2F0bdFf73515Aa797Fd161D9",
    requiredSignatures: 1,
  },
  axelar: {
    address: "0x9768484573D072696F8B1572382619Ab437Af19D",
    requiredSignatures: 1,
  },
};

// Deployment function
async function main() {
  console.log("Starting OmniGovern DAO deployment with LayerZero V2 integration...");
  
  // Get the network information
  const networkName = hre.network.name;
  const chainInfo = CHAIN_INFO[networkName];
  
  if (!chainInfo) {
    throw new Error(`Unsupported network: ${networkName}. Please deploy to sepolia or amoy.`);
  }
  
  console.log(`Deploying to ${chainInfo.name} (chainId: ${chainInfo.id}, lzChainId: ${chainInfo.layerzero_id})`);
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy OmniGovernToken
  console.log("Deploying OmniGovernToken...");
  const hubChainId = chainInfo.isHub ? chainInfo.layerzero_id : CHAIN_INFO.sepolia.layerzero_id;
  
  const OmniGovernToken = await ethers.getContractFactory("OmniGovernToken");
  const token = await OmniGovernToken.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    chainInfo.lzEndpoint,
    deployer.address,
    INITIAL_SUPPLY,
    hubChainId
  );
  await token.deployed();
  console.log(`OmniGovernToken deployed to: ${token.address}`);
  
  // Deploy OmniProposalExecutor
  console.log("Deploying OmniProposalExecutor...");
  const OmniProposalExecutor = await ethers.getContractFactory("OmniProposalExecutor");
  const executor = await OmniProposalExecutor.deploy(
    chainInfo.lzEndpoint,
    token.address,
    deployer.address
  );
  await executor.deployed();
  console.log(`OmniProposalExecutor deployed to: ${executor.address}`);
  
  // Deploy DVNConfigManager
  console.log("Deploying DVNConfigManager...");
  const DVNConfigManager = await ethers.getContractFactory("DVNConfigManager");
  const dvnManager = await DVNConfigManager.deploy(
    chainInfo.lzEndpoint,
    deployer.address
  );
  await dvnManager.deployed();
  console.log(`DVNConfigManager deployed to: ${dvnManager.address}`);
  
  // Setup DVN configuration
  console.log("Setting up DVN configuration...");
  
  // Add chain configs
  for (const [name, info] of Object.entries(CHAIN_INFO)) {
    const tx = await dvnManager.addChainConfig(
      info.layerzero_id,
      info.name,
      2 // Require at least 2 DVNs
    );
    await tx.wait();
    console.log(`Added ${info.name} chain configuration`);
  }
  
  // Add DVNs
  for (const [name, dvn] of Object.entries(DVN_INFO)) {
    for (const [chainName, chainInfo] of Object.entries(CHAIN_INFO)) {
      const tx = await dvnManager.addDVN(
        chainInfo.layerzero_id,
        dvn.address,
        dvn.requiredSignatures
      );
      await tx.wait();
      console.log(`Added ${name} DVN to ${chainInfo.name}`);
    }
  }
  
  // Save deployment information
  const deploymentInfo = {
    network: networkName,
    chainId: chainInfo.id,
    lzChainId: chainInfo.layerzero_id,
    contracts: {
      OmniGovernToken: token.address,
      OmniProposalExecutor: executor.address,
      DVNConfigManager: dvnManager.address,
    },
    timestamp: new Date().toISOString(),
  };
  
  // Ensure directory exists
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }
  
  // Write deployment info to file
  fs.writeFileSync(
    path.join(deploymentDir, `${networkName}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment information saved to deployments/${networkName}.json`);
  console.log("Deployment completed successfully!");
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });