import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight, Check, X, RotateCw, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export type TransactionStatus = 'pending' | 'source_confirmed' | 'destination_confirmed' | 'completed' | 'failed';

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
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Spinner size="default" className="text-blue-500" />;
      case 'source_confirmed':
        return destinationChain ? <Spinner size="default" className="text-blue-500" /> : <Check className="h-6 w-6 text-green-500" />;
      case 'destination_confirmed':
      case 'completed':
        return <Check className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <X className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Transaction in progress...';
      case 'source_confirmed':
        return destinationChain ? 'Confirmed on source chain, awaiting destination chain...' : 'Transaction confirmed!';
      case 'destination_confirmed':
        return 'Confirmed on destination chain!';
      case 'completed':
        return 'Transaction completed successfully!';
      case 'failed':
        return 'Transaction failed!';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <span className="text-blue-700 font-medium">{sourceChain?.charAt(0) || '?'}</span>
              </div>
              <span className="text-sm font-medium">{sourceChain}</span>
            </div>
            
            {destinationChain && (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-0.5 bg-gray-200 flex-1"></div>
                  <ArrowRight className="mx-2 text-gray-400" />
                  <div className="h-0.5 bg-gray-200 flex-1"></div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <span className="text-purple-700 font-medium">{destinationChain.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium">{destinationChain}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
          </div>
          
          {estimatedFee && (
            <div className="text-center text-sm text-gray-500 mb-4">
              Estimated fee: {estimatedFee} ETH
            </div>
          )}
          
          {txHash && (
            <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
              <div className="text-sm truncate max-w-[200px]">
                Tx: {txHash.substring(0, 8)}...{txHash.substring(txHash.length - 6)}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> View
                </a>
              </Button>
            </div>
          )}
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-md text-red-700 text-sm">
              {error.message}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          {status === 'failed' && onRetry && (
            <Button onClick={onRetry} className="flex items-center">
              <RotateCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          )}
          <Button onClick={onClose} variant={status === 'failed' ? "outline" : "default"}>
            {status === 'completed' ? 'Done' : status === 'failed' ? 'Close' : 'Hide'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}