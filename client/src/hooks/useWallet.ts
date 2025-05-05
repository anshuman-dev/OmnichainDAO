import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";

// Simple type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: any;
  signer: ethers.Signer | null;
}

export function useWallet() {
  const { toast } = useToast();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const openWalletModal = useCallback(() => {
    console.log("Opening wallet modal");
    setShowWalletModal(true);
  }, []);
  
  const closeWalletModal = useCallback(() => {
    console.log("Closing wallet modal");
    setShowWalletModal(false);
  }, []);
  
  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if we have stored wallet info
        const storedAddress = localStorage.getItem('wallet_address');
        const storedChainId = localStorage.getItem('wallet_chainId');
        
        if (storedAddress && storedChainId && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          setWalletState({
            isConnected: true,
            address: storedAddress,
            chainId: parseInt(storedChainId),
            provider,
            signer
          });
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
    console.log(`Attempting to connect wallet: ${providerType}`);
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
        
        // Request account access
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
          console.error("User denied account access");
          toast({
            title: "Connection Failed",
            description: "You need to allow MetaMask access to continue.",
            variant: "destructive",
          });
          return;
        }
        
        // Get provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const { chainId } = await provider.getNetwork();
        
        // Store wallet info
        localStorage.setItem('wallet_address', address);
        localStorage.setItem('wallet_chainId', chainId.toString());
        
        setWalletState({
          isConnected: true,
          address: address,
          chainId: chainId,
          provider,
          signer
        });
        
        toast({
          title: "Wallet Connected",
          description: `Connected to address ${address.substring(0, 6)}...${address.substring(38)}`,
        });
        
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
  
  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask not installed",
          description: "Please install MetaMask browser extension to continue",
          variant: "destructive",
        });
        return;
      }
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      
      // Update the chainId in state
      setWalletState(prev => ({
        ...prev,
        chainId
      }));
      
      // Update the stored chainId
      localStorage.setItem('wallet_chainId', chainId.toString());
      
      toast({
        title: "Network Switched",
        description: `Switched to chain ID: ${chainId}`,
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        toast({
          title: "Network Not Found",
          description: "This network needs to be added to your wallet first",
          variant: "destructive",
        });
      } else {
        console.error("Error switching network:", error);
        toast({
          title: "Network Switch Failed",
          description: error.message || "Failed to switch network. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);
  
  const disconnectWallet = useCallback(() => {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chainId');
    
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null
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
    disconnectWallet,
    switchNetwork,
    openWalletModal,
    closeWalletModal,
    showWalletModal
  };
}