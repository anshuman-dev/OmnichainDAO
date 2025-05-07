import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Network, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from './WalletProvider';
import contractService from '@/services/contractService';
import { Network as NetworkType } from '@/types/network';

// Types of errors we can handle
export enum ErrorType {
  WALLET_CONNECTION = 'wallet_connection',
  NETWORK_MISMATCH = 'network_mismatch',
  TRANSACTION_FAILED = 'transaction_failed',
  LAYERZERO_MESSAGE_FAILED = 'layerzero_message_failed',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  CONTRACT_INTERACTION = 'contract_interaction',
}

interface TransactionErrorHandlerProps {
  error: Error | null;
  errorType?: ErrorType;
  targetNetwork?: NetworkType;
  txHash?: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export default function TransactionErrorHandler({
  error,
  errorType = ErrorType.CONTRACT_INTERACTION,
  targetNetwork,
  txHash,
  onRetry,
  onClear
}: TransactionErrorHandlerProps) {
  const { toast } = useToast();
  const { connectWallet, switchNetwork } = useWalletContext();
  const [isAttemptingFix, setIsAttemptingFix] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  // Clear state when error changes
  useEffect(() => {
    setIsAttemptingFix(false);
    setIsFixed(false);
  }, [error, errorType]);

  if (!error) return null;

  const handleFixError = async () => {
    setIsAttemptingFix(true);

    try {
      switch (errorType) {
        case ErrorType.WALLET_CONNECTION:
          await connectWallet();
          break;
        
        case ErrorType.NETWORK_MISMATCH:
          if (targetNetwork) {
            await switchNetwork(targetNetwork.chainId);
          }
          break;
        
        case ErrorType.INSUFFICIENT_FUNDS:
          toast({
            title: "Insufficient Funds",
            description: "Please fund your wallet with testnet tokens to continue.",
            variant: "destructive",
          });
          
          // Open relevant testnet faucet in new tab
          if (targetNetwork) {
            if (targetNetwork.id === 'sepolia') {
              window.open('https://sepoliafaucet.com/', '_blank');
            } else if (targetNetwork.id === 'amoy') {
              window.open('https://faucet.polygon.technology/amoy', '_blank');
            }
          }
          break;
        
        case ErrorType.TRANSACTION_FAILED:
          if (onRetry) {
            onRetry();
          }
          break;
        
        case ErrorType.LAYERZERO_MESSAGE_FAILED:
          toast({
            title: "LayerZero Message Failed",
            description: "The cross-chain message failed to deliver. You can retry the transaction.",
            variant: "destructive",
          });
          
          if (onRetry) {
            onRetry();
          }
          break;
        
        default:
          toast({
            title: "Operation Failed",
            description: "An unknown error occurred. Please try again.",
            variant: "destructive",
          });
      }

      setIsFixed(true);
      
      // Call onClear after successful fix
      if (onClear) {
        setTimeout(() => {
          onClear();
        }, 2000);
      }
    } catch (fixError) {
      console.error("Error while attempting to fix:", fixError);
      toast({
        title: "Fix Failed",
        description: "Could not automatically resolve the issue. Please try manually.",
        variant: "destructive",
      });
    } finally {
      setIsAttemptingFix(false);
    }
  };

  // Display loading state when attempting to fix
  if (isAttemptingFix) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
        <AlertTitle>Working on it...</AlertTitle>
        <AlertDescription>
          Attempting to resolve the issue. Please wait.
        </AlertDescription>
      </Alert>
    );
  }

  // Display success state when fix was successful
  if (isFixed) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Issue Resolved</AlertTitle>
        <AlertDescription>
          The problem has been fixed. You can continue.
        </AlertDescription>
      </Alert>
    );
  }

  // Different error UI based on error type
  switch (errorType) {
    case ErrorType.WALLET_CONNECTION:
      return (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Wallet Connection Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>Your wallet is not connected. Please connect to continue.</p>
            <Button size="sm" variant="outline" onClick={handleFixError}>
              Connect Wallet
            </Button>
          </AlertDescription>
        </Alert>
      );

    case ErrorType.NETWORK_MISMATCH:
      return (
        <Alert className="bg-red-50 border-red-200">
          <Network className="h-4 w-4 text-red-600" />
          <AlertTitle>Network Mismatch</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {targetNetwork 
                ? `Please switch to ${targetNetwork.name} to continue.` 
                : "You're on the wrong network. Please switch to continue."}
            </p>
            {targetNetwork && (
              <Button size="sm" variant="outline" onClick={handleFixError}>
                Switch to {targetNetwork.name}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );

    case ErrorType.INSUFFICIENT_FUNDS:
      return (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Insufficient Funds</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>You don't have enough funds to complete this transaction.</p>
            <Button size="sm" variant="outline" onClick={handleFixError}>
              Visit Testnet Faucet
            </Button>
          </AlertDescription>
        </Alert>
      );

    case ErrorType.TRANSACTION_FAILED:
    case ErrorType.LAYERZERO_MESSAGE_FAILED:
      return (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Transaction Failed</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error.message}</p>
            {txHash && (
              <p className="text-xs text-gray-600">
                Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 10)}
              </p>
            )}
            {onRetry && (
              <Button size="sm" variant="outline" onClick={handleFixError}>
                Retry Transaction
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );

    default:
      return (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error.message}</p>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={handleFixError}>
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
  }
}