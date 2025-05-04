import { useState, useCallback } from 'react';
import { useNetwork } from './useNetwork';
import { useWallet } from './useWallet';
import { useToast } from './use-toast';
import {
  getProposalDetails,
  createProposal,
  castVote,
  sendCrossChainVote,
  executeProposal,
  hasVoted,
  getDelegateOf,
  delegateVotingPower,
  getVotingPower,
  getRecentProposals,
  type ProposalDetails,
  type VoteDetails
} from '../services/governance';
import { DEFAULT_CONTRACTS } from '../lib/constants';

export function useGovernance() {
  const { currentNetwork } = useNetwork();
  const { isConnected, address, signer } = useWallet();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get proposal details
  const getProposal = useCallback(
    async (proposalId: string) => {
      if (!isConnected || !currentNetwork) {
        toast({
          title: 'Not connected',
          description: 'Please connect your wallet to view proposal details',
          variant: 'destructive'
        });
        return null;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        const proposal = await getProposalDetails(currentNetwork, governorAddress, proposalId);
        return proposal;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to get proposal details';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, currentNetwork, toast]
  );
  
  // Create a new proposal
  const proposeAction = useCallback(
    async (targets: string[], values: string[], calldatas: string[], description: string) => {
      if (!isConnected || !signer || !currentNetwork) {
        toast({
          title: 'Not connected',
          description: 'Please connect your wallet to create a proposal',
          variant: 'destructive'
        });
        return null;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        const proposalId = await createProposal(
          currentNetwork,
          governorAddress,
          targets,
          values,
          calldatas,
          description,
          signer
        );
        
        toast({
          title: 'Proposal created',
          description: `Proposal ID: ${proposalId}`,
        });
        
        return proposalId;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create proposal';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, signer, currentNetwork, toast]
  );
  
  // Vote on a proposal
  const vote = useCallback(
    async (proposalId: string, support: 0 | 1 | 2, reason?: string) => {
      if (!isConnected || !signer || !currentNetwork) {
        toast({
          title: 'Not connected',
          description: 'Please connect your wallet to vote',
          variant: 'destructive'
        });
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        await castVote(currentNetwork, governorAddress, proposalId, support, reason || null, signer);
        
        const voteType = support === 0 ? 'against' : support === 1 ? 'for' : 'abstain';
        toast({
          title: 'Vote cast',
          description: `You voted ${voteType} proposal ${proposalId}`,
        });
        
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to cast vote';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, signer, currentNetwork, toast]
  );
  
  // Vote across chains
  const crossChainVote = useCallback(
    async (proposalId: string, support: 0 | 1 | 2, dstChainId: number, votes: string) => {
      if (!isConnected || !signer || !currentNetwork) {
        toast({
          title: 'Not connected',
          description: 'Please connect your wallet to vote across chains',
          variant: 'destructive'
        });
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        await sendCrossChainVote(
          currentNetwork,
          governorAddress,
          proposalId,
          support,
          dstChainId,
          votes,
          signer
        );
        
        const voteType = support === 0 ? 'against' : support === 1 ? 'for' : 'abstain';
        toast({
          title: 'Cross-chain vote sent',
          description: `You voted ${voteType} proposal ${proposalId} on chain ${dstChainId}`,
        });
        
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to send cross-chain vote';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, signer, currentNetwork, toast]
  );
  
  // Execute a proposal
  const execute = useCallback(
    async (
      proposalId: string,
      targets: string[],
      values: string[],
      calldatas: string[],
      descriptionHash: string
    ) => {
      if (!isConnected || !signer || !currentNetwork) {
        toast({
          title: 'Not connected',
          description: 'Please connect your wallet to execute this proposal',
          variant: 'destructive'
        });
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        await executeProposal(
          currentNetwork,
          governorAddress,
          proposalId,
          targets,
          values,
          calldatas,
          descriptionHash,
          signer
        );
        
        toast({
          title: 'Proposal executed',
          description: `Proposal ${proposalId} has been executed`,
        });
        
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to execute proposal';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, signer, currentNetwork, toast]
  );
  
  // Check if user has voted
  const checkVoted = useCallback(
    async (proposalId: string) => {
      if (!isConnected || !address || !currentNetwork) return false;
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        return hasVoted(currentNetwork, governorAddress, proposalId, address);
      } catch (err) {
        console.error('Failed to check if user has voted:', err);
        return false;
      }
    },
    [isConnected, address, currentNetwork]
  );
  
  // Get user's voting power
  const getVoterPower = useCallback(
    async () => {
      if (!isConnected || !address || !currentNetwork) return '0';
      
      try {
        // Use default token address or pass it as a parameter
        const tokenAddress = DEFAULT_CONTRACTS.oft;
        return getVotingPower(currentNetwork, tokenAddress, address);
      } catch (err) {
        console.error('Failed to get voting power:', err);
        return '0';
      }
    },
    [isConnected, address, currentNetwork]
  );
  
  // Delegate voting power
  const delegate = useCallback(
    async (delegatee: string) => {
      if (!isConnected || !signer || !currentNetwork) {
        toast({
          title: 'Not connected',
          description: 'Please connect your wallet to delegate voting power',
          variant: 'destructive'
        });
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default token address or pass it as a parameter
        const tokenAddress = DEFAULT_CONTRACTS.oft;
        await delegateVotingPower(currentNetwork, tokenAddress, delegatee, signer);
        
        toast({
          title: 'Voting power delegated',
          description: `You delegated your voting power to ${delegatee}`,
        });
        
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to delegate voting power';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, signer, currentNetwork, toast]
  );
  
  // Get recent proposals
  const getProposals = useCallback(
    async () => {
      if (!currentNetwork) return [];
      
      setLoading(true);
      setError(null);
      
      try {
        // Use default governor address or pass it as a parameter
        const governorAddress = DEFAULT_CONTRACTS.governor;
        return await getRecentProposals(currentNetwork, governorAddress);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to get recent proposals';
        setError(errorMessage);
        console.error(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [currentNetwork]
  );
  
  return {
    loading,
    error,
    getProposal,
    proposeAction,
    vote,
    crossChainVote,
    execute,
    checkVoted,
    getVoterPower,
    delegate,
    getProposals
  };
}