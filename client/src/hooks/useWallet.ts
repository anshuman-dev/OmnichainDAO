import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: any;
}

export function useWallet() {
  const { toast } = useToast();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if we have stored wallet info
        const storedAddress = localStorage.getItem('wallet_address');
        const storedChainId = localStorage.getItem('wallet_chainId');
        
        if (storedAddress && storedChainId) {
          // Check if the wallet is still connected
          if (window.ethereum && window.ethereum.isConnected && window.ethereum.selectedAddress) {
            setWalletState({
              isConnected: true,
              address: storedAddress,
              chainId: parseInt(storedChainId),
              provider: window.ethereum
            });
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkConnection();
  }, []);
  
  const connectWallet = useCallback(async (providerType: string) => {
    try {
      if (providerType === 'metamask') {
        if (!window.ethereum) {
          toast({
            title: "MetaMask not installed",
            description: "Please install MetaMask browser extension to continue",
            variant: "destructive",
          });
          return;
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length > 0) {
          // Store wallet info
          localStorage.setItem('wallet_address', accounts[0]);
          localStorage.setItem('wallet_chainId', parseInt(chainId, 16).toString());
          
          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            provider: window.ethereum
          });
          
          toast({
            title: "Wallet Connected",
            description: `Connected to address ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
          });
        }
      } else if (providerType === 'coinbase') {
        toast({
          title: "Coming Soon",
          description: "Coinbase Wallet integration is coming soon!",
        });
      } else if (providerType === 'walletconnect') {
        toast({
          title: "Coming Soon",
          description: "WalletConnect integration is coming soon!",
        });
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  const disconnectWallet = useCallback(() => {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chainId');
    
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);
  
  return {
    ...walletState,
    isInitialized,
    connectWallet,
    disconnectWallet
  };
}
