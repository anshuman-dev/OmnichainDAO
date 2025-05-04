import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connectWallet } = useWallet();
  
  const handleConnectWallet = async (provider: string) => {
    await connectWallet(provider);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#101010] border border-[#323232] rounded-xl p-6 max-w-md w-full">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl">Connect Wallet</DialogTitle>
          <button className="text-[#797575] hover:text-[#F2F2F2]" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <button 
            className="w-full bg-[#0A0A0A] hover:bg-[#101010] border border-[#323232] rounded-xl p-4 flex items-center justify-between transition-all"
            onClick={() => handleConnectWallet("metamask")}
          >
            <div className="flex items-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" className="w-8 h-8 mr-3" alt="MetaMask Logo" />
              <span>MetaMask</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#797575]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            className="w-full bg-[#0A0A0A] hover:bg-[#101010] border border-[#323232] rounded-xl p-4 flex items-center justify-between transition-all"
            onClick={() => handleConnectWallet("coinbase")}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 bg-blue-500 rounded-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 0C6.268 0 0 6.268 0 14C0 21.732 6.268 28 14 28C21.732 28 28 21.732 28 14C28 6.268 21.732 0 14 0ZM14 20.6C10.367 20.6 7.4 17.633 7.4 14C7.4 10.367 10.367 7.4 14 7.4C17.633 7.4 20.6 10.367 20.6 14C20.6 17.633 17.633 20.6 14 20.6Z" fill="white"/>
                </svg>
              </div>
              <span>Coinbase Wallet</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#797575]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            className="w-full bg-[#0A0A0A] hover:bg-[#101010] border border-[#323232] rounded-xl p-4 flex items-center justify-between transition-all"
            onClick={() => handleConnectWallet("walletconnect")}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 bg-blue-600 rounded-full flex items-center justify-center">
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.30526 4.86188C6.25276 2.91437 9.41136 2.91437 11.3589 4.86188L11.5659 5.06891C11.6681 5.17112 11.6681 5.33906 11.5659 5.44127L10.8577 6.14948C10.8066 6.20059 10.7226 6.20059 10.6715 6.14948L10.3904 5.86833C9.02594 4.50393 6.63818 4.50393 5.27374 5.86833L4.97267 6.16943C4.92156 6.22053 4.83752 6.22053 4.78642 6.16943L4.07821 5.46122C3.976 5.35901 3.976 5.19106 4.07821 5.08885L4.30526 4.86188ZM13.0287 6.53148L13.6629 7.16572C13.7651 7.26793 13.7651 7.43587 13.6629 7.53808L10.3904 10.8107C10.2881 10.9129 10.1202 10.9129 10.018 10.8107L7.61544 8.40803C7.58988 8.38247 7.54885 8.38247 7.52329 8.40803L5.12075 10.8107C5.01854 10.9129 4.85059 10.9129 4.74838 10.8107L1.4752 7.53744C1.37299 7.43523 1.37299 7.26729 1.4752 7.16508L2.10943 6.53084C2.21165 6.42862 2.37959 6.42862 2.4818 6.53084L4.88435 8.93339C4.90991 8.95895 4.95094 8.95895 4.9765 8.93339L7.37905 6.53084C7.48126 6.42862 7.6492 6.42862 7.75141 6.53084L10.154 8.93339C10.1795 8.95895 10.2206 8.95895 10.2461 8.93339L12.6487 6.53084C12.7509 6.42862 12.9188 6.42862 13.021 6.53084L13.0287 6.53148Z" fill="white"/>
                </svg>
              </div>
              <span>WalletConnect</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#797575]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-[#797575]">
          By connecting your wallet, you agree to the OmniGovern Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
}
