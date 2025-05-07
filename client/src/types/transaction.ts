export interface LayerZeroTransaction {
  id: number;
  type: string;
  status: string;
  sourceChain: string;
  destinationChain: string | null;
  sourceTxHash: string;
  destinationTxHash: string | null;
  messageId: string | null;
  error: string | null;
  data: string | null;
  walletAddress: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTransactionInput {
  type: string;
  sourceChain: string;
  sourceTxHash: string;
  destinationChain?: string;
  status: string;
  walletAddress?: string;
  data?: string;
}

export type TransactionStatus = 
  | 'pending' 
  | 'source_confirmed' 
  | 'destination_confirmed' 
  | 'completed' 
  | 'failed';

export enum FilterStatus {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  EXECUTION_ERROR = 'execution_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN = 'unknown_error'
}