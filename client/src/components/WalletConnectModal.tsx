import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaEthereum } from "react-icons/fa";
import { SiCoinbase, SiWalletconnect } from "react-icons/si";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (providerType: string) => Promise<void>;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const handleConnect = async (providerType: string) => {
    await onConnect(providerType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred wallet provider to connect to the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-3 h-14 px-4" 
            onClick={() => handleConnect('metamask')}
          >
            <FaEthereum className="h-6 w-6 text-orange-500" />
            <span className="font-medium">MetaMask</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-3 h-14 px-4" 
            onClick={() => handleConnect('coinbase')}
          >
            <SiCoinbase className="h-6 w-6 text-blue-500" />
            <span className="font-medium">Coinbase Wallet</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-3 h-14 px-4" 
            onClick={() => handleConnect('walletconnect')}
          >
            <SiWalletconnect className="h-6 w-6 text-blue-600" />
            <span className="font-medium">WalletConnect</span>
          </Button>
        </div>
        
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <a 
            href="https://ethereum.org/wallets" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Learn about wallets
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}