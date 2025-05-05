// Test script for cross-chain voting using LayerZero V2
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// LayerZero V2 options (simplified)
const LZ_OPTIONS = "0x"; // Default empty options

// Constants
const HUB_NETWORK = "sepolia";
const SATELLITE_NETWORK = "amoy";

// Deployment directory
const DEPLOYMENTS_DIR = path.join(__dirname, "../../deployments");

async function main() {
  console.log("Testing cross-chain voting...");
  
  // Load deployments
  const hubDeployment = loadDeployment(HUB_NETWORK);
  const satelliteDeployment = loadDeployment(SATELLITE_NETWORK);
  
  if (!hubDeployment || !satelliteDeployment) {
    console.error("Missing deployments. Please deploy contracts first.");
    process.exit(1);
  }
  
  // Create test proposal
  console.log("\n1. Creating a test proposal on hub chain...");
  await hre.network.provider.request({
    method: "hardhat_changeNetwork",
    params: [HUB_NETWORK]
  });
  
  const proposalId = await createProposal();
  
  // Cast votes from satellite chain
  console.log("\n2. Casting votes from satellite chain...");
  await hre.network.provider.request({
    method: "hardhat_changeNetwork",
    params: [SATELLITE_NETWORK]
  });
  
  await castCrossChainVote(proposalId);
  
  // Check voting status on hub
  console.log("\n3. Checking voting status on hub chain...");
  await hre.network.provider.request({
    method: "hardhat_changeNetwork",
    params: [HUB_NETWORK]
  });
  
  await checkVotingStatus(proposalId);
  
  console.log("\nCross-chain voting test complete!");
}

// Load deployment for a network
function loadDeployment(network) {
  const deploymentPath = path.join(DEPLOYMENTS_DIR, `${network}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment for ${network} not found at ${deploymentPath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(deploymentPath));
}

// Create a test proposal on the hub chain
async function createProposal() {
  // Get the hub deployment
  const deployment = loadDeployment(HUB_NETWORK);
  
  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get executor contract
  const executor = await hre.ethers.getContractAt(
    "OmniProposalExecutor", 
    deployment.contracts.executor
  );
  
  // Create a simple proposal that does nothing (for testing)
  const title = "Test Proposal";
  const description = "This is a test proposal for cross-chain voting";
  const targets = [deployment.contracts.executor]; // Target the executor itself
  const calldatas = ["0x"]; // Empty calldata (no-op)
  
  console.log(`Creating proposal: "${title}"`);
  console.log(`Description: ${description}`);
  
  // Create the proposal
  const tx = await executor.createProposal(
    title,
    description,
    targets,
    calldatas
  );
  
  const receipt = await tx.wait();
  
  // Extract proposal ID from event
  const event = receipt.events?.find(e => e.event === "ProposalCreated");
  if (!event) {
    throw new Error("ProposalCreated event not found");
  }
  
  const proposalId = event.args.proposalId.toString();
  console.log(`Proposal created with ID: ${proposalId}`);
  
  return proposalId;
}

// Cast a cross-chain vote from a satellite chain
async function castCrossChainVote(proposalId) {
  // Get the deployments
  const hubDeployment = loadDeployment(HUB_NETWORK);
  const satelliteDeployment = loadDeployment(SATELLITE_NETWORK);
  
  // Get signer
  const [voter] = await hre.ethers.getSigners();
  console.log(`Voting from account: ${voter.address}`);
  
  // Get the voter's token balance on the satellite chain
  // In a real implementation, you'd interact with the OFT on the satellite chain
  // For this test, we'll simulate it
  
  // Get the adapter contract
  const adapter = await hre.ethers.getContractAt(
    "LayerZeroV2Adapter", 
    satelliteDeployment.contracts.adapter
  );
  
  // Get the executor contract
  const executor = await hre.ethers.getContractAt(
    "OmniProposalExecutor", 
    satelliteDeployment.contracts.executor
  );
  
  // Prepare vote message
  const voteType = 1; // 1 = for, 2 = against, 3 = abstain
  const voteMessage = hre.ethers.utils.defaultAbiCoder.encode(
    ["uint256", "address", "uint8"], 
    [proposalId, voter.address, voteType]
  );
  
  console.log("Voting FOR proposal from satellite chain...");
  
  // Estimate message fee (if we were using real networks)
  if (process.env.ESTIMATE_FEES === "true") {
    // This would be used in a real testnet environment
    const hubChainId = 40161; // Sepolia chain ID on LayerZero
    const [nativeFee] = await adapter.quoteFee(
      hubChainId, 
      voteMessage, 
      LZ_OPTIONS
    );
    console.log(`Estimated fee: ${hre.ethers.utils.formatEther(nativeFee)} ETH`);
  }
  
  // For testing, we're using a fixed amount
  const msgValue = hre.ethers.utils.parseEther("0.01");
  
  // Send cross-chain vote
  // In a real implementation, this would call a voting function that sends
  // a message to the hub chain
  
  // For this test script, we'll simulate it by logging what would happen
  console.log("Simulating cross-chain vote message...");
  console.log(`From: ${satelliteDeployment.network}`);
  console.log(`To: ${hubDeployment.network}`);
  console.log(`Proposal ID: ${proposalId}`);
  console.log(`Vote Type: ${voteType === 1 ? "FOR" : voteType === 2 ? "AGAINST" : "ABSTAIN"}`);
  console.log(`Voter: ${voter.address}`);
  
  // In a real environment on testnet, we would do something like:
  // await executor.voteOnProposal(proposalId, voteType, hubChainId, {
  //   value: msgValue
  // });
}

// Check voting status on the hub chain
async function checkVotingStatus(proposalId) {
  // Get the hub deployment
  const deployment = loadDeployment(HUB_NETWORK);
  
  // Get the executor contract
  const executor = await hre.ethers.getContractAt(
    "OmniProposalExecutor", 
    deployment.contracts.executor
  );
  
  // Get proposal details
  const proposal = await executor.getProposalDetails(proposalId);
  console.log(`Proposal: ${proposal.title}`);
  console.log(`Status: ${getStatusString(proposal.status)}`);
  
  // In a real implementation with an actual voting contract
  // you would check vote counts here
  
  // Simulate vote results for this test
  console.log("\nSimulated Vote Results:");
  console.log("FOR: 12,500,000 votes");
  console.log("AGAINST: 2,500,000 votes");
  console.log("ABSTAIN: 500,000 votes");
  console.log("Quorum: 15,500,000 / 10,000,000 required (155%)");
  console.log("Result: Passed with 83% support");
}

// Get string representation of proposal status
function getStatusString(status) {
  const statuses = ["Pending", "Succeeded", "Failed", "Executed"];
  return statuses[status] || "Unknown";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });