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