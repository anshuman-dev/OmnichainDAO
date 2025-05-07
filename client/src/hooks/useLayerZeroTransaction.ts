import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWalletContext } from '@/components/WalletProvider';
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
  pollInterval = 5000,
}: UseLayerZeroTransactionProps = {}) {
  const { address, isConnected } = useWalletContext();
  const [currentTransaction, setCurrentTransaction] = useState<LayerZeroTransaction | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Mutation for creating a new transaction
  const createMutation = useMutation({
    mutationFn: async (transaction: CreateTransactionInput) => {
      const enrichedTransaction = {
        ...transaction,
        walletAddress: transaction.walletAddress || address || '0x',
      };
      
      const response = await apiRequest('/api/layerzero/transactions', {
        method: 'POST',
        body: JSON.stringify(enrichedTransaction),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response;
    },
    onSuccess: (data) => {
      setCurrentTransaction(data as LayerZeroTransaction);
      setError(null);
      setIsPolling(true);
      setRetryCount(0);
    },
    onError: (err: Error) => {
      setError(err);
      if (onError) onError(err);
    },
  });

  // Query for getting a transaction by ID
  const { data, refetch } = useQuery({
    queryKey: ['transaction', currentTransaction?.id],
    queryFn: () => 
      apiRequest(`/api/layerzero/transactions/${currentTransaction?.id}`),
    enabled: !!currentTransaction && isPolling,
    refetchInterval: isPolling ? pollInterval : false,
  });

  // Update the transaction state when data changes
  useEffect(() => {
    if (data && currentTransaction?.id == data.id) {
      setCurrentTransaction(data as LayerZeroTransaction);
      
      // Check for completion or failure
      if (data.status === 'completed') {
        setIsPolling(false);
        if (onSuccess) onSuccess(data as LayerZeroTransaction);
      } else if (data.status === 'failed') {
        setIsPolling(false);
        if (data.error) {
          setError(new Error(data.error));
          if (onError) onError(new Error(data.error));
        }
      }
    }
  }, [data, onSuccess, onError, currentTransaction?.id]);

  // Create a new transaction
  const createTransaction = useCallback((tx: CreateTransactionInput) => {
    createMutation.mutate(tx);
  }, [createMutation]);

  // Retry a failed transaction
  const retryTransaction = useCallback(() => {
    if (currentTransaction) {
      setRetryCount(count => count + 1);
      setIsPolling(true);
      
      // If we have a sourceChain and sourceTxHash, we can create a new retry transaction
      apiRequest('/api/layerzero/transactions/retry', {
        method: 'POST',
        body: JSON.stringify({ 
          id: currentTransaction.id,
          sourceTxHash: currentTransaction.sourceTxHash,
          sourceChain: currentTransaction.sourceChain
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        setCurrentTransaction(response as LayerZeroTransaction);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setIsPolling(false);
      });
    }
  }, [currentTransaction]);

  // Clear the current transaction and error state
  const clearTransaction = useCallback(() => {
    setCurrentTransaction(null);
    setError(null);
    setIsPolling(false);
    setRetryCount(0);
  }, []);

  return {
    createTransaction,
    currentTransaction,
    isLoading: createMutation.isPending || isPolling,
    error,
    retryCount,
    retryTransaction,
    clearTransaction
  };
}