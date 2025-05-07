import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  LayerZeroTransaction, 
  TransactionStatus,
  TransactionErrorType 
} from '@/types/transaction';
import { ErrorType, ErrorInfo } from '@/types/error';

interface TransactionOptions {
  onSubmitStart?: () => void;
  onSourceConfirmed?: (txHash: string) => void;
  onDestinationConfirmed?: (txHash: string) => void;
  onComplete?: (transaction: LayerZeroTransaction) => void;
  onSuccess?: (transaction: LayerZeroTransaction) => void;
  onError?: (error: Error | ErrorInfo) => void;
}

export function useLayerZeroTransaction(options: TransactionOptions = {}) {
  const queryClient = useQueryClient();
  const [currentTransaction, setCurrentTransaction] = useState<LayerZeroTransaction | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<Error | ErrorInfo | null>(null);
  
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
            const error: ErrorInfo = {
              message: updatedTransaction.error || 'Transaction failed',
              type: ErrorType.UNKNOWN,
              details: updatedTransaction.data || undefined
            };
            setError(error);
            options.onError?.(error);
          }
          
        } catch (error) {
          console.error('Error polling transaction:', error);
        }
      }, 3000); // Poll every 3 seconds
      
      // Clean up interval on component unmount
      return () => clearInterval(pollInterval);
      
    } catch (err) {
      console.error('Error tracking transaction:', err);
      const error: ErrorInfo = {
        message: 'Failed to track transaction',
        type: ErrorType.NETWORK_ERROR,
      };
      setError(error);
      options.onError?.(error);
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
      
    } catch (err) {
      console.error('Error creating transaction:', err);
      const error: ErrorInfo = {
        message: 'Failed to create transaction',
        type: ErrorType.NETWORK_ERROR,
      };
      setError(error);
      options.onError?.(error);
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
      
    } catch (err) {
      console.error('Error retrying transaction:', err);
      const error: ErrorInfo = {
        message: 'Failed to retry transaction',
        type: ErrorType.NETWORK_ERROR,
      };
      setError(error);
      options.onError?.(error);
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
    transaction: currentTransaction, // Alias for better naming in components
    transactionStatus,
    isModalOpen,
    error,
    transactionError: error, // Alias for better naming in components
    createTransaction,
    trackTransaction,
    retryTransaction,
    closeTransactionModal,
    resetTransaction,
  };
}