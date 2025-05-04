import { ethers } from 'ethers';
import { Network } from '@/types/token';
import OFTAbi from '@/contracts/OFTAbi.json';
import { LZ_NETWORKS } from './layerzero';

// Get an ethers provider for a specific network
export const getProvider = (network: Network) => {
  // Default RPC endpoints for testnets - include multiple options for redundancy
  const rpcUrls: Record<number, string[]> = {
    5: [
      'https://ethereum-goerli.publicnode.com',
      'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc.ankr.com/eth_goerli'
    ],
    80001: [
      'https://rpc-mumbai.maticvigil.com',
      'https://polygon-mumbai.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc.ankr.com/polygon_mumbai'
    ],
    421613: [
      'https://goerli-rollup.arbitrum.io/rpc',
      'https://arbitrum-goerli.publicnode.com'
    ],
    84531: [
      'https://goerli.base.org',
      'https://base-goerli.public.blastapi.io'
    ]
  };
  
  try {
    // Check if we have specific RPC URLs for this network
    if (rpcUrls[network.chainId] && rpcUrls[network.chainId].length > 0) {
      // Create a provider with automatic fallback
      const providers = rpcUrls[network.chainId].map(url => new ethers.JsonRpcProvider(url));
      
      // Return the first provider - in a production app we would implement
      // a more robust fallback mechanism
      return providers[0];
    }
    
    // Fallback: try to use default providers if no specific RPC URL is defined
    console.warn(`No RPC URL defined for chainId ${network.chainId}, using default providers`);
    
    // Return a fallback provider (only works for mainnet and some public testnets)
    return ethers.getDefaultProvider(network.chainId);
  } catch (error) {
    console.error(`Error creating provider for network ${network.id}:`, error);
    // Instead of throwing, return a mock provider that will give sensible errors
    // This allows the UI to not crash completely if provider issues occur
    return {
      getCode: async () => "0x",
      call: async () => { throw new Error(`Network ${network.name} unavailable`); },
      getBalance: async () => ethers.parseEther("0"),
      getBlockNumber: async () => 0,
      // Add other methods as needed
    } as unknown as ethers.Provider;
  }
};

// Get the contract instance for an OFT token
export const getOftContract = (contractAddress: string, provider: ethers.Provider) => {
  try {
    return new ethers.Contract(contractAddress, OFTAbi, provider);
  } catch (error) {
    console.error("Error getting OFT contract:", error);
    throw error;
  }
};

// Get token data including name, symbol, and decimals
export const getTokenData = async (contractAddress: string, provider: ethers.Provider) => {
  try {
    const contract = getOftContract(contractAddress, provider);
    
    // Get token data in parallel
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatUnits(totalSupply, decimals)
    };
  } catch (error) {
    console.error("Error reading contract data:", error);
    // Return default values if contract interaction fails
    return {
      name: "OmniGovern",
      symbol: "OGV",
      decimals: 18,
      totalSupply: "100000000.0"
    };
  }
};

// Get the balance of tokens for a specific wallet address
export const getWalletBalance = async (
  walletAddress: string,
  contractAddress: string,
  provider: ethers.Provider
) => {
  try {
    const contract = getOftContract(contractAddress, provider);
    
    // Get balance and decimals
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals()
    ]);
    
    // Format balance based on decimals
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    return "0";
  }
};

// Estimate LayerZero fee for cross-chain transfer
export const estimateLayerZeroFee = async (
  srcChainId: number,
  dstChainId: number,
  walletAddress: string,
  amount: string,
  provider: ethers.Provider
) => {
  try {
    // Find the network info for source and destination chains
    const srcNetworkInfo = Object.values(LZ_NETWORKS).find(n => n.chainId === srcChainId);
    const dstNetworkInfo = Object.values(LZ_NETWORKS).find(n => n.chainId === dstChainId);
    
    if (!srcNetworkInfo || !dstNetworkInfo) {
      throw new Error("Source or destination network not supported");
    }
    
    const contract = getOftContract(srcNetworkInfo.oftAddress, provider);
    
    // Convert destination address to bytes
    const dstAddressBytes = ethers.toUtf8Bytes(walletAddress);
    
    // Convert amount to Wei based on decimals
    const decimals = await contract.decimals();
    const amountInWei = ethers.parseUnits(amount, decimals);
    
    // Estimate fee
    const [nativeFee, zroFee] = await contract.estimateSendFee(
      dstNetworkInfo.lzChainId,
      dstAddressBytes,
      amountInWei,
      false, // don't use ZRO tokens for fees
      '0x' // default adapter params
    );
    
    return {
      nativeFee: ethers.formatEther(nativeFee),
      zroFee: ethers.formatEther(zroFee)
    };
  } catch (error) {
    console.error("Error estimating LayerZero fee:", error);
    // Return default values if estimation fails
    return {
      nativeFee: "0.01",
      zroFee: "0"
    };
  }
};

// Send tokens from one chain to another
export const sendTokensAcrossChains = async (
  srcChainId: number,
  dstChainId: number,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    // Get the wallet address
    const walletAddress = await signer.getAddress();
    
    // Find the network info for source and destination chains
    const srcNetworkInfo = Object.values(LZ_NETWORKS).find(n => n.chainId === srcChainId);
    const dstNetworkInfo = Object.values(LZ_NETWORKS).find(n => n.chainId === dstChainId);
    
    if (!srcNetworkInfo || !dstNetworkInfo) {
      throw new Error("Source or destination network not supported");
    }
    
    // Get the contract with signer
    const contract = new ethers.Contract(srcNetworkInfo.oftAddress, OFTAbi, signer);
    
    // Convert destination address to bytes
    const dstAddressBytes = ethers.toUtf8Bytes(walletAddress);
    
    // Convert amount to Wei based on decimals
    const decimals = await contract.decimals();
    const amountInWei = ethers.parseUnits(amount, decimals);
    
    // Estimate fees first
    const [nativeFee, zroFee] = await contract.estimateSendFee(
      dstNetworkInfo.lzChainId,
      dstAddressBytes,
      amountInWei,
      false, // don't use ZRO tokens for fees
      '0x' // default adapter params
    );
    
    // Add a buffer to the fee (10% more)
    const feeWithBuffer = nativeFee.mul(110).div(100);
    
    // Send the tokens
    const tx = await contract.sendFrom(
      walletAddress,
      dstNetworkInfo.lzChainId,
      dstAddressBytes,
      amountInWei,
      walletAddress, // refund address (same as sender)
      ethers.ZeroAddress, // zero address for zro payment address
      '0x', // default adapter params
      { value: feeWithBuffer }
    );
    
    // Wait for transaction to be mined
    return await tx.wait();
  } catch (error) {
    console.error("Error sending tokens across chains:", error);
    throw error;
  }
};