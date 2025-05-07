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
import { ethers } from "ethers";
import { useContractService } from "./useContractService";
import { ContractErrorType } from "../services/contractService";
import { CHAIN_IDS } from "../config/contracts";

export function useToken() {
  const { isConnected, address, provider, signer } = useWallet();
  const { currentNetwork, networks } = useNetwork();
  const { toast } = useToast();
  const { contractService, isInitialized } = useContractService();
  
  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);
  const [userBalance, setUserBalance] = useState<UserBalance>(DEFAULT_USER_BALANCE);
  const [chainDistribution, setChainDistribution] = useState<ChainDistribution[]>(INITIAL_CHAIN_DISTRIBUTION);
  const [supplyChecks, setSupplyChecks] = useState<SupplyCheck[]>(INITIAL_SUPPLY_CHECKS);
  const [contracts, setContracts] = useState<Contracts>(DEFAULT_CONTRACTS);
  const [isLoading, setIsLoading] = useState(false);
  const [crossChainBalances, setCrossChainBalances] = useState<Record<string, string>>({});
  
  // Helper function to get token balances across chains using real contract interactions
  const getBalancesAcrossChains = async (walletAddress: string): Promise<Record<string, string>> => {
    const balances: Record<string, string> = {};
    
    // Get balances for each supported network
    for (const network of networks) {
      try {
        if (!network.chainId) continue;
        
        // Get the network's chainId number
        const chainId = parseInt(network.chainId);
        
        // Switch to that network
        if (isInitialized && currentNetwork && currentNetwork.chainId !== network.chainId) {
          contractService.setNetwork(network);
        }
        
        // Get token balance on this chain
        const balance = await contractService.getTokenBalance();
        
        // Store the balance
        balances[network.id] = balance;
      } catch (error) {
        console.error(`Error fetching balance for ${network.name}:`, error);
        balances[network.id] = '0.00';
      }
    }
    
    return balances;
  };
  
  // Fetch token stats and user balance when wallet or network changes
  useEffect(() => {
    const fetchTokenData = async () => {
      if (currentNetwork && isInitialized) {
        setIsLoading(true);
        try {
          // If wallet is connected, fetch balances across all chains
          if (isConnected && address) {
            try {
              // Get token total supply
              const totalSupply = await contractService.getTotalSupply();
              setTokenStats(prev => ({
                ...prev,
                totalSupply: totalSupply,
              }));
              
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
    
    if (isInitialized) {
      fetchTokenData();
    }
  }, [isConnected, address, currentNetwork, toast, tokenStats.price, isInitialized]);
  
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
      
      if (!provider || !address || !signer || !isInitialized) {
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
      
      // Make sure destination network has a chain ID
      if (!destinationNetwork.chainId) {
        toast({
          title: "Invalid destination",
          description: "Destination network does not have a valid chain ID",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Preparing transaction",
        description: `Preparing to bridge ${amount} OGV from ${currentNetwork.name} to ${destinationNetwork.name}...`,
      });
      
      // Set status updates
      const updateStatus = (status: string) => {
        toast({
          title: "Bridging Status",
          description: status,
        });
      };
      
      // Use the contract service to bridge tokens
      try {
        const destinationChainIdNum = parseInt(destinationNetwork.chainId);
        const amountStr = amount.toString();
        
        // Bridge tokens
        const txHash = await contractService.bridgeTokens(
          amountStr,
          destinationChainIdNum,
          updateStatus
        );
        
        // Record the bridge transaction in our database
        apiRequest('POST', '/api/bridge', {
          amount,
          fromChain: currentNetwork.id,
          toChain: destinationChainId,
          walletAddress: address,
          txHash: txHash
        });
        
        toast({
          title: "Bridging successful",
          description: `Successfully initiated bridge of ${amount} OGV to ${destinationNetwork.name}. Transaction hash: ${txHash}`,
        });
        
        // Update balances after bridge
        setTimeout(async () => {
          const balances = await getBalancesAcrossChains(address);
          setCrossChainBalances(balances);
          
          // Update current network balance
          const networkBalance = balances[currentNetwork.id] || '0';
          const balanceNumber = parseFloat(networkBalance);
          const balanceFormatted = balanceNumber.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          // Calculate USD value
          const usdValue = (balanceNumber * parseFloat(tokenStats.price)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          setUserBalance({
            total: balanceFormatted,
            usdValue: usdValue
          });
        }, 10000); // Wait 10 seconds before refreshing balances
        
      } catch (error: any) {
        console.error("Error bridging tokens:", error);
        
        // Handle different error types
        if (error.type === ContractErrorType.USER_REJECTED) {
          toast({
            title: "Transaction rejected",
            description: "You rejected the transaction in your wallet",
            variant: "destructive",
          });
        } else if (error.type === ContractErrorType.INSUFFICIENT_FUNDS) {
          toast({
            title: "Insufficient funds",
            description: "You don't have enough funds to complete this transaction",
            variant: "destructive",
          });
        } else if (error.type === ContractErrorType.TRANSACTION_ERROR) {
          toast({
            title: "Transaction failed",
            description: error.message || "The transaction failed to execute on the blockchain",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Bridging failed",
            description: error.message || "Failed to bridge tokens. Please try again later.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error initiating bridge:", error);
      toast({
        title: "Bridging failed",
        description: error.message || "Failed to initiate token bridge. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isConnected, currentNetwork, networks, toast, address, provider, signer, isInitialized, contractService, tokenStats.price]);
  
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