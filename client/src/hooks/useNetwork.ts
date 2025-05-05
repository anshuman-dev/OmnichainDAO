import { useState, useCallback, useEffect } from "react";
import { Network } from "@/types/token";
import { AVAILABLE_NETWORKS } from "@/lib/constants";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

export function useNetwork() {
  const { isConnected, chainId } = useWallet();
  const { toast } = useToast();
  
  const [networks] = useState<Network[]>(AVAILABLE_NETWORKS);
  const [currentNetwork, setCurrentNetworkState] = useState<Network>(networks[0]); // Default to first network
  const [gasPrice, setGasPrice] = useState<number>(0.10);
  
  // Set the current network based on the connected wallet's chainId
  useEffect(() => {
    if (isConnected && chainId) {
      const network = networks.find(n => n.chainId === chainId);
      if (network) {
        setCurrentNetworkState(network);
      } else {
        // If the chainId doesn't match any of our supported networks,
        // default to the first network (Sepolia for LayerZero demo)
        setCurrentNetworkState(networks[0]);
        
        toast({
          title: "Unsupported Network",
          description: `Please switch to ${networks[0].name} or ${networks[1].name}`,
          variant: "destructive",
        });
      }
    } else if (networks.length > 0) {
      // Default to first network if not connected
      setCurrentNetworkState(networks[0]);
    }
  }, [isConnected, chainId, networks, toast]);
  
  // Update gas price based on the current network
  useEffect(() => {
    // Use the network's gasPrice or default to 0.10 if not available
    setGasPrice(currentNetwork.gasPrice || 0.10);
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
            // Add the chain to MetaMask
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${network.chainId.toString(16)}`,
                    chainName: network.name,
                    nativeCurrency: {
                      name: network.id === 'amoy' ? 'MATIC' : 'ETH',
                      symbol: network.id === 'amoy' ? 'MATIC' : 'ETH',
                      decimals: 18
                    },
                    rpcUrls: [network.id === 'sepolia' 
                      ? 'https://sepolia.infura.io/v3/' 
                      : 'https://rpc-amoy.polygon.technology'],
                    blockExplorerUrls: [network.id === 'sepolia'
                      ? 'https://sepolia.etherscan.io'
                      : 'https://www.oklink.com/amoy']
                  }
                ]
              });
            } catch (addError) {
              console.error("Error adding chain:", addError);
              toast({
                title: "Network add failed",
                description: `Please add ${network.name} to your wallet manually`,
              });
            }
          } else {
            throw switchError;
          }
        }
      }
      
      // Update current network in state
      setCurrentNetworkState(network);
      
      // Notify the user about the network change
      toast({
        title: "Network Changed",
        description: `You are now connected to ${network.name}`,
      });
      
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
    currentNetwork, // Always returns a network (never null)
    gasPrice,
    setCurrentNetwork: (network: Network) => {
      switchNetwork(network.id);
    },
    // Helper function to check if a network is the hub
    isHubNetwork: (network: Network) => network.isHub === true
  };
}
