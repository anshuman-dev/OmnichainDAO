// Contract Service - Handles all interactions with smart contracts
import { ethers } from 'ethers';
import { Network } from '../lib/networkConfig';
import { getContractAddresses, getLzChainId } from '../config/contracts';
import { getOmniGovernTokenContract, OmniGovernToken } from '../contracts/IOmniGovernToken';
import { getOmniProposalExecutorContract, OmniProposalExecutor } from '../contracts/IOmniProposalExecutor';
import { getDVNConfigManagerContract, DVNConfigManager } from '../contracts/IDVNConfigManager';

// Error types for contract interactions
export enum ContractErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Custom error class for contract interactions
export class ContractError extends Error {
  type: ContractErrorType;
  originalError?: any;
  
  constructor(message: string, type: ContractErrorType, originalError?: any) {
    super(message);
    this.name = 'ContractError';
    this.type = type;
    this.originalError = originalError;
  }
}

// Parse errors from ethers.js
function parseContractError(error: any): ContractError {
  console.error('Contract error:', error);
  
  if (error.code === 4001 || error.message?.includes('user rejected')) {
    return new ContractError('Transaction rejected by user', ContractErrorType.USER_REJECTED, error);
  }
  
  if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
    return new ContractError('Insufficient funds for transaction', ContractErrorType.INSUFFICIENT_FUNDS, error);
  }
  
  if (error.message?.includes('invalid parameters')) {
    return new ContractError('Invalid parameters for transaction', ContractErrorType.INVALID_PARAMETERS, error);
  }
  
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
    return new ContractError('Network connection error', ContractErrorType.CONNECTION_ERROR, error);
  }
  
  if (error.code === 'CALL_EXCEPTION' || error.message?.includes('execution reverted')) {
    let reason = 'Transaction failed';
    try {
      // Try to extract revert reason
      if (error.data) {
        const reasonBytes = error.data.substring(10);
        reason = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + reasonBytes)[0];
      }
    } catch (e) {
      // Unable to extract reason
    }
    return new ContractError(`Transaction error: ${reason}`, ContractErrorType.TRANSACTION_ERROR, error);
  }
  
  return new ContractError('Unknown contract error', ContractErrorType.UNKNOWN_ERROR, error);
}

