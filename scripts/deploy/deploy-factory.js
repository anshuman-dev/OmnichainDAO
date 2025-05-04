const hre = require("hardhat");
const { LZ_ENDPOINTS } = require("./constants");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the network we're deploying to
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`Deploying to network with chainId: ${chainId}`);
  
  // Get the LZ endpoint for this chain
  const lzEndpoint = LZ_ENDPOINTS[chainId];
  if (!lzEndpoint) {
    throw new Error(`No LayerZero endpoint configured for chainId ${chainId}`);
  }
  console.log(`Using LayerZero endpoint: ${lzEndpoint}`);
  
  // Deploy OmniGovFactory
  console.log("Deploying OmniGovFactory...");
  const OmniGovFactory = await hre.ethers.getContractFactory("OmniGovFactory");
  const factory = await OmniGovFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log(`OmniGovFactory deployed to: ${factoryAddress}`);
  
  // Verify on Etherscan if not on a local network
  if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
    console.log("Waiting for block confirmations...");
    await factory.deploymentTransaction().wait(5); // Wait for 5 confirmations
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [deployer.address],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
  
  return {
    factoryAddress,
    deployer: deployer.address,
    chainId,
  };
}

// Execute the deployment
main()
  .then((deploymentInfo) => {
    console.log("Deployment completed successfully!");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });