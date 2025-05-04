import { ethers } from 'ethers';
import OmniGovernorABI from '../contracts/abis/OmniGovernor.json';
import OmniGovernTokenABI from '../contracts/abis/OmniGovernToken.json';
import type { Network } from '../types/token';
import { getProvider } from './ethereum';

/**
 * Interface for proposal details
 */
export interface ProposalDetails {
  id: string;
  proposer: string;
  description: string;
  status: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  deadline: number;
  snapshot: number;
  quorum: string;
  executionETA: number | null;
}

/**
 * Interface for vote details
 */
export interface VoteDetails {
  voter: string;
  support: 'against' | 'for' | 'abstain';
  votes: string;
  reason: string | null;
  timestamp: number;
}

/**
 * Get the OmniGovernor contract instance
 */
export function getGovernorContract(governorAddress: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(governorAddress, OmniGovernorABI, signerOrProvider);
}

/**
 * Get proposal details
 */
export async function getProposalDetails(
  network: Network,
  governorAddress: string,
  proposalId: string
): Promise<ProposalDetails> {
  const provider = getProvider(network);
  const governor = getGovernorContract(governorAddress, provider);
  
  const state = await governor.state(proposalId);
  const [snapshot, deadline] = await Promise.all([
    governor.proposalSnapshot(proposalId),
    governor.proposalDeadline(proposalId)
  ]);
  
  const [againstVotes, forVotes, abstainVotes] = await governor.proposalVotes(proposalId);
  const quorum = await governor.quorum(snapshot);
  const proposer = await governor.proposalProposer(proposalId);
  
  // ETA only exists for queued proposals
  let executionETA = null;
  if (state === 5) { // 5 = Queued
    executionETA = await governor.proposalEta(proposalId);
  }
  
  // Get proposal description - we would need to find the create proposal event
  // For demo purposes, use a placeholder
  const description = `Proposal ${proposalId}`;
  
  // Map state number to human-readable status
  const statusMap: Record<number, string> = {
    0: 'Pending',
    1: 'Active',
    2: 'Canceled',
    3: 'Defeated',
    4: 'Succeeded',
    5: 'Queued',
    6: 'Expired',
    7: 'Executed'
  };
  
  return {
    id: proposalId,
    proposer,
    description,
    status: statusMap[state] || 'Unknown',
    forVotes: ethers.formatEther(forVotes),
    againstVotes: ethers.formatEther(againstVotes),
    abstainVotes: ethers.formatEther(abstainVotes),
    deadline: Number(deadline),
    snapshot: Number(snapshot),
    quorum: ethers.formatEther(quorum),
    executionETA: executionETA ? Number(executionETA) : null
  };
}

/**
 * Create a new proposal
 */
export async function createProposal(
  network: Network,
  governorAddress: string,
  targets: string[],
  values: string[],
  calldatas: string[],
  description: string,
  signer: ethers.Signer
): Promise<string> {
  const governor = getGovernorContract(governorAddress, signer);
  
  // Convert values to BigInts
  const valuesBigInt = values.map(v => ethers.parseEther(v));
  
  const tx = await governor.propose(
    targets,
    valuesBigInt,
    calldatas,
    description
  );
  
  const receipt = await tx.wait();
  
  // Extract the proposal ID from the event logs
  const proposalCreatedEvent = (receipt?.logs || [])
    .filter((log: any) => log.fragment && log.fragment.name === 'ProposalCreated')
    .map((log: any) => governor.interface.parseLog(log))[0];
  
  if (!proposalCreatedEvent) {
    throw new Error('Failed to find ProposalCreated event in transaction logs');
  }
  
  return proposalCreatedEvent.args.proposalId.toString();
}

/**
 * Cast a vote on a proposal
 */
export async function castVote(
  network: Network,
  governorAddress: string,
  proposalId: string,
  support: 0 | 1 | 2, // 0 = against, 1 = for, 2 = abstain
  reason: string | null,
  signer: ethers.Signer
): Promise<boolean> {
  const governor = getGovernorContract(governorAddress, signer);
  
  let tx;
  if (reason) {
    tx = await governor.castVoteWithReason(proposalId, support, reason);
  } else {
    tx = await governor.castVote(proposalId, support);
  }
  
  await tx.wait();
  return true;
}

