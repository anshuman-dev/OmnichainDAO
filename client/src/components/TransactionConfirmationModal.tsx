import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, XCircle, ArrowBigRight, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import { useWalletContext } from './WalletProvider';
import { formatEther } from 'ethers/lib/utils';

export type TransactionStatus = 'pending' | 'source_confirmed' | 'destination_confirmed' | 'complete' | 'failed';

type StepStatus = 'waiting' | 'in_progress' | 'complete' | 'failed';

interface TransactionSteps {
  sourceTransaction: StepStatus;
  layerZeroMessage: StepStatus;
  destinationTransaction: StepStatus;
}

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  sourceChain: string;
  destinationChain?: string;
  txHash?: string;
  status: TransactionStatus;
  onRetry?: () => void;
  estimatedFee?: string;
  estimatedGas?: string;
  error?: Error | null;
}

export default function TransactionConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  sourceChain,
  destinationChain,
  txHash,
  status,
  onRetry,
  estimatedFee,
  estimatedGas,
  error
}: TransactionConfirmationModalProps) {
  const { provider } = useWalletContext();
  const [currentGasPrice, setCurrentGasPrice] = useState<string | null>(null);
  const [steps, setSteps] = useState<TransactionSteps>({
    sourceTransaction: 'waiting',
    layerZeroMessage: 'waiting',
    destinationTransaction: 'waiting',
  });

  // Initialize the transaction steps based on the status
  useEffect(() => {
    if (status === 'pending') {
      setSteps({
        sourceTransaction: 'in_progress',
        layerZeroMessage: 'waiting',
        destinationTransaction: 'waiting',
      });
    } else if (status === 'source_confirmed') {
      setSteps({
        sourceTransaction: 'complete',
        layerZeroMessage: 'in_progress',
        destinationTransaction: 'waiting',
      });
    } else if (status === 'destination_confirmed') {
      setSteps({
        sourceTransaction: 'complete',
        layerZeroMessage: 'complete',
        destinationTransaction: 'in_progress',
      });
    } else if (status === 'complete') {
      setSteps({
        sourceTransaction: 'complete',
        layerZeroMessage: 'complete',
        destinationTransaction: 'complete',
      });
    } else if (status === 'failed') {
      // Determine which step failed based on the error (simplified logic)
      const failedStep = error?.message?.includes('LayerZero') 
        ? 'layerZeroMessage' 
        : error?.message?.includes('destination') 
          ? 'destinationTransaction' 
          : 'sourceTransaction';

      setSteps({
        sourceTransaction: failedStep === 'sourceTransaction' ? 'failed' : 'complete',
        layerZeroMessage: failedStep === 'layerZeroMessage' ? 'failed' : 
          (failedStep === 'sourceTransaction' ? 'waiting' : 'complete'),
        destinationTransaction: failedStep === 'destinationTransaction' ? 'failed' : 'waiting',
      });
    }
  }, [status, error]);

  // Get current gas price from provider
  useEffect(() => {
    async function fetchGasPrice() {
      if (provider) {
        try {
          const gasPrice = await provider.getGasPrice();
          setCurrentGasPrice(formatEther(gasPrice));
        } catch (err) {
          console.error("Error fetching gas price:", err);
        }
      }
    }

    if (isOpen) {
      fetchGasPrice();
    }
  }, [provider, isOpen]);

  // Status components for each step
  const renderStepStatus = (step: StepStatus) => {
    switch (step) {
      case 'waiting':
        return <div className="w-6 h-6 rounded-full bg-gray-200"></div>;
      case 'in_progress':
        return <Spinner size="sm" color="accent" />;
      case 'complete':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Transaction Steps Display */}
          <div className="flex flex-col gap-4">
            {/* Source Chain Transaction */}
            <div className="flex items-center gap-3">
              {renderStepStatus(steps.sourceTransaction)}
              <div className="flex-1">
                <p className="font-medium">Source Chain Transaction</p>
                <p className="text-sm text-gray-500">{sourceChain}</p>
                {txHash && steps.sourceTransaction !== 'waiting' && (
                  <p className="text-xs text-blue-600">
                    Tx: {txHash.substring(0, 8)}...{txHash.substring(txHash.length - 8)}
                  </p>
                )}
              </div>
            </div>

            {/* Connecting arrow */}
            <div className="flex justify-center">
              <ArrowBigRight className="text-gray-400" />
            </div>

            {/* LayerZero Message */}
            <div className="flex items-center gap-3">
              {renderStepStatus(steps.layerZeroMessage)}
              <div className="flex-1">
                <p className="font-medium">LayerZero Message Delivery</p>
                <p className="text-sm text-gray-500">Cross-chain message in transit</p>
                {steps.layerZeroMessage === 'in_progress' && (
                  <p className="text-xs text-blue-600">This may take a few minutes</p>
                )}
              </div>
            </div>

            {/* Connecting arrow - only show if there's a destination chain */}
            {destinationChain && (
              <div className="flex justify-center">
                <ArrowBigRight className="text-gray-400" />
              </div>
            )}

            {/* Destination Chain Transaction - only show if there's a destination chain */}
            {destinationChain && (
              <div className="flex items-center gap-3">
                {renderStepStatus(steps.destinationTransaction)}
                <div className="flex-1">
                  <p className="font-medium">Destination Chain Transaction</p>
                  <p className="text-sm text-gray-500">{destinationChain}</p>
                </div>
              </div>
            )}
          </div>

          {/* Fee & Gas Estimates */}
          {(estimatedFee || estimatedGas || currentGasPrice) && (
            <div className="mt-6 p-3 rounded bg-gray-50">
              <p className="text-sm font-medium mb-2">Transaction Details</p>
              {estimatedFee && (
                <div className="flex justify-between text-sm">
                  <span>LayerZero Fee:</span>
                  <span>{estimatedFee} ETH</span>
                </div>
              )}
              {estimatedGas && (
                <div className="flex justify-between text-sm">
                  <span>Estimated Gas:</span>
                  <span>{estimatedGas} ETH</span>
                </div>
              )}
              {currentGasPrice && (
                <div className="flex justify-between text-sm">
                  <span>Current Gas Price:</span>
                  <span>{parseFloat(currentGasPrice).toFixed(9)} ETH</span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && status === 'failed' && (
            <div className="mt-4 p-3 rounded bg-red-50 border border-red-100">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Transaction Failed</p>
                  <p className="text-xs text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between">
          {status === 'failed' && onRetry ? (
            <Button variant="destructive" onClick={onRetry}>
              Retry Transaction
            </Button>
          ) : (
            <Button variant={status === 'complete' ? 'default' : 'outline'} onClick={onClose}>
              {status === 'complete' ? 'Done' : 'Close'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}