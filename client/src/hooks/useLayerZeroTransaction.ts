import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  LayerZeroTransaction, 
  TransactionStatus,
  TransactionErrorType 
} from '@/types/transaction';
import { ErrorType } from '@/types/error';

interface TransactionOptions {
  onSubmitStart?: () => void;
  onSourceConfirmed?: (txHash: string) => void;
  onDestinationConfirmed?: (txHash: string) => void;
  onComplete?: (transaction: LayerZeroTransaction) => void;
  onError?: (error: ErrorType) => void;
}

export function useLayerZeroTransaction(options: TransactionOptions = {}) {
  const queryClient = useQueryClient();
  const [currentTransaction, setCurrentTransaction] = useState<LayerZeroTransaction | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<ErrorType | null>(null);
  
  // Track a transaction
  const trackTransaction = useCallback(async (transaction: LayerZeroTransaction) => {
    try {
      setCurrentTransaction(transaction);
      setTransactionStatus(transaction.status as TransactionStatus);
      setIsModalOpen(true);
      setError(null);
      
      options.onSubmitStart?.();
      
      // Set up polling to track transaction status
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch transaction status');
          }
          
          const updatedTransaction = await response.json();
          setCurrentTransaction(updatedTransaction);
          setTransactionStatus(updatedTransaction.status as TransactionStatus);
          
          // Handle status transitions
          if (updatedTransaction.status === 'source_confirmed' && transaction.status !== 'source_confirmed') {
            options.onSourceConfirmed?.(updatedTransaction.sourceTxHash);
          }
          
          if (updatedTransaction.status === 'destination_confirmed' && transaction.status !== 'destination_confirmed') {
            options.onDestinationConfirmed?.(updatedTransaction.destinationTxHash || '');
          }
          
          if (updatedTransaction.status === 'completed') {
            clearInterval(pollInterval);
            options.onComplete?.(updatedTransaction);
          }
          
          if (updatedTransaction.status === 'failed') {
            clearInterval(pollInterval);
            setError({
              message: updatedTransaction.error || 'Transaction failed',
              type: 'unknown',
              details: updatedTransaction.data || undefined
            });
          }
          
        } catch (error) {
          console.error('Error polling transaction:', error);
        }
      }, 3000); // Poll every 3 seconds
      
      // Clean up interval on component unmount
      return () => clearInterval(pollInterval);
      
    } catch (error) {
      console.error('Error tracking transaction:', error);
      setError({
        message: 'Failed to track transaction',
        type: 'network_error',
      });
    }
  }, [options, queryClient]);
  
  // Create a new transaction
  const createTransaction = useCallback(async (transactionData: Partial<LayerZeroTransaction>) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }
      
      const transaction = await response.json();
      trackTransaction(transaction);
      
      // Invalidate the transaction list query
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      return transaction;
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError({
        message: 'Failed to create transaction',
        type: 'network_error',
      });
      return null;
    }
  }, [trackTransaction, queryClient]);
  
  // Retry a failed transaction
  const retryTransaction = useCallback(async (transactionId: number) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/retry`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry transaction');
      }
      
      const result = await response.json();
      
      // Invalidate the transaction list query
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Track the retried transaction
      trackTransaction(result.transaction);
      
      return result.transaction;
      
    } catch (error) {
      console.error('Error retrying transaction:', error);
      setError({
        message: 'Failed to retry transaction',
        type: 'network_error',
      });
      return null;
    }
  }, [trackTransaction, queryClient]);
  
  // Close the transaction modal
  const closeTransactionModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  // Reset the current transaction state
  const resetTransaction = useCallback(() => {
    setCurrentTransaction(null);
    setTransactionStatus('pending');
    setIsModalOpen(false);
    setError(null);
  }, []);
  
  return {
    currentTransaction,
    transactionStatus,
    isModalOpen,
    error,
    createTransaction,
    trackTransaction,
    retryTransaction,
    closeTransactionModal,
    resetTransaction,
  };
}