/**
 * Send a cross-chain vote
 */
export async function sendCrossChainVote(
  network: Network,
  governorAddress: string,
  proposalId: string,
  support: 0 | 1 | 2, // 0 = against, 1 = for, 2 = abstain
  dstChainId: number,
  votes: string,
  signer: ethers.Signer
): Promise<boolean> {
  const governor = getGovernorContract(governorAddress, signer);
  
  // First, estimate the required fee
  const provider = getProvider(network);
  const estimatedFee = await provider.estimateGas({
    to: governorAddress,
    data: governor.interface.encodeFunctionData('sendCrossChainVote', [
      proposalId,
      support,
      dstChainId,
      ethers.parseEther(votes)
    ])
  });
  
  // Add 20% buffer to the estimated gas
  const gasBuffer = estimatedFee * BigInt(12) / BigInt(10);
  
  // Send the transaction with the estimated fee
  const tx = await governor.sendCrossChainVote(
    proposalId,
    support,
    dstChainId,
    ethers.parseEther(votes),
    { value: gasBuffer }
  );
  
  await tx.wait();
  return true;
}

/**
 * Execute a successful proposal
 */
export async function executeProposal(
  network: Network,
  governorAddress: string,
  proposalId: string,
  targets: string[],
  values: string[],
  calldatas: string[],
  descriptionHash: string,
  signer: ethers.Signer
): Promise<boolean> {
  const governor = getGovernorContract(governorAddress, signer);
  
  // Convert values to BigInts
  const valuesBigInt = values.map(v => ethers.parseEther(v));
  
  const tx = await governor.execute(
    targets,
    valuesBigInt,
    calldatas,
    descriptionHash
  );
  
  await tx.wait();
  return true;
}

/**
 * Check if an account has voted on a proposal
 */
export async function hasVoted(
  network: Network,
  governorAddress: string,
  proposalId: string,
  account: string
): Promise<boolean> {
  const provider = getProvider(network);
  const governor = getGovernorContract(governorAddress, provider);
  
  return governor.hasVoted(proposalId, account);
}

/**
 * Get the delegate of an account
 */
export async function getDelegateOf(
  network: Network,
  tokenAddress: string,
  account: string
): Promise<string> {
  const provider = getProvider(network);
  const token = new ethers.Contract(tokenAddress, OmniGovernTokenABI, provider);
  
  return token.delegates(account);
}

/**
 * Delegate voting power to another address
 */
export async function delegateVotingPower(
  network: Network,
  tokenAddress: string,
  delegatee: string,
  signer: ethers.Signer
): Promise<boolean> {
  const token = new ethers.Contract(tokenAddress, OmniGovernTokenABI, signer);
  
  const tx = await token.delegate(delegatee);
  await tx.wait();
  
  return true;
}

/**
 * Get the voting power of an account
 */
export async function getVotingPower(
  network: Network,
  tokenAddress: string,
  account: string
): Promise<string> {
  const provider = getProvider(network);
  const token = new ethers.Contract(tokenAddress, OmniGovernTokenABI, provider);
  
  const votes = await token.getVotes(account);
  return ethers.formatEther(votes);
}

/**
 * Get a list of recent proposals (for demo, return mock data)
 */
export async function getRecentProposals(
  network: Network,
  governorAddress: string
): Promise<ProposalDetails[]> {
  // In a real implementation, we would query events from the blockchain
  // Here, we're returning placeholder data for the demo
  return [
    {
      id: '123456789',
      proposer: '0x1234567890123456789012345678901234567890',
      description: 'Add support for new blockchain',
      status: 'Active',
      forVotes: '1000000',
      againstVotes: '500000',
      abstainVotes: '200000',
      deadline: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days from now
      snapshot: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      quorum: '2000000',
      executionETA: null
    }
  ];
}