/**
 * Transaction type definitions for the OmniGovern DAO platform
 * These types help track and display cross-chain transactions powered by LayerZero
 */

// Transaction types supported by the platform
export type TransactionType = 
  | 'token_bridge'    // OFT token bridging across chains
  | 'token_transfer'  // Standard token transfer (same chain)
  | 'proposal_creation' // Creating a governance proposal
  | 'vote'            // Casting a vote on a proposal
  | 'execution'       // Executing a passed proposal
  | 'other';          // Other transaction types

// Transaction status states
export type TransactionStatus = 
  | 'pending'                // Initial state, transaction submitted but not confirmed
  | 'source_confirmed'       // Transaction confirmed on source chain
  | 'source_failed'          // Transaction failed on source chain
  | 'in_flight'              // Message in flight across chains via LayerZero
  | 'destination_confirmed'  // Transaction confirmed on destination chain
  | 'completed'              // Transaction fully completed on all chains
  | 'failed';                // Transaction failed

// Error types that might occur during transactions
export type TransactionErrorType =
  | 'user_rejected'          // User rejected the transaction
  | 'insufficient_funds'     // Insufficient funds for transaction
  | 'slippage_too_high'      // Price slippage exceeded tolerance
  | 'gas_estimation_failed'  // Failed to estimate gas
  | 'timeout'                // Transaction timed out
  | 'network_error'          // Network connection issues
  | 'relayer_error'          // LayerZero relayer error
  | 'unknown';               // Unknown error

// Interface for LayerZero transaction objects
export interface LayerZeroTransaction {
  id: number;
  type: TransactionType;
  walletAddress: string;
  sourceChain: string;
  sourceTxHash: string;
  destinationChain?: string | null;
  destinationTxHash?: string | null;
  amount?: string | null;
  token?: string | null;
  status: string;
  messageId?: string | null;
  data?: any | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for transaction retry options
export interface TransactionRetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

// Interface for cross-chain message parameters
export interface CrossChainMessageParams {
  dstChainId: number;
  message: string;
  options: {
    gasLimit: string;
    refundAddress: string;
  };
}