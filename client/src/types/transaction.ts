/**
 * Transaction related types for LayerZero cross-chain transactions
 */

export type TransactionType = 
  | 'token_transfer'     // Regular token transfer within a chain
  | 'token_bridge'       // Cross-chain token transfer via LayerZero OFT
  | 'cross_chain_message' // Generic cross-chain message via LayerZero
  | 'proposal_creation'  // Creating a DAO proposal 
  | 'vote'               // Casting a vote on a proposal
  | 'execution';         // Executing a proposal

export type TransactionStatus = 
  | 'pending'              // Transaction initiated but not confirmed on source chain
  | 'source_confirmed'     // Transaction confirmed on source chain, waiting for destination
  | 'destination_confirmed' // Transaction confirmed on destination chain but final steps pending
  | 'completed'            // Transaction fully completed
  | 'failed';              // Transaction failed at some point

// Input for creating a new transaction
export interface CreateTransactionInput {
  type: TransactionType;
  sourceChain: string;
  sourceTxHash: string;
  walletAddress?: string;
  destinationChain?: string;
  data?: string;
  status?: TransactionStatus;
  messageId?: string;
}

// Full transaction with system-generated fields
export interface LayerZeroTransaction {
  id: number;
  type: TransactionType;
  status: TransactionStatus;
  sourceChain: string;
  destinationChain: string | null;
  walletAddress: string;
  sourceTxHash: string;
  destinationTxHash: string | null;
  messageId: string | null;
  data: string | null;
  error: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Transaction with estimated gas fees
export interface TransactionWithFees extends LayerZeroTransaction {
  fees: {
    sourceGas: string;
    layerZeroFee: string;
    destinationGas: string | null;
    total: string;
    estimatedUSD: string | null;
  }
}

// Tracked message across chains
export interface CrossChainMessage {
  id: string;
  sourceChain: string;
  destinationChain: string;
  sourceAddress: string;
  destinationAddress: string;
  status: TransactionStatus;
  payload: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

// DVN security configuration for transactions
export interface DVNConfiguration {
  enabled: boolean;
  verifiers: number;
  requiredSignatures: number;
  securityLevel: 'low' | 'medium' | 'high';
  estimatedAdditionalCost: string;
}