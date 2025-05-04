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
import { getProvider, getTokenData, getWalletBalance, sendTokensAcrossChains } from "@/services/ethereum";
import { ethers } from "ethers";

export function useToken() {
  const { isConnected, address, provider } = useWallet();
  const { currentNetwork } = useNetwork();
  const { toast } = useToast();
  
  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);
  const [userBalance, setUserBalance] = useState<UserBalance>(DEFAULT_USER_BALANCE);
  const [chainDistribution, setChainDistribution] = useState<ChainDistribution[]>(INITIAL_CHAIN_DISTRIBUTION);
  const [supplyChecks, setSupplyChecks] = useState<SupplyCheck[]>(INITIAL_SUPPLY_CHECKS);
  const [contracts, setContracts] = useState<Contracts>(DEFAULT_CONTRACTS);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch token stats and user balance when wallet or network changes
  useEffect(() => {
    const fetchTokenData = async () => {
      if (currentNetwork) {
        setIsLoading(true);
        try {
          // Get provider based on current network
          const ethProvider = getProvider(currentNetwork);
          
          // Get OFT contract data
          const oftData = await getTokenData(contracts.oft, ethProvider);
          
          // Update token stats with real data
          setTokenStats({
            totalSupply: oftData.totalSupply,
            price: tokenStats.price, // Still using mock price for now
            volume: tokenStats.volume, // Still using mock volume for now
            circulatingSupply: oftData.totalSupply // Assuming all tokens are circulating
          });
          
          // If wallet is connected, fetch balance
          if (isConnected && address) {
            try {
              const balance = await getWalletBalance(contracts.oft, address, ethProvider);
              const balanceNumber = parseFloat(balance);
              const balanceFormatted = balanceNumber.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              
              // Calculate USD value assuming price is in USD
              const usdValue = (balanceNumber * parseFloat(tokenStats.price)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              
              setUserBalance({
                total: balanceFormatted,
                usdValue: usdValue
              });
            } catch (error) {
              console.error("Error fetching wallet balance:", error);
              // Keep existing balance if there's an error
            }
          } else {
            // Reset to default if not connected
            setUserBalance(DEFAULT_USER_BALANCE);
          }
        } catch (error) {
          console.error("Error fetching token data:", error);
          toast({
            title: "Failed to load token data",
            description: "Please try again later or ensure you are connected to the correct network",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchTokenData();
  }, [isConnected, address, currentNetwork, contracts.oft, toast, tokenStats.price, tokenStats.volume]);
  
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
    
    if (destinationChainId.includes('arbitrum') || destinationChainId.includes('base')) {
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
      
      if (!provider || !address) {
        toast({
          title: "Wallet error",
          description: "Your wallet is not properly connected",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Preparing transaction",
        description: `Preparing to bridge ${amount} OGV from ${currentNetwork.name} to ${destinationChainId}...`,
      });
      
      // Here we would call the appropriate contract method to perform the bridge
      // This would be a real transaction, requiring gas
      
      // For prototype purposes, we'll just simulate the API call
      setTimeout(() => {
        toast({
          title: "Bridging initialized",
          description: `Bridge request submitted. Transaction pending...`,
        });
        
        // Record the bridge transaction
        apiRequest('POST', '/api/bridge', {
          amount,
          fromChain: currentNetwork.id,
          toChain: destinationChainId,
          walletAddress: address
        });
      }, 1000);
      
    } catch (error: any) {
      console.error("Error bridging tokens:", error);
      toast({
        title: "Bridging failed",
        description: error.message || "Failed to bridge tokens. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isConnected, currentNetwork, toast, address, provider]);
  
  return {
    tokenStats,
    userBalance,
    chainDistribution,
    supplyChecks,
    contracts,
    isLoading,
    calculateBridgeFees,
    bridgeTokens
  };
}