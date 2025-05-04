import { useState, useCallback, useEffect } from "react";
import { TokenStats, ChainDistribution, SupplyCheck, UserBalance, Contracts, BridgeFees } from "@/types/token";
import { 
  DEFAULT_TOKEN_STATS, 
  DEFAULT_USER_BALANCE, 
  DEFAULT_CONTRACTS,
  INITIAL_CHAIN_DISTRIBUTION,
  INITIAL_SUPPLY_CHECKS,
  BRIDGE_FEE_PERCENTAGE,
  LAYERZERO_BASE_FEE
} from "@/lib/constants";
import { useNetwork } from "@/hooks/useNetwork";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useToken() {
  const { isConnected, address } = useWallet();
  const { currentNetwork } = useNetwork();
  const { toast } = useToast();
  
  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);
  const [userBalance, setUserBalance] = useState<UserBalance>(DEFAULT_USER_BALANCE);
  const [chainDistribution, setChainDistribution] = useState<ChainDistribution[]>(INITIAL_CHAIN_DISTRIBUTION);
  const [supplyChecks, setSupplyChecks] = useState<SupplyCheck[]>(INITIAL_SUPPLY_CHECKS);
  const [contracts, setContracts] = useState<Contracts>(DEFAULT_CONTRACTS);
  
  // Fetch token stats and user balance when wallet or network changes
  useEffect(() => {
    const fetchTokenData = async () => {
      if (isConnected && address && currentNetwork) {
        try {
          // In a real implementation, we would fetch this data from the blockchain
          // or from an API provided by the backend
          
          // For now, we'll use the constants as initial data and simulate
          // a network-specific balance
          const networkName = currentNetwork.name.toLowerCase();
          
          if (networkName === 'ethereum') {
            setUserBalance({
              total: "1,000.00",
              usdValue: "1,250.00"
            });
          } else if (networkName === 'polygon') {
            setUserBalance({
              total: "500.00",
              usdValue: "625.00"
            });
          } else if (networkName === 'arbitrum') {
            setUserBalance({
              total: "250.00",
              usdValue: "312.50"
            });
          } else if (networkName === 'base') {
            setUserBalance({
              total: "100.00",
              usdValue: "125.00"
            });
          }
        } catch (error) {
          console.error("Error fetching token data:", error);
          toast({
            title: "Failed to load token data",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      } else {
        // Reset to default if not connected
        setUserBalance(DEFAULT_USER_BALANCE);
      }
    };
    
    fetchTokenData();
  }, [isConnected, address, currentNetwork, toast]);
  
  // Calculate bridge fees
  const calculateBridgeFees = useCallback((amount: number, destinationChainId: string): BridgeFees => {
    // Bridge fee is 0.1% of the amount
    const bridgeFee = amount * BRIDGE_FEE_PERCENTAGE;
    
    // LayerZero fee is a base fee plus a variable amount depending on destination
    // In a real implementation, this would be fetched from the LayerZero API
    let layerZeroFee = LAYERZERO_BASE_FEE;
    
    // Gas fee depends on the source and destination chains
    // In a real implementation, this would be estimated based on current gas prices
    let gasFee = 1.25;
    
    if (destinationChainId === 'arbitrum' || destinationChainId === 'base') {
      gasFee = 0.85; // Lower gas fees for L2s
    }
    
    // Calculate total cost
    const totalCost = layerZeroFee + bridgeFee + gasFee;
    
    return {
      layerZeroFee,
      bridgeFee,
      gasFee,
      totalCost
    };
  }, []);
  
  // Bridge tokens to another chain
  const bridgeTokens = useCallback(async (amount: number, destinationChainId: string) => {
    try {
      if (!isConnected) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to bridge tokens",
          variant: "destructive",
        });
        return;
      }
      
      if (!currentNetwork) {
        toast({
          title: "Network not selected",
          description: "Please select a source network",
          variant: "destructive",
        });
        return;
      }
      
      if (amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        return;
      }
      
      // In a real implementation, this would trigger a blockchain transaction
      // For now, we'll simulate the process
      
      toast({
        title: "Bridging in progress",
        description: `Bridging ${amount} OGV from ${currentNetwork.name} to ${destinationChainId}...`,
      });
      
      // Simulate a delay for the bridging process
      setTimeout(() => {
        toast({
          title: "Bridging successful",
          description: `Successfully bridged ${amount} OGV to ${destinationChainId}`,
        });
        
        // Update the user balance and chain distribution
        // In a real implementation, this would happen after the transaction is confirmed
        
        // For this demo, we'll use the API to record the bridge transaction
        apiRequest('POST', '/api/bridge', {
          amount,
          fromChain: currentNetwork.id,
          toChain: destinationChainId,
          walletAddress: address
        });
        
      }, 2000);
    } catch (error: any) {
      console.error("Error bridging tokens:", error);
      toast({
        title: "Bridging failed",
        description: error.message || "Failed to bridge tokens. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isConnected, currentNetwork, toast, address]);
  
  return {
    tokenStats,
    userBalance,
    chainDistribution,
    supplyChecks,
    contracts,
    calculateBridgeFees,
    bridgeTokens
  };
}
