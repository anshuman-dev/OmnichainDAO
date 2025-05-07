import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/components/WalletProvider';
import { InsertLayerZeroTransaction, LayerZeroTransaction } from '@shared/schema';

interface UseLayerZeroTransactionProps {
  onSuccess?: (transaction: LayerZeroTransaction) => void;
  onError?: (error: Error) => void;
}

export default function useLayerZeroTransaction({ 
  onSuccess, 
  onError 
}: UseLayerZeroTransactionProps = {}) {
  const { toast } = useToast();
  const { address } = useWalletContext();
  const queryClient = useQueryClient();
  const [currentTransaction, setCurrentTransaction] = useState<LayerZeroTransaction | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Create transaction mutation
  const { mutate: createTransaction, isPending: isCreating } = useMutation({
    mutationFn: (data: Omit<InsertLayerZeroTransaction, 'walletAddress'>) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      return apiRequest<LayerZeroTransaction>('/api/layerzero/transaction', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          walletAddress: address
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      setCurrentTransaction(data);
      setError(null);
      
      toast({
        title: "Transaction Created",
        description: `Your ${data.type} transaction has been created and is being processed.`,
      });
      
      // Invalidate the transactions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/layerzero/transactions', address] });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (err: Error) => {
      setError(err);
      
      toast({
        title: "Transaction Failed",
        description: err.message,
        variant: "destructive",
      });
      
      if (onError) {
        onError(err);
      }
    }
  });

  // Track transaction status by ID
  const { mutate: trackTransaction, isPending: isTracking } = useMutation({
    mutationFn: async (id: number) => {
      const transaction = await apiRequest<LayerZeroTransaction>(`/api/layerzero/transaction/${id}`);
      return transaction;
    },
    onSuccess: (data) => {
      setCurrentTransaction(data);
      
      // If status changed to completed or failed, notify the user
      if (data.status === 'completed') {
        toast({
          title: "Transaction Completed",
          description: `Your ${data.type} operation has been confirmed on all chains.`,
        });
      } else if (data.status === 'failed') {
        const errorMsg = data.error || 'Transaction failed for unknown reasons';
        setError(new Error(errorMsg));
        
        toast({
          title: "Transaction Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    },
    onError: (err: Error) => {
      setError(err);
    }
  });

  // Clear current transaction and error
  const clearTransaction = useCallback(() => {
    setCurrentTransaction(null);
    setError(null);
  }, []);

  // Retry a failed transaction
  const retryTransaction = useCallback(() => {
    if (currentTransaction?.id) {
      // Call the API to update the transaction status to 'pending'
      apiRequest(`/api/layerzero/transaction/${currentTransaction.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'pending' }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(() => {
          // Invalidate the transactions query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/layerzero/transactions', address] });
          queryClient.invalidateQueries({ queryKey: [`/api/layerzero/transaction/${currentTransaction.id}`] });
          
          // Clear error
          setError(null);
          
          toast({
            title: "Transaction Retried",
            description: "Your transaction has been submitted again for processing.",
          });
        })
        .catch((err) => {
          setError(err);
          
          toast({
            title: "Retry Failed",
            description: err.message,
            variant: "destructive",
          });
        });
    }
  }, [currentTransaction, queryClient, address, toast]);

  return {
    createTransaction,
    trackTransaction,
    clearTransaction,
    retryTransaction,
    currentTransaction,
    error,
    isLoading: isCreating || isTracking
  };
}