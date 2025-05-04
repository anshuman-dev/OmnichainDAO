const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { LZ_ENDPOINTS, DAO_CONFIG } = require("./constants");

// Load factory address from deployment file if available
function loadFactoryAddress() {
  try {
    const deploymentsDir = path.join(__dirname, '../../deployments');
    const { chainId } = hre.network.config;
    const deploymentFile = path.join(deploymentsDir, `factory-${chainId}.json`);
    
    if (fs.existsSync(deploymentFile)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      return deployment.factoryAddress;
    }
  } catch (error) {
    console.error("Error loading factory address:", error);
  }
  return null;
}

// Save deployment info to file
function saveDeployment(deployment) {
  try {
    const deploymentsDir = path.join(__dirname, '../../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const { chainId } = hre.network.config;
    const deploymentFile = path.join(deploymentsDir, `dao-${chainId}.json`);
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    console.log(`Deployment info saved to ${deploymentFile}`);
  } catch (error) {
    console.error("Error saving deployment:", error);
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DAO with the account:", deployer.address);

  // Get the network we're deploying to
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`Deploying to network with chainId: ${chainId}`);
  
  // Get the LZ endpoint for this chain
  const lzEndpoint = LZ_ENDPOINTS[chainId];
  if (!lzEndpoint) {
    throw new Error(`No LayerZero endpoint configured for chainId ${chainId}`);
  }
  console.log(`Using LayerZero endpoint: ${lzEndpoint}`);
  
  // Get factory address
  let factoryAddress = loadFactoryAddress();
  if (!factoryAddress) {
    // If no factory deployment found, deploy one now
    console.log("No factory deployment found. Deploying OmniGovFactory...");
    const OmniGovFactory = await hre.ethers.getContractFactory("OmniGovFactory");
    const factory = await OmniGovFactory.deploy(deployer.address);
    await factory.waitForDeployment();
    
    factoryAddress = await factory.getAddress();
    console.log(`OmniGovFactory deployed to: ${factoryAddress}`);
  } else {
    console.log(`Using existing OmniGovFactory at: ${factoryAddress}`);
  }
  
  // Connect to the factory
  const factory = await hre.ethers.getContractAt("OmniGovFactory", factoryAddress);
  
  // Deploy the full DAO using the factory
  console.log("Deploying full DAO...");
  console.log(`Token Name: ${DAO_CONFIG.token.name}`);
  console.log(`Token Symbol: ${DAO_CONFIG.token.symbol}`);
  console.log(`Initial Supply: ${DAO_CONFIG.token.initialSupply}`);
  console.log(`Bridge Fee Rate: ${DAO_CONFIG.token.bridgeFeeRate}`);
  console.log(`Governor Name: ${DAO_CONFIG.governor.name}`);
  
  const tx = await factory.deployFullDAO(
    DAO_CONFIG.token.name,
    DAO_CONFIG.token.symbol,
    DAO_CONFIG.governor.name,
    lzEndpoint,
    DAO_CONFIG.token.initialSupply,
    DAO_CONFIG.token.bridgeFeeRate,
    DAO_CONFIG.timelock.minDelay,
    DAO_CONFIG.governor.votingDelay,
    DAO_CONFIG.governor.votingPeriod,
    DAO_CONFIG.governor.proposalThreshold
  );
  
  console.log("Transaction sent, waiting for confirmation...");
  const receipt = await tx.wait();
  
  // Find the FullDAODeployed event
  const deployedEvent = receipt.logs
    .filter(log => log.fragment && log.fragment.name === 'FullDAODeployed')
    .map(log => factory.interface.parseLog(log))[0];
  
  if (!deployedEvent) {
    throw new Error("Failed to find FullDAODeployed event in transaction logs");
  }
  
  const tokenAddress = deployedEvent.args.tokenAddress;
  const timelockAddress = deployedEvent.args.timelockAddress;
  const governorAddress = deployedEvent.args.governorAddress;
  
  console.log(`OmniGovern Token deployed to: ${tokenAddress}`);
  console.log(`Timelock Controller deployed to: ${timelockAddress}`);
  console.log(`OmniGovernor deployed to: ${governorAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId,
    factoryAddress,
    tokenAddress,
    timelockAddress,
    governorAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    txHash: receipt.hash
  };
  
  saveDeployment(deploymentInfo);
  
  return deploymentInfo;
}

// Execute the deployment
main()
  .then((deploymentInfo) => {
    console.log("DAO deployment completed successfully!");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("DAO deployment failed:", error);
    process.exit(1);
  });