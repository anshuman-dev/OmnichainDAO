import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Network } from '@/types/network';

export enum ErrorType {
  TRANSACTION_FAILED = 'transaction_failed',
  NETWORK_MISMATCH = 'network_mismatch',
  GAS_ESTIMATION_FAILED = 'gas_estimation_failed',
  WALLET_CONNECTION = 'wallet_connection',
  CONTRACT_INTERACTION = 'contract_interaction',
  UNKNOWN = 'unknown'
}

interface TransactionErrorHandlerProps {
  error: Error;
  errorType?: ErrorType;
  targetNetwork?: Network;
  txHash?: string;
  onRetry?: () => void;
  onSwitchNetwork?: () => void;
  onClear?: () => void;
}

export default function TransactionErrorHandler({
  error,
  errorType = ErrorType.UNKNOWN,
  targetNetwork,
  txHash,
  onRetry,
  onSwitchNetwork,
  onClear
}: TransactionErrorHandlerProps) {
  
  const getErrorMessage = () => {
    // Extract the core message from the error
    const baseMessage = error.message;
    
    // Enhance the message based on error type
    switch (errorType) {
      case ErrorType.TRANSACTION_FAILED:
        return `Transaction failed: ${baseMessage}`;
      case ErrorType.NETWORK_MISMATCH:
        return `Network mismatch: Please switch to ${targetNetwork?.name || 'the correct network'}`;
      case ErrorType.GAS_ESTIMATION_FAILED:
        return `Gas estimation failed: ${baseMessage}`;
      case ErrorType.WALLET_CONNECTION:
        return 'Wallet not connected. Please connect your wallet to continue.';
      case ErrorType.CONTRACT_INTERACTION:
        return `Contract interaction failed: ${baseMessage}`;
      default:
        return baseMessage || 'An unknown error occurred';
    }
  };
  
  const renderActionButtons = () => {
    switch (errorType) {
      case ErrorType.TRANSACTION_FAILED:
        return (
          <div className="flex space-x-2">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="flex items-center">
                <RefreshCw className="mr-1 h-3 w-3" /> Retry
              </Button>
            )}
            {onClear && (
              <Button size="sm" variant="ghost" onClick={onClear} className="flex items-center">
                <X className="mr-1 h-3 w-3" /> Dismiss
              </Button>
            )}
          </div>
        );
      case ErrorType.NETWORK_MISMATCH:
        return (
          <div className="flex space-x-2">
            {onSwitchNetwork && (
              <Button size="sm" variant="default" onClick={onSwitchNetwork} className="flex items-center">
                Switch to {targetNetwork?.name || 'correct network'}
              </Button>
            )}
            {onClear && (
              <Button size="sm" variant="ghost" onClick={onClear} className="flex items-center">
                <X className="mr-1 h-3 w-3" /> Dismiss
              </Button>
            )}
          </div>
        );
      default:
        return onClear ? (
          <Button size="sm" variant="ghost" onClick={onClear} className="flex items-center">
            <X className="mr-1 h-3 w-3" /> Dismiss
          </Button>
        ) : null;
    }
  };
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-sm">{getErrorMessage()}</div>
        {txHash && (
          <div className="text-xs mt-1">
            Transaction hash: {txHash.slice(0, 6)}...{txHash.slice(-4)}
          </div>
        )}
        <div className="mt-3">{renderActionButtons()}</div>
      </AlertDescription>
    </Alert>
  );
}