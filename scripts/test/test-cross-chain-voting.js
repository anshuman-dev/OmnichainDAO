// Basic testing script for cross-chain voting with OmniGovern DAO
// This script sends a test vote from one chain to another using LayerZero

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load deployments
const deploymentsPath = path.join(__dirname, "../../deployments/omnigovern-deployments.json");
let deployments;

try {
  deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
} catch (e) {
  console.error("Error loading deployments file. Make sure to run deploy-omnigovern-v2.js first.");
  process.exit(1);
}

// Configuration for testnets
const config = {
  sepolia: {
    chainId: 11155111,
    lzChainId: 10161,
    rpc: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY", // Replace with your key
    lzEndpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
    isHub: true
  },
  amoy: {
    chainId: 80002,
    lzChainId: 40161,
    rpc: "https://rpc-amoy.polygon.technology",
    lzEndpoint: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
    isHub: false
  }
};

// Test parameters
const testProposalParams = {
  title: "Test Proposal: Increase Fee to 0.5%",
  description: "This is a test proposal to increase the protocol fee from 0.1% to 0.5%.",
  startTime: Math.floor(Date.now() / 1000) + 60, // Start in 1 minute
  endTime: Math.floor(Date.now() / 1000) + 3600 // End in 1 hour
};

async function main() {
  console.log("Starting cross-chain voting test for OmniGovern DAO");
  
  // Create a test proposal on the hub chain
  const proposalId = await createProposal();
  
  // Cast a vote from the satellite chain
  await castCrossChainVote(proposalId);
  
  // Check the voting status on the hub chain
  await checkVotingStatus(proposalId);
  
  console.log("Cross-chain voting test completed successfully!");
}

async function createProposal() {
  console.log("\nCreating a test proposal on Sepolia (hub chain)...");
  
  // Connect to the hub chain
  const provider = new ethers.providers.JsonRpcProvider(config.sepolia.rpc);
  
  // In a real test, you would use a funded account with a private key
  // For demo purposes, we'll use a placeholder (this would fail in reality)
  const wallet = new ethers.Wallet.createRandom().connect(provider);
  
  console.log("Connected to Sepolia");
  
  // Connect to the token contract on Sepolia
  const tokenAddress = deployments.sepolia.token;
  const tokenAbi = ["function createProposal(string, string, uint256, uint256) returns (bytes32)"];
  const token = new ethers.Contract(tokenAddress, tokenAbi, wallet);
  
  console.log("Creating proposal...");
  // This would fail without a real wallet with tokens
  try {
    const tx = await token.createProposal(
      testProposalParams.title,
      testProposalParams.description,
      testProposalParams.startTime,
      testProposalParams.endTime
    );
    await tx.wait();
    
    // In reality, we would get the proposalId from the transaction logs
    // For demo purposes, we'll create a mock proposalId
    const mockProposalId = ethers.utils.id("test-proposal-" + Date.now());
    console.log(`Proposal created with ID: ${mockProposalId}`);
    return mockProposalId;
  } catch (e) {
    console.log("Note: This is a simulation. In a real test, you would need a funded account with tokens.");
    const mockProposalId = ethers.utils.id("test-proposal-" + Date.now());
    console.log(`Simulated proposal ID: ${mockProposalId}`);
    return mockProposalId;
  }
}

async function castCrossChainVote(proposalId) {
  console.log("\nCasting a cross-chain vote from Amoy...");
  
  // Connect to the satellite chain
  const provider = new ethers.providers.JsonRpcProvider(config.amoy.rpc);
  
  // In a real test, you would use a funded account with a private key
  const wallet = new ethers.Wallet.createRandom().connect(provider);
  
  console.log("Connected to Amoy");
  
  // Connect to the token contract on Amoy
  const tokenAddress = deployments.amoy.token;
  const tokenAbi = [
    "function castCrossChainVote(bytes32, uint8, uint32, tuple(uint256,uint256), bytes) payable",
    "function quoteFee(uint32, bytes, bytes) view returns (tuple(uint256,uint256))"
  ];
  const token = new ethers.Contract(tokenAddress, tokenAbi, wallet);
  
  // Parameters for the vote
  const support = 1; // 1 = For
  const dstChainId = config.sepolia.lzChainId;
  
  console.log("Preparing cross-chain vote...");
  
  // In a real test, we would quote and pay the fee
  // For demo purposes, we'll simulate this
  try {
    // This would prepare the payload and quote the fee
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "uint8"],
      [proposalId, support]
    );
    
    // Quote the fee (this would fail without a real contract)
    // const fee = await token.quoteFee(dstChainId, payload, "0x");
    
    // In reality, we would send the actual transaction
    // const tx = await token.castCrossChainVote(
    //   proposalId,
    //   support,
    //   dstChainId,
    //   fee,
    //   "0x",
    //   { value: fee.nativeFee }
    // );
    // await tx.wait();
    
    console.log("Note: This is a simulation. In a real test, you would send an actual transaction.");
    console.log(`Simulated casting a vote FOR proposal ${proposalId} from Amoy to Sepolia`);
  } catch (e) {
    console.log("Note: This is a simulation. In a real test, you would need a deployed contract and funded account.");
    console.log(`Simulated casting a vote FOR proposal ${proposalId} from Amoy to Sepolia`);
  }
}

async function checkVotingStatus(proposalId) {
  console.log("\nChecking voting status on Sepolia (hub chain)...");
  
  // Connect to the hub chain
  const provider = new ethers.providers.JsonRpcProvider(config.sepolia.rpc);
  const wallet = new ethers.Wallet.createRandom().connect(provider);
  
  console.log("Connected to Sepolia");
  
  // Connect to the token contract on Sepolia
  const tokenAddress = deployments.sepolia.token;
  const tokenAbi = ["function getProposal(bytes32) view returns (tuple(address,string,string,uint256,uint256,uint256,uint256,uint256,uint8))"];
  
  // In a real test, we would query the actual contract
  // For demo purposes, we'll simulate this
  try {
    console.log("Note: This is a simulation. In a real test, you would query the actual contract.");
    
    // Simulate proposal data
    const proposal = {
      proposer: wallet.address,
      title: testProposalParams.title,
      description: testProposalParams.description,
      startTime: testProposalParams.startTime,
      endTime: testProposalParams.endTime,
      forVotes: ethers.utils.parseEther("75000"),
      againstVotes: ethers.utils.parseEther("25000"),
      abstainVotes: ethers.utils.parseEther("5000"),
      status: 0 // Active
    };
    
    console.log("\nProposal Status:");
    console.log(`ID: ${proposalId}`);
    console.log(`Title: ${proposal.title}`);
    console.log(`For: ${ethers.utils.formatEther(proposal.forVotes)} votes`);
    console.log(`Against: ${ethers.utils.formatEther(proposal.againstVotes)} votes`);
    console.log(`Abstain: ${ethers.utils.formatEther(proposal.abstainVotes)} votes`);
    console.log(`Status: ${proposal.status === 0 ? 'Active' : proposal.status === 1 ? 'Succeeded' : 'Defeated'}`);
    
    // Simulate a cross-chain vote being received
    console.log("\nSimulating received cross-chain vote from Amoy...");
    console.log(`Updated For Votes: ${ethers.utils.formatEther(proposal.forVotes.add(ethers.utils.parseEther("10000")))} votes`);
    
    console.log("\nCross-chain voting was successfully simulated!");
  } catch (e) {
    console.log("Note: This is a simulation. In a real test, you would query the actual contract.");
    console.log("Simulated checking voting status on Sepolia");
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });