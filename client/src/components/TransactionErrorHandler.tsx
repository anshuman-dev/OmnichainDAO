import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowUpRight } from 'lucide-react';

export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  EXECUTION_ERROR = 'execution_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN = 'unknown_error'
}

interface TransactionErrorHandlerProps {
  error: Error;
  errorType: ErrorType;
  transactionId?: number;
  networkName?: string;
  onRetry?: () => void;
  onClear?: () => void;
  onNetworkSwitch?: () => void;
}

export default function TransactionErrorHandler({
  error,
  errorType,
  transactionId,
  networkName,
  onRetry,
  onClear,
  onNetworkSwitch
}: TransactionErrorHandlerProps) {
  
  const getErrorTitle = () => {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return 'Network Connection Error';
      case ErrorType.EXECUTION_ERROR:
        return 'Transaction Execution Failed';
      case ErrorType.TIMEOUT_ERROR:
        return 'Transaction Timeout';
      default:
        return 'Transaction Error';
    }
  };
  
  const getErrorMessage = () => {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return networkName 
          ? `Unable to connect to ${networkName}. Please check your network connection and try again.`
          : 'Unable to connect to the network. Please check your connection and try again.';
      case ErrorType.EXECUTION_ERROR:
        return 'The transaction failed during execution. This may be due to contract reverts or gas issues.';
      case ErrorType.TIMEOUT_ERROR:
        return 'The transaction took too long to complete. It may still be processing.';
      default:
        return error.message || 'An unknown error occurred. Please try again later.';
    }
  };
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{getErrorTitle()}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{getErrorMessage()}</p>
          
          {transactionId && (
            <p className="text-xs">
              Transaction ID: {transactionId}
            </p>
          )}
          
          <div className="flex space-x-2 mt-2">
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRetry}
                className="flex items-center"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry Transaction
              </Button>
            )}
            
            {onNetworkSwitch && networkName && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onNetworkSwitch}
                className="flex items-center"
              >
                <ArrowUpRight className="mr-1 h-3 w-3" />
                Switch to {networkName}
              </Button>
            )}
            
            {onClear && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onClear}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}