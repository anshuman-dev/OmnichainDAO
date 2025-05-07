/**
 * Transaction related types for the LayerZero transactions
 */

// Transaction status filter options
export enum FilterStatus {
  ALL = "all",
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

// LayerZero Transaction interface
export interface LayerZeroTransaction {
  id: number;
  type: string;
  walletAddress: string;
  sourceChain: string;
  destinationChain: string | null;
  sourceTxHash: string;
  destinationTxHash: string | null;
  messageId: string | null;
  status: string;
  data: string | null;
  error: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Input interface for creating a new transaction
export interface CreateTransactionInput {
  type: string;
  sourceChain: string;
  sourceTxHash: string;
  destinationChain?: string;
  walletAddress?: string;
  data?: string; 
  messageId?: string;
  status?: string;
}

// Generic transaction update input
export interface UpdateTransactionInput {
  id: number;
  status?: string;
  destinationTxHash?: string;
  messageId?: string;
  error?: string;
}

// Transaction simulation result
export interface TransactionSimulationResult {
  success: boolean;
  estimatedGas: string;
  error?: string;
  details?: {
    messageSize: number;
    nativeAmount: string;
    lzFee: string;
  };
}

// Transaction Gas estimation across chains
export interface GasEstimation {
  sourceChain: {
    chainId: number;
    gasPrice: string;
    estimatedGas: string;
    totalCost: string;
  };
  destinationChain?: {
    chainId: number;
    gasPrice: string;
    estimatedGas: string;
    totalCost: string;
  };
  layerZeroFee?: {
    messageFee: string;
    oracleFee: string;
    relayerFee: string;
    totalFee: string;
  }
}