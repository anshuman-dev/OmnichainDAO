import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayerZeroTransaction, CreateTransactionInput } from '@/types/transaction';

interface UseLayerZeroTransactionProps {
  onSuccess?: (tx: LayerZeroTransaction) => void;
  onError?: (error: Error) => void;
  pollInterval?: number;
}

/**
 * Hook for managing LayerZero transactions, including creation, monitoring and error handling
 */
export default function useLayerZeroTransaction({
  onSuccess,
  onError,
  pollInterval = 5000
}: UseLayerZeroTransactionProps = {}) {
  const [currentTxId, setCurrentTxId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  // Mutation to create a new transaction
  const { mutate: createTransaction, isPending: isCreating } = useMutation({
    mutationFn: async (transaction: CreateTransactionInput): Promise<LayerZeroTransaction> => {
      const response = await fetch('/api/layerzero/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentTxId(data.id);
      queryClient.invalidateQueries({ queryKey: ['layerzero', 'transactions'] });
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      console.error('Error creating transaction:', err);
      onError?.(err);
    }
  });
  
  // Query to get transaction by ID (for polling current transaction)
  const {
    data: transaction,
    isLoading: isLoadingTransaction,
    error: transactionError,
    refetch
  } = useQuery({
    queryKey: ['layerzero', 'transaction', currentTxId],
    queryFn: async (): Promise<LayerZeroTransaction | null> => {
      if (!currentTxId) return null;
      
      const response = await fetch(`/api/layerzero/transactions/${currentTxId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transaction');
      }
      
      return await response.json();
    },
    enabled: !!currentTxId,
    refetchInterval: currentTxId && transaction?.status !== 'completed' && transaction?.status !== 'failed' 
      ? pollInterval 
      : false
  });
  
  // Mutation to retry a failed transaction
  const { mutate: retryTransaction, isPending: isRetrying } = useMutation({
    mutationFn: async (id: number): Promise<LayerZeroTransaction> => {
      const response = await fetch('/api/layerzero/transactions/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry transaction');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['layerzero', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['layerzero', 'transaction', data.id] });
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      console.error('Error retrying transaction:', err);
      onError?.(err);
    }
  });
  
  // Helper to reset current transaction
  const resetTransaction = useCallback(() => {
    setCurrentTxId(null);
  }, []);
  
  return {
    // Transaction state
    transaction,
    transactionId: currentTxId,
    isLoadingTransaction,
    transactionError,
    
    // Transaction actions
    createTransaction,
    retryTransaction,
    resetTransaction,
    refetchTransaction: refetch,
    
    // Loading states
    isCreating,
    isRetrying
  };
}