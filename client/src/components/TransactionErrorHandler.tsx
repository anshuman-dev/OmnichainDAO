import React from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { ErrorType, ErrorInfo } from "@/types/error";
import { TransactionErrorType } from "@/types/transaction";

interface TransactionErrorHandlerProps {
  error: Error | ErrorInfo;
  errorType?: ErrorType | TransactionErrorType;
  transactionId?: number;
  networkName?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  onClear?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
}

export default function TransactionErrorHandler({
  error,
  errorType,
  networkName,
  onRetry,
  onDismiss,
  onClear,
  showRetry = true,
  showDismiss = true
}: TransactionErrorHandlerProps) {
  const getErrorMessage = () => {
    if (!error) return "Unknown error occurred";
    
    // If we have a specific error message, use it
    if (error.message) return error.message;
    
    // Otherwise, provide generic messages based on error type
    const errorTypeValue = errorType || (error as any).type;
    
    switch (errorTypeValue) {
      case ErrorType.USER_REJECTED:
      case 'user_rejected':
        return "Transaction was rejected. Please try again when you're ready.";
      case ErrorType.INSUFFICIENT_FUNDS:
      case 'insufficient_funds':
        return "You don't have enough funds to complete this transaction.";
      case 'slippage_too_high':
        return "Price movement too high. Try increasing slippage tolerance or try again later.";
      case 'gas_estimation_failed':
        return "Failed to estimate gas. The transaction may fail or the contract doesn't allow this operation.";
      case ErrorType.TIMEOUT:
      case 'timeout':
        return "Transaction timed out. Network may be congested.";
      case ErrorType.NETWORK_ERROR:
      case 'network_error':
        return `Network connection error${networkName ? ` with ${networkName}` : ''}. Please check your connection.`;
      case 'relayer_error':
        return "LayerZero relayer encountered an error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };
  
  const getErrorIcon = () => {
    if (!error) return <AlertTriangle className="h-5 w-5" />;
    
    const errorTypeValue = errorType || (error as any).type;
    
    switch (errorTypeValue) {
      case ErrorType.USER_REJECTED:
      case 'user_rejected':
        return <XCircle className="h-5 w-5" />;
      case ErrorType.INSUFFICIENT_FUNDS:
      case 'insufficient_funds':
        return <AlertTriangle className="h-5 w-5" />;
      case ErrorType.TIMEOUT:
      case 'timeout':
      case ErrorType.NETWORK_ERROR:
      case 'network_error':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };
  
  const getErrorVariant = () => {
    if (!error) return "destructive";
    
    const errorTypeValue = errorType || (error as any).type;
    
    switch (errorTypeValue) {
      case ErrorType.USER_REJECTED:
      case 'user_rejected':
        return "default";
      case ErrorType.INSUFFICIENT_FUNDS:
      case 'insufficient_funds':
      case 'slippage_too_high':
      case 'gas_estimation_failed':
        return "destructive";
      case ErrorType.TIMEOUT:
      case 'timeout':
      case ErrorType.NETWORK_ERROR:
      case 'network_error':
      case 'relayer_error':
        return "destructive";
      default:
        return "destructive";
    }
  };

  return (
    <Alert variant={getErrorVariant()}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          {getErrorIcon()}
        </div>
        <div className="flex-1">
          <AlertTitle>Transaction Error</AlertTitle>
          <AlertDescription className="mt-1">
            {getErrorMessage()}
            {(error as any).details && (
              <div className="mt-2 text-sm opacity-80">
                {(error as any).details}
              </div>
            )}
          </AlertDescription>
          
          {(onRetry || onDismiss || onClear) && (
            <div className="mt-3 flex gap-2">
              {showRetry && onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Try Again
                </Button>
              )}
              
              {showDismiss && onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}