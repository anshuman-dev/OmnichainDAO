import { ethers } from 'ethers';
import { Network } from '@/types/token';

// ABI for OFT contract (simplified for this example)
const oftAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function sendFrom(address _from, uint16 _dstChainId, bytes _toAddress, uint256 _amount) payable"
];

export const getProvider = (network: Network) => {
  try {
    // If MetaMask or other web3 provider is available, use it
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    
    // Otherwise, fall back to public RPC endpoints
    // Note: You might want to use your own API keys for production
    // These are for demonstration only
    const infuraApiKey = "9aa3d95b3bc440fa88ea12eaa4456161"; // Public infura key
    
    switch (network.id) {
      case 'ethereum-goerli':
        return new ethers.JsonRpcProvider(`https://goerli.infura.io/v3/${infuraApiKey}`);
      case 'polygon-mumbai':
        return new ethers.JsonRpcProvider(`https://polygon-mumbai.infura.io/v3/${infuraApiKey}`);
      case 'arbitrum-goerli':
        return new ethers.JsonRpcProvider(`https://arbitrum-goerli.infura.io/v3/${infuraApiKey}`);
      case 'base-goerli':
        return new ethers.JsonRpcProvider('https://goerli.base.org');
      default:
        console.warn(`No specific provider for network: ${network.id}, using Goerli as fallback`);
        return new ethers.JsonRpcProvider(`https://goerli.infura.io/v3/${infuraApiKey}`);
    }
  } catch (error) {
    console.error('Error getting provider:', error);
    // Return a fallback provider that will handle errors gracefully
    return {
      getNetwork: () => Promise.reject(new Error("Network unavailable")),
      call: () => Promise.reject(new Error("Network unavailable"))
    } as unknown as ethers.Provider;
  }
};

export const getOftContract = (contractAddress: string, provider: ethers.Provider) => {
  try {
    return new ethers.Contract(contractAddress, oftAbi, provider);
  } catch (error) {
    console.error('Error getting OFT contract:', error);
    throw error;
  }
};

export const getTokenData = async (contractAddress: string, provider: ethers.Provider) => {
  try {
    // First check if the provider is connected
    try {
      await provider.getNetwork();
    } catch (error) {
      console.error('Provider not connected:', error);
      return {
        name: "OmniGovern",
        symbol: "OGV",
        decimals: 18,
        totalSupply: "100,000,000" // Default value if we can't connect
      };
    }
    
    const contract = getOftContract(contractAddress, provider);
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      // Format total supply with commas
      const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);
      const numberWithCommas = Number(formattedTotalSupply).toLocaleString();
      
      return {
        name,
        symbol,
        decimals,
        totalSupply: numberWithCommas
      };
    } catch (contractError) {
      console.error('Error reading contract data:', contractError);
      // Return default values if contract interaction fails
      return {
        name: "OmniGovern",
        symbol: "OGV",
        decimals: 18,
        totalSupply: "100,000,000" // Default value if contract interaction fails
      };
    }
  } catch (error) {
    console.error('Error getting token data:', error);
    // Return default values if all else fails
    return {
      name: "OmniGovern",
      symbol: "OGV",
      decimals: 18,
      totalSupply: "100,000,000" // Default value
    };
  }
};

export const getWalletBalance = async (
  contractAddress: string, 
  walletAddress: string,
  provider: ethers.Provider
) => {
  try {
    // Check if the provider is connected
    try {
      await provider.getNetwork();
    } catch (error) {
      console.error('Provider not connected when getting balance:', error);
      return "0.00"; // Default value if we can't connect
    }
    
    const contract = getOftContract(contractAddress, provider);
    
    try {
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals()
      ]);
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      return formattedBalance;
    } catch (contractError) {
      console.error('Error reading wallet balance from contract:', contractError);
      return "0.00"; // Default value if contract interaction fails
    }
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return "0.00"; // Default value if all else fails
  }
};

export const estimateLayerZeroFee = async (
  oftContractAddress: string,
  fromAddress: string, 
  dstChainId: number, 
  toAddress: string, 
  amount: string,
  provider: ethers.Provider
) => {
  try {
    // In a real implementation, we would call the estimateSendFee function on the OFT contract
    // For this example, we'll return a fixed fee
    return ethers.parseEther('0.001');
  } catch (error) {
    console.error('Error estimating LayerZero fee:', error);
    throw error;
  }
};

export const sendTokensAcrossChains = async (
  oftContractAddress: string,
  fromAddress: string,
  dstChainId: number,
  toAddress: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    const contract = new ethers.Contract(oftContractAddress, oftAbi, signer);
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount);
    
    // Estimate the fee
    const fee = await estimateLayerZeroFee(
      oftContractAddress,
      fromAddress,
      dstChainId,
      toAddress,
      amount,
      signer.provider as ethers.Provider
    );
    
    // Send transaction with the fee
    const tx = await contract.sendFrom(
      fromAddress,
      dstChainId,
      ethers.toUtf8Bytes(toAddress),
      amountWei,
      { value: fee }
    );
    
    return tx;
  } catch (error) {
    console.error('Error sending tokens across chains:', error);
    throw error;
  }
};