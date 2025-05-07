import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, ExternalLink, ArrowRight } from "lucide-react";
import TransactionErrorHandler, { ErrorType } from './TransactionErrorHandler';
import { TransactionStatus } from '@/types/transaction';

interface TransactionStep {
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  sourceChain: string;
  destinationChain?: string;
  status: TransactionStatus;
  sourceTxHash?: string;
  destinationTxHash?: string;
  error?: ErrorType;
  onRetry?: () => void;
}

export default function TransactionConfirmationModal({
  isOpen,
  onClose,
  title,
  description = "Please wait while your transaction is being processed.",
  sourceChain,
  destinationChain,
  status,
  sourceTxHash,
  destinationTxHash,
  error,
  onRetry,
}: TransactionConfirmationModalProps) {
  const [steps, setSteps] = useState<TransactionStep[]>([]);

  // Set up steps based on props
  useEffect(() => {
    const newSteps: TransactionStep[] = [
      {
        title: `Confirm on ${sourceChain}`,
        description: "Waiting for confirmation on source chain",
        status: 'pending'
      }
    ];

    if (destinationChain) {
      newSteps.push({
        title: `LayerZero Message`,
        description: "Cross-chain message in transit",
        status: 'pending'
      });

      newSteps.push({
        title: `Confirm on ${destinationChain}`,
        description: "Waiting for confirmation on destination chain",
        status: 'pending'
      });
    }

    // Update steps based on current status
    if (status === 'pending') {
      newSteps[0].status = 'in_progress';
    } else if (status === 'source_confirmed') {
      newSteps[0].status = 'completed';
      if (newSteps.length > 1) {
        newSteps[1].status = 'in_progress';
      }
    } else if (status === 'in_flight') {
      newSteps[0].status = 'completed';
      if (newSteps.length > 1) {
        newSteps[1].status = 'in_progress';
      }
    } else if (status === 'destination_confirmed') {
      newSteps[0].status = 'completed';
      if (newSteps.length > 1) {
        newSteps[1].status = 'completed';
        newSteps[2].status = 'in_progress';
      }
    } else if (status === 'completed') {
      newSteps.forEach((step, index) => {
        newSteps[index].status = 'completed';
      });
    } else if (status === 'failed') {
      let failedStepIndex = 0;
      
      // Find which step failed
      if (sourceTxHash) {
        failedStepIndex = destinationChain ? 1 : 0; // If we have sourceTxHash but failed, then either the source completed (cross-chain) or it's a single chain tx
      }
      
      for (let i = 0; i < newSteps.length; i++) {
        if (i < failedStepIndex) {
          newSteps[i].status = 'completed';
        } else if (i === failedStepIndex) {
          newSteps[i].status = 'failed';
        }
      }
    }

    setSteps(newSteps);
  }, [sourceChain, destinationChain, status, sourceTxHash]);

  const getStepIcon = (step: TransactionStep) => {
    if (step.status === 'pending') {
      return <div className="h-8 w-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-300">⋯</div>;
    } else if (step.status === 'in_progress') {
      return <Spinner size="lg" className="text-blue-500" />;
    } else if (step.status === 'completed') {
      return <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle /></div>;
    } else if (step.status === 'failed') {
      return <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><XCircle /></div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Chain flow diagram */}
        <div className="my-4 flex items-center justify-center">
          <div className="font-medium text-sm px-3 py-1 rounded bg-blue-100 text-blue-800">
            {sourceChain}
          </div>
          
          {destinationChain && (
            <>
              <ArrowRight className="mx-2 text-gray-400" />
              <div className="font-medium text-sm px-3 py-1 rounded bg-purple-100 text-purple-800">
                {destinationChain}
              </div>
            </>
          )}
        </div>

        {/* Transaction progress steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="mr-3 flex-shrink-0">
                {getStepIcon(step)}
              </div>
              <div>
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-gray-500">{step.description}</p>
                
                {/* Show transaction hash links if available */}
                {index === 0 && sourceTxHash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${sourceTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
                
                {index === 2 && destinationTxHash && (
                  <a 
                    href={`https://explorer.aptoslabs.com/txn/${destinationTxHash}?network=amoy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error message if transaction failed */}
        {status === 'failed' && error && (
          <div className="mt-4">
            <TransactionErrorHandler 
              error={error}
              onRetry={onRetry}
              showDismiss={false}
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {status === 'completed' && (
            <Button onClick={onClose}>Close</Button>
          )}
          
          {status !== 'completed' && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}