const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { LZ_CHAIN_IDS } = require("./constants");

// Load deployment info for all networks
function loadDeployments() {
  const deployments = {};
  const deploymentsDir = path.join(__dirname, '../../deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    return deployments;
  }
  
  const files = fs.readdirSync(deploymentsDir);
  for (const file of files) {
    if (file.startsWith('dao-') && file.endsWith('.json')) {
      try {
        const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), 'utf8'));
        deployments[deployment.chainId] = deployment;
      } catch (error) {
        console.error(`Error loading deployment from ${file}:`, error);
      }
    }
  }
  
  return deployments;
}

// Save trusted remote configuration to file
function saveTrustedRemotes(trustedRemotes) {
  try {
    const configDir = path.join(__dirname, '../../config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configFile = path.join(configDir, 'trusted-remotes.json');
    fs.writeFileSync(configFile, JSON.stringify(trustedRemotes, null, 2));
    console.log(`Trusted remotes saved to ${configFile}`);
  } catch (error) {
    console.error("Error saving trusted remotes:", error);
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Configuring trusted remotes with the account:", deployer.address);
  
  // Get the current network
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`Current network chainId: ${chainId}`);
  
  // Load deployments for all networks
  const deployments = loadDeployments();
  console.log(`Loaded deployments for ${Object.keys(deployments).length} networks`);
  
  // Check if current network is deployed
  if (!deployments[chainId]) {
    throw new Error(`No deployment found for current network (chainId: ${chainId})`);
  }
  
  // Check that we have enough deployments to configure trusted remotes
  if (Object.keys(deployments).length < 2) {
    throw new Error("Need at least two network deployments to configure trusted remotes");
  }
  
  // Connect to the OFT contract
  const token = await hre.ethers.getContractAt("OmniGovernToken", deployments[chainId].tokenAddress);
  
  // Prepare trusted remotes configuration
  const trustedRemotes = {};
  
  // Configure trusted remotes for each destination
  for (const [dstChainIdStr, dstDeployment] of Object.entries(deployments)) {
    const dstChainId = parseInt(dstChainIdStr);
    
    // Skip the current chain
    if (dstChainId === chainId) {
      continue;
    }
    
    // Get the LayerZero chain ID for the destination chain
    const lzDstChainId = LZ_CHAIN_IDS[dstChainId];
    if (!lzDstChainId) {
      console.warn(`No LayerZero chain ID found for chainId ${dstChainId}, skipping...`);
      continue;
    }
    
    console.log(`Configuring trusted remote for destination chain ${dstChainId} (LZ: ${lzDstChainId})...`);
    
    // Format the remote address as required by LayerZero (address + nativeAddress)
    // The actual bytes should include both the token address and the token address again
    // This is the OFT v2 format: abi.encodePacked(address, address)
    const remoteOFT = dstDeployment.tokenAddress;
    const encodedRemote = hre.ethers.concat([
      remoteOFT,
      remoteOFT  // Yes, we include it twice in OFT v2
    ]);
    
    // Store in our configuration
    if (!trustedRemotes[chainId]) {
      trustedRemotes[chainId] = {};
    }
    trustedRemotes[chainId][dstChainId] = {
      lzChainId: lzDstChainId,
      remoteAddress: remoteOFT,
      encodedRemote: encodedRemote
    };
    
    // Set the trusted remote on the contract
    try {
      console.log(`Setting trusted remote ${lzDstChainId} -> ${remoteOFT}...`);
      const tx = await token.setTrustedRemote(lzDstChainId, encodedRemote);
      await tx.wait();
      console.log(`Successfully set trusted remote for chain ${dstChainId}`);
    } catch (error) {
      console.error(`Error setting trusted remote for chain ${dstChainId}:`, error);
    }
  }
  
  // Save trusted remotes configuration
  saveTrustedRemotes(trustedRemotes);
  
  return {
    chainId,
    trustedRemotes
  };
}

// Execute the configuration
main()
  .then((configInfo) => {
    console.log("Trusted remotes configuration completed!");
    console.log(JSON.stringify(configInfo, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Trusted remotes configuration failed:", error);
    process.exit(1);
  });