import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCw, ExternalLink, X } from "lucide-react";

export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  EXECUTION_ERROR = 'execution_error',
  VALIDATION_ERROR = 'validation_error',
  UNKNOWN_ERROR = 'unknown_error',
}

interface TransactionErrorHandlerProps {
  error: Error;
  errorType: ErrorType;
  txHash?: string;
  transactionId?: number;
  networkName?: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export default function TransactionErrorHandler({
  error,
  errorType,
  txHash,
  transactionId,
  networkName,
  onRetry,
  onClear
}: TransactionErrorHandlerProps) {
  const getErrorTitle = () => {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return `${networkName || 'Network'} Connection Error`;
      case ErrorType.EXECUTION_ERROR:
        return "Transaction Failed";
      case ErrorType.VALIDATION_ERROR:
        return "Validation Error";
      case ErrorType.UNKNOWN_ERROR:
      default:
        return "An Error Occurred";
    }
  };

  const getErrorAction = () => {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return "Please check your connection and try again.";
      case ErrorType.EXECUTION_ERROR:
        return "The transaction encountered an error during execution.";
      case ErrorType.VALIDATION_ERROR:
        return "Please check your inputs and try again.";
      case ErrorType.UNKNOWN_ERROR:
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  const getErrorIcon = () => {
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Alert variant="destructive">
      <div className="flex items-start">
        <div className="flex-1">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle className="inline-flex items-center">
            {getErrorTitle()}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p>{getErrorAction()}</p>
            {error && <p className="text-sm mt-1 overflow-hidden text-ellipsis">{error.message}</p>}
          </AlertDescription>
        </div>
        
        <div className="flex space-x-2 mt-2">
          {onClear && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClear}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {txHash && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8"
            >
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> View
              </a>
            </Button>
          )}
          
          {onRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              <RotateCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}