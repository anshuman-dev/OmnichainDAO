import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TransactionStatus = 
  | 'pending' 
  | 'source_confirmed' 
  | 'destination_confirmed' 
  | 'completed' 
  | 'failed';

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  sourceChain: string;
  destinationChain?: string;
  txHash?: string;
  status: TransactionStatus;
  estimatedFee?: string;
  error?: Error | null;
  onRetry?: () => void;
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
  estimatedFee,
  error,
  onRetry
}: TransactionConfirmationModalProps) {
  
  const renderStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Spinner size="lg" className="text-blue-400" />;
      case 'source_confirmed':
        return <Loader2 className="h-12 w-12 text-yellow-400 animate-spin" />;
      case 'destination_confirmed':
        return <Loader2 className="h-12 w-12 text-green-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Spinner size="lg" />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return "Transaction is being processed";
      case 'source_confirmed':
        return "Confirmed on source chain, waiting for destination chain";
      case 'destination_confirmed':
        return "Confirmed on destination chain, finalizing";
      case 'completed':
        return "Transaction completed successfully";
      case 'failed':
        return "Transaction failed";
      default:
        return "Processing transaction";
    }
  };
  
  const getStatusBadgeColor = () => {
    switch (status) {
      case 'pending':
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'source_confirmed':
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case 'destination_confirmed':
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case 'completed':
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'failed':
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {renderStatusIcon()}
          
          <div className="text-center">
            <div className={`px-3 py-1 rounded-full text-sm inline-flex items-center border ${getStatusBadgeColor()}`}>
              {getStatusText()}
            </div>
          </div>
          
          {txHash && (
            <div className="text-xs text-gray-500 flex items-center">
              TX: {txHash.substring(0, 8)}...{txHash.substring(txHash.length - 6)}
              <a 
                href={`https://layerzeroscan.com/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 inline-flex items-center text-blue-500 hover:text-blue-700"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          )}
          
          {estimatedFee && (
            <div className="text-sm text-gray-400">
              Estimated fee: {estimatedFee} ETH
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="outline">{sourceChain}</Badge>
            {destinationChain && (
              <>
                <ArrowRight size={14} className="text-gray-400" />
                <Badge variant="outline">{destinationChain}</Badge>
              </>
            )}
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mt-2 text-center">
              {error.message}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          {status === 'failed' && onRetry ? (
            <Button onClick={onRetry} variant="default">
              Retry Transaction
            </Button>
          ) : (
            <Button onClick={onClose} variant={status === 'completed' ? "default" : "outline"}>
              {status === 'completed' ? 'Done' : 'Close'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}