// Contract Service class
export class ContractService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private network: Network | null = null;
  
  // Initialize with provider and network
  constructor(provider?: ethers.providers.Web3Provider, network?: Network) {
    if (provider) {
      this.setProvider(provider);
    }
    if (network) {
      this.setNetwork(network);
    }
  }
  
  // Set the ethers provider
  setProvider(provider: ethers.providers.Web3Provider): void {
    this.provider = provider;
    this.signer = provider.getSigner();
  }
  
  // Set current network
  setNetwork(network: Network): void {
    this.network = network;
  }
  
  // Ensure provider and network are set
  private ensureInitialized(): void {
    if (!this.provider || !this.signer) {
      throw new ContractError(
        'Wallet not connected', 
        ContractErrorType.CONNECTION_ERROR
      );
    }
    
    if (!this.network) {
      throw new ContractError(
        'Network not selected', 
        ContractErrorType.CONNECTION_ERROR
      );
    }
  }
  
  // Get contract instances based on current network
  private getContracts(): {
    tokenContract: OmniGovernToken;
    proposalExecutor: OmniProposalExecutor;
    dvnManager: DVNConfigManager;
  } {
    this.ensureInitialized();
    
    const addresses = getContractAddresses(this.network!);
    if (!addresses) {
      throw new ContractError(
        `Contracts not deployed on ${this.network!.name}`, 
        ContractErrorType.CONNECTION_ERROR
      );
    }
    
    return {
      tokenContract: getOmniGovernTokenContract(addresses.tokenContract, this.signer!),
      proposalExecutor: getOmniProposalExecutorContract(addresses.proposalExecutor, this.signer!),
      dvnManager: getDVNConfigManagerContract(addresses.dvnManager, this.signer!)
    };
  }
  
  // Get user's account address
  async getAccount(): Promise<string> {
    this.ensureInitialized();
    return await this.signer!.getAddress();
  }
  
  // Get user's token balance
  async getTokenBalance(): Promise<string> {
    try {
      const { tokenContract } = this.getContracts();
      const account = await this.getAccount();
      const balance = await tokenContract.balanceOf(account);
      return ethers.utils.formatUnits(balance, 18);
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Get total token supply
  async getTotalSupply(): Promise<string> {
    try {
      const { tokenContract } = this.getContracts();
      const supply = await tokenContract.totalSupply();
      return ethers.utils.formatUnits(supply, 18);
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Bridge tokens to another chain
  async bridgeTokens(
    amount: string, 
    destinationChainId: number,
    onStatusUpdate?: (status: string) => void
  ): Promise<string> {
    try {
      const { tokenContract } = this.getContracts();
      const account = await this.getAccount();
      const amountWei = ethers.utils.parseUnits(amount, 18);
      
      // Get destination chain's LayerZero ID
      const lzChainId = getLzChainId(destinationChainId);
      if (!lzChainId) {
        throw new ContractError(
          `Destination chain ${destinationChainId} not supported by LayerZero`, 
          ContractErrorType.INVALID_PARAMETERS
        );
      }
      
      onStatusUpdate?.('Estimating fees...');
      
      // Estimate fee for cross-chain transfer
      const toAddress = ethers.utils.defaultAbiCoder.encode(['address'], [account]);
      const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, 200000]);
      const [nativeFee] = await tokenContract.estimateSendFee(
        lzChainId, 
        toAddress, 
        amountWei, 
        false, 
        adapterParams
      );
      
      onStatusUpdate?.('Sending transaction...');
      
      // Send the transaction
      const tx = await tokenContract.sendFrom(
        account,
        lzChainId,
        toAddress,
        amountWei,
        account,
        ethers.constants.AddressZero,
        adapterParams,
        { value: nativeFee }
      );
      
      onStatusUpdate?.('Transaction submitted. Waiting for confirmation...');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      onStatusUpdate?.('Transaction confirmed! Tokens are on their way to the destination chain.');
      
      return receipt.transactionHash;
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Submit a proposal
  async createProposal(
    title: string,
    description: string,
    actions: string[],
    targetChains: number[]
  ): Promise<number> {
    try {
      const { proposalExecutor } = this.getContracts();
      
      // Convert target chains to LayerZero chain IDs
      const lzTargetChains = targetChains.map(chainId => {
        const lzChainId = getLzChainId(chainId);
        if (!lzChainId) {
          throw new ContractError(
            `Target chain ${chainId} not supported by LayerZero`, 
            ContractErrorType.INVALID_PARAMETERS
          );
        }
        return lzChainId;
      });
      
      // Create the proposal
      const tx = await proposalExecutor.createProposal(
        title,
        description,
        actions,
        lzTargetChains
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get proposal ID from events
      const event = receipt.events?.find(e => e.event === 'ProposalCreated');
      if (!event || !event.args) {
        throw new ContractError(
          'Could not retrieve proposal ID from transaction receipt', 
          ContractErrorType.TRANSACTION_ERROR
        );
      }
      
      return event.args.proposalId.toNumber();
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Vote on a proposal
  async castVote(
    proposalId: number,
    support: 0 | 1 | 2 // 0: Against, 1: For, 2: Abstain
  ): Promise<boolean> {
    try {
      const { proposalExecutor } = this.getContracts();
      
      // Cast the vote
      const tx = await proposalExecutor.castVote(proposalId, support);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      return true;
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Execute a proposal with lzCompose for atomic execution
  async executeProposal(proposalId: number): Promise<string> {
    try {
      const { proposalExecutor } = this.getContracts();
      
      // Estimate execution fee
      const [nativeFee] = await proposalExecutor.estimateExecutionFee(proposalId);
      
      // Execute with lzCompose
      const tx = await proposalExecutor.executeWithLzCompose(proposalId, {
        value: nativeFee
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get messageId from events
      const event = receipt.events?.find(e => e.event === 'ProposalExecuted');
      if (!event || !event.args) {
        throw new ContractError(
          'Could not retrieve message ID from transaction receipt', 
          ContractErrorType.TRANSACTION_ERROR
        );
      }
      
      return event.args.messageId;
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Configure DVN settings
  async configureDVN(
    destinationChainId: number,
    dvnAddress: string,
    enabled: boolean
  ): Promise<boolean> {
    try {
      const { dvnManager } = this.getContracts();
      
      // Get destination chain's LayerZero ID
      const lzChainId = getLzChainId(destinationChainId);
      if (!lzChainId) {
        throw new ContractError(
          `Destination chain ${destinationChainId} not supported by LayerZero`, 
          ContractErrorType.INVALID_PARAMETERS
        );
      }
      
      // Set DVN configuration
      const tx = await dvnManager.setDVN(lzChainId, dvnAddress, enabled);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      return true;
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Set DVN required signatures
  async setDVNRequiredSignatures(
    destinationChainId: number,
    dvnAddress: string,
    requiredSignatures: number
  ): Promise<boolean> {
    try {
      const { dvnManager } = this.getContracts();
      
      // Get destination chain's LayerZero ID
      const lzChainId = getLzChainId(destinationChainId);
      if (!lzChainId) {
        throw new ContractError(
          `Destination chain ${destinationChainId} not supported by LayerZero`, 
          ContractErrorType.INVALID_PARAMETERS
        );
      }
      
      // Set required signatures
      const tx = await dvnManager.setDVNRequiredSignatures(
        lzChainId, 
        dvnAddress, 
        requiredSignatures
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      return true;
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Set security level for a destination chain
  async setSecurityLevel(
    destinationChainId: number,
    securityLevel: number
  ): Promise<boolean> {
    try {
      const { dvnManager } = this.getContracts();
      
      // Get destination chain's LayerZero ID
      const lzChainId = getLzChainId(destinationChainId);
      if (!lzChainId) {
        throw new ContractError(
          `Destination chain ${destinationChainId} not supported by LayerZero`, 
          ContractErrorType.INVALID_PARAMETERS
        );
      }
      
      // Set security level
      const tx = await dvnManager.setSecurityLevel(lzChainId, securityLevel);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      return true;
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Get DVN configuration for a destination chain
  async getDVNs(destinationChainId: number): Promise<{
    addresses: string[];
    enabled: boolean[];
    requiredSignatures: number[];
  }> {
    try {
      const { dvnManager } = this.getContracts();
      
      // Get destination chain's LayerZero ID
      const lzChainId = getLzChainId(destinationChainId);
      if (!lzChainId) {
        throw new ContractError(
          `Destination chain ${destinationChainId} not supported by LayerZero`, 
          ContractErrorType.INVALID_PARAMETERS
        );
      }
      
      // Get DVNs
      const [addresses, enabled, requiredSignatures] = await dvnManager.getDVNs(lzChainId);
      
      return { addresses, enabled, requiredSignatures };
    } catch (error) {
      throw parseContractError(error);
    }
  }
  
  // Get security level for a destination chain
  async getSecurityLevel(destinationChainId: number): Promise<number> {
    try {
      const { dvnManager } = this.getContracts();
      
      // Get destination chain's LayerZero ID
      const lzChainId = getLzChainId(destinationChainId);
      if (!lzChainId) {
        throw new ContractError(
          `Destination chain ${destinationChainId} not supported by LayerZero`, 
          ContractErrorType.INVALID_PARAMETERS
        );
      }
      
      // Get security level
      return await dvnManager.getSecurityLevel(lzChainId);
    } catch (error) {
      throw parseContractError(error);
    }
  }
}

// Create singleton instance
const contractService = new ContractService();
export default contractService;