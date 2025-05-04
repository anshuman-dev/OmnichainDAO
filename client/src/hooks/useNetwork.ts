import { useState, useCallback, useEffect } from "react";
import { Network } from "@/types/token";
import { AVAILABLE_NETWORKS } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

export function useNetwork() {
  const { isConnected, chainId } = useWallet();
  const { toast } = useToast();
  
  const [networks, setNetworks] = useState<Network[]>(AVAILABLE_NETWORKS);
  const [currentNetwork, setCurrentNetwork] = useState<Network | null>(null);
  const [gasPrice, setGasPrice] = useState<number>(0.10);
  
  // Set the current network based on the connected wallet's chainId
  useEffect(() => {
    if (isConnected && chainId) {
      const network = networks.find(n => n.chainId === chainId);
      if (network) {
        setCurrentNetwork(network);
      } else {
        // If the chainId doesn't match any of our supported networks,
        // default to Ethereum
        setCurrentNetwork(networks[0]);
        
        toast({
          title: "Unsupported Network",
          description: "Please switch to a supported network",
          variant: "destructive",
        });
      }
    } else if (networks.length > 0) {
      // Default to Ethereum if not connected
      setCurrentNetwork(networks[0]);
    }
  }, [isConnected, chainId, networks, toast]);
  
  // Update gas price based on the current network
  useEffect(() => {
    if (currentNetwork) {
      // In a real implementation, this would fetch the current gas price
      // from an API or directly from the blockchain
      // For now, we'll simulate it
      let price = 0.10;
      
      if (currentNetwork.id === 'ethereum') {
        price = 0.25; // Higher gas for Ethereum
      } else if (currentNetwork.id === 'polygon') {
        price = 0.05; // Lower gas for Polygon
      } else if (currentNetwork.id === 'arbitrum') {
        price = 0.10; // Medium gas for Arbitrum
      } else if (currentNetwork.id === 'base') {
        price = 0.08; // Medium-low gas for Base
      }
      
      setGasPrice(price);
    }
  }, [currentNetwork]);
  
  // Network switching function
  const switchNetwork = useCallback(async (networkId: string) => {
    try {
      const network = networks.find(n => n.id === networkId);
      if (!network) {
        throw new Error(`Network ${networkId} not found`);
      }
      
      if (isConnected && window.ethereum) {
        // Try to switch to the network in the wallet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            toast({
              title: "Network not added",
              description: `Please add ${network.name} to your wallet`,
            });
          } else {
            throw switchError;
          }
        }
      }
      
      // Update current network in state
      setCurrentNetwork(network);
    } catch (error: any) {
      console.error("Error switching network:", error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch network. Please try again.",
        variant: "destructive",
      });
    }
  }, [isConnected, networks, toast]);
  
  return {
    networks,
    networkStatus: networks, // Network status is the same as networks for now
    currentNetwork,
    gasPrice,
    setCurrentNetwork: (network: Network) => {
      switchNetwork(network.id);
    }
  };
}
