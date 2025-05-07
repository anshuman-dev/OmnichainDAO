import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateTransactionInput, LayerZeroTransaction } from '@/types/transaction';
import { useWalletContext } from '@/components/WalletProvider';

interface UseLayerZeroTransactionOptions {
  onSuccess?: (transaction: LayerZeroTransaction) => void;
  onError?: (error: Error) => void;
}

interface UseLayerZeroTransactionResult {
  transaction: LayerZeroTransaction | null;
  transactionId: number | null;
  isLoadingTransaction: boolean;
  transactionError: Error | null;
  createTransaction: (input: CreateTransactionInput) => Promise<LayerZeroTransaction>;
  retryTransaction: (id: number) => Promise<LayerZeroTransaction>;
  resetTransaction: () => void;
  isCreating: boolean;
  isRetrying: boolean;
}

const useLayerZeroTransaction = (
  options: UseLayerZeroTransactionOptions = {}
): UseLayerZeroTransactionResult => {
  const { address } = useWalletContext();
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Create transaction mutation
  const createMutation = useMutation<LayerZeroTransaction, Error, CreateTransactionInput>({
    mutationFn: async (transactionInput: CreateTransactionInput) => {
      const input = {
        ...transactionInput,
        walletAddress: transactionInput.walletAddress || address || '',
        status: transactionInput.status || 'pending'
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }

      return response.json();
    },
    onSuccess: (transaction) => {
      setTransactionId(transaction.id);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      options.onSuccess?.(transaction);
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      options.onError?.(error);
    },
  });

  // Retry transaction mutation
  const retryMutation = useMutation<LayerZeroTransaction, Error, number>({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/transactions/${id}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to retry transaction');
      }

      return response.json();
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', transactionId] });
      options.onSuccess?.(transaction);
    },
    onError: (error) => {
      console.error('Error retrying transaction:', error);
      options.onError?.(error);
    },
  });

  // Get transaction query
  const {
    data: transaction,
    isLoading: isLoadingTransaction,
    error,
  } = useQuery<LayerZeroTransaction, Error>({
    queryKey: ['/api/transactions', transactionId],
    queryFn: async () => {
      if (!transactionId) {
        return null;
      }

      const response = await fetch(`/api/transactions/${transactionId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transaction');
      }

      return response.json();
    },
    enabled: !!transactionId,
    refetchInterval: (data) => {
      // Refetch more frequently for pending transactions
      if (data && ['pending', 'source_confirmed'].includes(data.status)) {
        return 5000; // 5 seconds
      }
      return false; // Don't auto-refetch if transaction is complete or failed
    },
  });

  const resetTransaction = useCallback(() => {
    setTransactionId(null);
  }, []);

  return {
    transaction: transaction || null,
    transactionId,
    isLoadingTransaction,
    transactionError: error || null,
    createTransaction: createMutation.mutateAsync,
    retryTransaction: retryMutation.mutateAsync,
    resetTransaction,
    isCreating: createMutation.isPending,
    isRetrying: retryMutation.isPending,
  };
};

export default useLayerZeroTransaction;