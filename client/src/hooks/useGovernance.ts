// Hook for governance proposal creation and voting with OmniProposalExecutor
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from './use-toast';
import { useNetwork } from './useNetwork';
import { useContractService } from './useContractService';
import { ContractErrorType, ProposalData } from '../services/contractService';

export enum ProposalStatus {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7
}

export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2
}

export interface ProposalDetails {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  startTime: Date;
  endTime: Date;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  actions: string[];
  targetChains: number[];
  executionStatus: {
    chainId: number;
    status: number;
  }[];
}

export interface VoteReceipt {
  hasVoted: boolean;
  support: VoteType;
  votes: string;
}

export function useGovernance() {
  const { toast } = useToast();
  const { currentNetwork, networks } = useNetwork();
  const { contractService, isInitialized } = useContractService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProposalData | null>(null);
  const [voteReceipt, setVoteReceipt] = useState<VoteReceipt | null>(null);
  
  // Fetch active proposals
  const fetchProposals = useCallback(async () => {
    if (!isInitialized || !currentNetwork) return;
    
    setIsLoading(true);
    
    try {
      // Get proposals from the contract service
      const realProposals = await contractService.getProposals();
      
      // If we have real proposals, use them
      if (realProposals && realProposals.length > 0) {
        setProposals(realProposals);
      } else {
        // If no proposals found, add default ones to demonstrate UI
        // In a production app, we would show an empty state
        console.log("No proposals found in contract, showing example proposals");
        
        setProposals([
          {
            id: '1',
            title: 'Upgrade OmniToken implementation',
            description: 'Proposal to upgrade the OmniToken implementation to v2 with improved gas efficiency and new features.',
            proposer: '0x1234567890123456789012345678901234567890',
            status: ProposalStatus.Active,
            startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            forVotes: '10000000',
            againstVotes: '5000000',
            abstainVotes: '2000000',
            actions: ['0x1234...'], // Encoded actions
            targetChains: [11155111, 80002], // Sepolia and Amoy
            executionStatus: [
              { chainId: 11155111, status: 0 }, // Pending
              { chainId: 80002, status: 0 }, // Pending
            ]
          },
          {
            id: '2',
            title: 'Add support for BNB Chain',
            description: 'Add BNB Chain to the list of supported chains for cross-chain governance.',
            proposer: '0x2345678901234567890123456789012345678901',
            status: ProposalStatus.Succeeded,
            startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            forVotes: '15000000',
            againstVotes: '2000000',
            abstainVotes: '1000000',
            actions: ['0x2345...'], // Encoded actions
            targetChains: [11155111, 80002], // Sepolia and Amoy
            executionStatus: [
              { chainId: 11155111, status: 0 }, // Pending
              { chainId: 80002, status: 0 }, // Pending
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: 'Failed to load proposals',
        description: 'Could not retrieve governance proposals. Please try again later.',
        variant: 'destructive',
      });
      
      // If we fail to fetch, show example proposals
      setProposals([
        {
          id: '1',
          title: 'Upgrade OmniToken implementation',
          description: 'Proposal to upgrade the OmniToken implementation to v2 with improved gas efficiency and new features.',
          proposer: '0x1234567890123456789012345678901234567890',
          status: ProposalStatus.Active,
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          forVotes: '10000000',
          againstVotes: '5000000',
          abstainVotes: '2000000',
          actions: ['0x1234...'], // Encoded actions
          targetChains: [11155111, 80002], // Sepolia and Amoy
          executionStatus: [
            { chainId: 11155111, status: 0 }, // Pending
            { chainId: 80002, status: 0 }, // Pending
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [contractService, currentNetwork, isInitialized, toast]);
  
  // Get proposal details by ID
  const getProposal = useCallback(async (proposalId: string) => {
    if (!isInitialized || !currentNetwork) return null;
    
    setIsLoading(true);
    
    try {
      // Try to get from contract service first
      try {
        // Set network for contract service
        contractService.setNetwork(currentNetwork);
        
        const proposalDetails = await contractService.getProposal(parseInt(proposalId));
        
        if (proposalDetails) {
          setSelectedProposal(proposalDetails);
          return proposalDetails;
        }
      } catch (contractError) {
        console.error(`Error getting proposal from contract:`, contractError);
      }
      
      // Fallback to local cache
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (proposal) {
        setSelectedProposal(proposal);
        return proposal;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting proposal ${proposalId}:`, error);
      toast({
        title: 'Failed to load proposal',
        description: `Could not retrieve proposal #${proposalId}. Please try again later.`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contractService, currentNetwork, isInitialized, proposals, toast]);
  
  // Cast a vote on a proposal
  const castVote = useCallback(async (proposalId: string, voteType: VoteType) => {
    if (!isInitialized || !currentNetwork) {
      toast({
        title: 'Cannot vote',
        description: 'Please connect your wallet and select a network first.',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Set network for contract service
      contractService.setNetwork(currentNetwork);
      
      // Cast the vote
      await contractService.castVote(parseInt(proposalId), voteType);
      
      toast({
        title: 'Vote cast successfully',
        description: `Your vote has been recorded for proposal #${proposalId}.`,
      });
      
      // Refresh proposal list
      fetchProposals();
      
      return true;
    } catch (error: any) {
      console.error('Error casting vote:', error);
      
      // Handle different error types
      if (error.type === ContractErrorType.USER_REJECTED) {
        toast({
          title: 'Transaction rejected',
          description: 'You rejected the voting transaction.',
          variant: 'destructive',
        });
      } else if (error.type === ContractErrorType.INSUFFICIENT_FUNDS) {
        toast({
          title: 'Insufficient funds',
          description: 'You do not have enough funds to complete this transaction.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to cast vote',
          description: error.message || 'An error occurred while submitting your vote.',
          variant: 'destructive',
        });
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contractService, currentNetwork, isInitialized, toast, fetchProposals]);
  
  // Get vote receipt for a proposal
  const getVoteReceipt = useCallback(async (proposalId: string, voter: string) => {
    if (!isInitialized || !currentNetwork) return null;
    
    try {
      // Set network for contract service
      contractService.setNetwork(currentNetwork);
      
      // Get the receipt
      const receipt = await contractService.getVoteReceipt(parseInt(proposalId), voter);
      
      if (receipt) {
        const formattedReceipt = {
          hasVoted: receipt.hasVoted,
          support: receipt.support,
          votes: ethers.utils.formatUnits(receipt.votes, 18)
        };
        
        setVoteReceipt(formattedReceipt);
        return formattedReceipt;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting vote receipt for proposal ${proposalId}:`, error);
      setVoteReceipt(null);
      return null;
    }
  }, [contractService, currentNetwork, isInitialized]);
  
  // Execute a proposal
  const executeProposal = useCallback(async (proposalId: string) => {
    if (!isInitialized || !currentNetwork) {
      toast({
        title: 'Cannot execute proposal',
        description: 'Please connect your wallet and select a network first.',
        variant: 'destructive',
      });
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Set network for contract service
      contractService.setNetwork(currentNetwork);
      
      toast({
        title: 'Executing proposal',
        description: `Initiating atomic execution across all target chains...`,
      });
      
      // Execute the proposal
      const messageId = await contractService.executeProposal(parseInt(proposalId));
      
      toast({
        title: 'Proposal execution initiated',
        description: `Atomic execution started with message ID: ${messageId.substring(0, 10)}...`,
      });
      
      // Refresh proposal list
      fetchProposals();
      
      return messageId;
    } catch (error: any) {
      console.error('Error executing proposal:', error);
      
      // Handle different error types
      if (error.type === ContractErrorType.USER_REJECTED) {
        toast({
          title: 'Transaction rejected',
          description: 'You rejected the execution transaction.',
          variant: 'destructive',
        });
      } else if (error.type === ContractErrorType.INSUFFICIENT_FUNDS) {
        toast({
          title: 'Insufficient funds',
          description: 'You do not have enough funds to complete this transaction.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to execute proposal',
          description: error.message || 'An error occurred while executing the proposal.',
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contractService, currentNetwork, isInitialized, toast, fetchProposals]);
  
  // Create a new proposal
  const createProposal = useCallback(async (
    title: string,
    description: string,
    actions: string[],
    targetChains: number[]
  ) => {
    if (!isInitialized || !currentNetwork) {
      toast({
        title: 'Cannot create proposal',
        description: 'Please connect your wallet and select a network first.',
        variant: 'destructive',
      });
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Set network for contract service
      contractService.setNetwork(currentNetwork);
      
      toast({
        title: 'Creating proposal',
        description: `Submitting your proposal to the governance system...`,
      });
      
      // Create the proposal
      const proposalId = await contractService.createProposal(
        title,
        description,
        actions,
        targetChains
      );
      
      toast({
        title: 'Proposal created successfully',
        description: `Proposal #${proposalId} has been created and is now open for voting.`,
      });
      
      // Refresh proposal list
      fetchProposals();
      
      return proposalId;
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      
      // Handle different error types
      if (error.type === ContractErrorType.USER_REJECTED) {
        toast({
          title: 'Transaction rejected',
          description: 'You rejected the proposal creation transaction.',
          variant: 'destructive',
        });
      } else if (error.type === ContractErrorType.INSUFFICIENT_FUNDS) {
        toast({
          title: 'Insufficient funds',
          description: 'You do not have enough funds to complete this transaction.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to create proposal',
          description: error.message || 'An error occurred while creating the proposal.',
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contractService, currentNetwork, isInitialized, toast, fetchProposals]);
  
  // Load proposals on initialization
  useEffect(() => {
    if (isInitialized && currentNetwork) {
      fetchProposals();
    }
  }, [isInitialized, currentNetwork, fetchProposals]);
  
  return {
    isLoading,
    proposals,
    selectedProposal,
    voteReceipt,
    fetchProposals,
    getProposal,
    castVote,
    getVoteReceipt,
    executeProposal,
    createProposal
  };
}