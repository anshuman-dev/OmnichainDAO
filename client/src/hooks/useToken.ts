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
import { estimateCrossChainFee, sendTokensCrossChain, getBalancesAcrossChains } from "@/services/layerzero";
import { ethers } from "ethers";

export function useToken() {
  const { isConnected, address, provider, signer } = useWallet();
  const { currentNetwork, networks } = useNetwork();
  const { toast } = useToast();
  
  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);
  const [userBalance, setUserBalance] = useState<UserBalance>(DEFAULT_USER_BALANCE);
  const [chainDistribution, setChainDistribution] = useState<ChainDistribution[]>(INITIAL_CHAIN_DISTRIBUTION);
  const [supplyChecks, setSupplyChecks] = useState<SupplyCheck[]>(INITIAL_SUPPLY_CHECKS);
  const [contracts, setContracts] = useState<Contracts>(DEFAULT_CONTRACTS);
  const [isLoading, setIsLoading] = useState(false);
  const [crossChainBalances, setCrossChainBalances] = useState<Record<string, string>>({});
  
  // Fetch token stats and user balance when wallet or network changes
  useEffect(() => {
    const fetchTokenData = async () => {
      if (currentNetwork) {
        setIsLoading(true);
        try {
          // If wallet is connected, fetch balances across all chains
          if (isConnected && address) {
            try {
              // Get balances across all chains
              const balances = await getBalancesAcrossChains(address);
              setCrossChainBalances(balances);
              
              // Set the current network balance
              const networkBalance = balances[currentNetwork.id] || '0';
              const balanceNumber = parseFloat(networkBalance);
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
              console.error("Error fetching cross-chain balances:", error);
              // Keep existing balance if there's an error
            }
          } else {
            // Reset to default if not connected
            setUserBalance(DEFAULT_USER_BALANCE);
            setCrossChainBalances({});
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
  }, [isConnected, address, currentNetwork, toast, tokenStats.price]);
  
  // Calculate bridge fees using LayerZero service
  const calculateBridgeFees = useCallback((amount: number, destinationChainId: string): BridgeFees => {
    try {
      // Find the destination network
      const destinationNetwork = networks.find(network => network.id === destinationChainId);
      
      if (!currentNetwork || !destinationNetwork) {
        throw new Error("Source or destination network not found");
      }
      
      // In a real implementation, we would use the LayerZero API or contract to estimate fees
      // For now, we'll use simplified logic
      
      // Bridge fee is 0.1% of the amount
      const bridgeFee = amount * BRIDGE_FEE_PERCENTAGE;
      
      // LayerZero fee is a base fee plus a variable amount depending on destination
      let layerZeroFee = LAYERZERO_BASE_FEE;
      
      // Gas fee depends on the source and destination chains
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
    } catch (error) {
      console.error("Error calculating bridge fees:", error);
      // Return default values if calculation fails
      return {
        layerZeroFee: LAYERZERO_BASE_FEE,
        bridgeFee: amount * BRIDGE_FEE_PERCENTAGE,
        gasFee: 1.25,
        totalCost: LAYERZERO_BASE_FEE + (amount * BRIDGE_FEE_PERCENTAGE) + 1.25
      };
    }
  }, [currentNetwork, networks]);
  
  // Bridge tokens to another chain using LayerZero
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
      
      if (!provider || !address || !signer) {
        toast({
          title: "Wallet error",
          description: "Your wallet is not properly connected",
          variant: "destructive",
        });
        return;
      }
      
      // Find the destination network
      const destinationNetwork = networks.find(network => network.id === destinationChainId);
      
      if (!destinationNetwork) {
        toast({
          title: "Invalid destination",
          description: "Destination network not found",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Preparing transaction",
        description: `Preparing to bridge ${amount} OGV from ${currentNetwork.name} to ${destinationNetwork.name}...`,
      });
      
      // For now, we'll just simulate the bridging process
      // In a real implementation, this would trigger a blockchain transaction
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
        
        // In a real implementation, we would call the sendTokensCrossChain function:
        /*
        const tx = await sendTokensCrossChain(
          currentNetwork,
          destinationNetwork,
          amount.toString(),
          address,
          signer
        );
        
        toast({
          title: "Bridging successful",
          description: `Successfully bridged ${amount} OGV to ${destinationNetwork.name}. Transaction hash: ${tx.transactionHash}`,
        });
        */
        
      }, 2000);
    } catch (error: any) {
      console.error("Error bridging tokens:", error);
      toast({
        title: "Bridging failed",
        description: error.message || "Failed to bridge tokens. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isConnected, currentNetwork, networks, toast, address, provider, signer]);
  
  return {
    tokenStats,
    userBalance,
    chainDistribution,
    supplyChecks,
    contracts,
    isLoading,
    crossChainBalances,
    calculateBridgeFees,
    bridgeTokens
  };
}