// Interface for OmniProposalExecutor - LayerZero Atomic Execution using lzCompose
import { ethers } from 'ethers';

export const OmniProposalExecutorABI = [
  // Proposal Management
  "function createProposal(string calldata title, string calldata description, bytes[] calldata actions, uint16[] calldata targetChains) returns (uint256)",
  "function executeProposal(uint256 proposalId) returns (bool)",
  "function cancelProposal(uint256 proposalId) returns (bool)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, string title, string description, address proposer, uint8 status, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes))",
  "function getProposalActions(uint256 proposalId) view returns (bytes[] memory, uint16[] memory)",
  "function getProposalExecutionStatus(uint256 proposalId) view returns (uint8[] memory, uint16[] memory)",
  
  // Voting
  "function castVote(uint256 proposalId, uint8 support) returns (bool)",
  "function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) returns (bool)",
  "function getReceipt(uint256 proposalId, address voter) view returns (tuple(bool hasVoted, uint8 support, uint256 votes))",
  
  // Proposal Execution (lzCompose)
  "function estimateExecutionFee(uint256 proposalId) view returns (uint nativeFee, uint zroFee)",
  "function executeWithLzCompose(uint256 proposalId) payable returns (bytes32 messageId)",
  "function getExecutionStatus(bytes32 messageId) view returns (uint8)",
  
  // Events
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, bytes[] actions, uint16[] targetChains, uint256 startTime, uint256 endTime)",
  "event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight)",
  "event ProposalExecuted(uint256 indexed proposalId, bytes32 messageId)",
  "event ProposalCanceled(uint256 indexed proposalId)",
  "event ExecutionSuccess(bytes32 indexed messageId, uint16[] chains)",
  "event ExecutionFailure(bytes32 indexed messageId, uint16[] chains, string reason)"
];

export interface OmniProposalExecutor extends ethers.Contract {
  // Proposal Management
  createProposal(
    title: string,
    description: string,
    actions: string[],
    targetChains: number[]
  ): Promise<ethers.ContractTransaction>;
  
  executeProposal(proposalId: ethers.BigNumberish): Promise<ethers.ContractTransaction>;
  
  cancelProposal(proposalId: ethers.BigNumberish): Promise<ethers.ContractTransaction>;
  
  getProposal(proposalId: ethers.BigNumberish): Promise<{
    id: ethers.BigNumber;
    title: string;
    description: string;
    proposer: string;
    status: number;
    startTime: ethers.BigNumber;
    endTime: ethers.BigNumber;
    forVotes: ethers.BigNumber;
    againstVotes: ethers.BigNumber;
    abstainVotes: ethers.BigNumber;
  }>;
  
  getProposalActions(proposalId: ethers.BigNumberish): Promise<[string[], number[]]>;
  
  getProposalExecutionStatus(proposalId: ethers.BigNumberish): Promise<[number[], number[]]>;
  
  // Voting
  castVote(
    proposalId: ethers.BigNumberish,
    support: number
  ): Promise<ethers.ContractTransaction>;
  
  castVoteBySig(
    proposalId: ethers.BigNumberish,
    support: number,
    v: number,
    r: string,
    s: string
  ): Promise<ethers.ContractTransaction>;
  
  getReceipt(proposalId: ethers.BigNumberish, voter: string): Promise<{
    hasVoted: boolean;
    support: number;
    votes: ethers.BigNumber;
  }>;
  
  // Proposal Execution (lzCompose)
  estimateExecutionFee(proposalId: ethers.BigNumberish): Promise<[ethers.BigNumber, ethers.BigNumber]>;
  
  executeWithLzCompose(
    proposalId: ethers.BigNumberish,
    overrides?: ethers.PayableOverrides
  ): Promise<ethers.ContractTransaction>;
  
  getExecutionStatus(messageId: string): Promise<number>;
}

export function getOmniProposalExecutorContract(
  address: string,
  provider: ethers.providers.Provider | ethers.Signer
): OmniProposalExecutor {
  return new ethers.Contract(address, OmniProposalExecutorABI, provider) as OmniProposalExecutor;
}