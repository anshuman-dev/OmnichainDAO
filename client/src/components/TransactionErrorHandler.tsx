import React from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { ErrorType } from "@/types/error";

interface TransactionErrorHandlerProps {
  error: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
}

export default function TransactionErrorHandler({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = true
}: TransactionErrorHandlerProps) {
  const getErrorMessage = () => {
    if (!error) return "Unknown error occurred";
    
    // If we have a specific error message, use it
    if (error.message) return error.message;
    
    // Otherwise, provide generic messages based on error type
    switch (error.type) {
      case 'user_rejected':
        return "Transaction was rejected. Please try again when you're ready.";
      case 'insufficient_funds':
        return "You don't have enough funds to complete this transaction.";
      case 'slippage_too_high':
        return "Price movement too high. Try increasing slippage tolerance or try again later.";
      case 'gas_estimation_failed':
        return "Failed to estimate gas. The transaction may fail or the contract doesn't allow this operation.";
      case 'timeout':
        return "Transaction timed out. Network may be congested.";
      case 'network_error':
        return "Network connection error. Please check your internet connection.";
      case 'relayer_error':
        return "LayerZero relayer encountered an error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };
  
  const getErrorIcon = () => {
    if (!error || !error.type) return <AlertTriangle className="h-5 w-5" />;
    
    switch (error.type) {
      case 'user_rejected':
        return <XCircle className="h-5 w-5" />;
      case 'insufficient_funds':
        return <AlertTriangle className="h-5 w-5" />;
      case 'timeout':
      case 'network_error':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };
  
  const getErrorVariant = () => {
    if (!error || !error.type) return "destructive";
    
    switch (error.type) {
      case 'user_rejected':
        return "default";
      case 'insufficient_funds':
      case 'slippage_too_high':
      case 'gas_estimation_failed':
        return "destructive";
      case 'timeout':
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
            {error.details && (
              <div className="mt-2 text-sm opacity-80">
                {error.details}
              </div>
            )}
          </AlertDescription>
          
          {(onRetry || onDismiss) && (
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