import { ethers } from 'ethers';
import { Network } from '@/types/token';
import OFTAbi from '@/contracts/OFTAbi.json';
import LZEndpointAbi from '@/contracts/LZEndpointAbi.json';
import { getProvider } from './ethereum';

// LayerZero constants for all supported chains
export interface LayerZeroNetworkInfo {
  chainId: number;
  lzChainId: number;
  name: string;
  oftAddress: string;
  endpointAddress: string;
}

// Real testnet addresses
export const LZ_NETWORKS: Record<string, LayerZeroNetworkInfo> = {
  'ethereum-goerli': {
    chainId: 5,
    lzChainId: 10121,
    name: 'Ethereum Goerli',
    oftAddress: '0x509Ee0d083DdF8AC028f2a56731412edD63223B9', // Sample OFT V2 token on Goerli
    endpointAddress: '0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23' // LZ Endpoint on Goerli
  },
  'polygon-mumbai': {
    chainId: 80001,
    lzChainId: 10109,
    name: 'Polygon Mumbai',
    oftAddress: '0xF8731EB567C4C7693cFF993965E76F9B1343e1c8', // Sample OFT V2 token on Mumbai
    endpointAddress: '0xf69186dfBa60DdB133E91E9A4B5673624293d8F8' // LZ Endpoint on Mumbai
  },
  'arbitrum-goerli': {
    chainId: 421613,
    lzChainId: 10143,
    name: 'Arbitrum Goerli',
    oftAddress: '0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab', // Sample OFT V2 token on Arbitrum Goerli
    endpointAddress: '0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3' // LZ Endpoint on Arbitrum Goerli
  },
  'base-goerli': {
    chainId: 84531,
    lzChainId: 10160,
    name: 'Base Goerli',
    oftAddress: '0x0Fc5f8A8A887A8E7D158Fe21D6e9033Ed1c85Fd9', // Sample OFT V2 token on Base Goerli
    endpointAddress: '0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab' // LZ Endpoint on Base Goerli
  }
};

/**
 * Get the OFT contract instance for a specific network
 */
export const getOFTContract = (network: Network) => {
  try {
    const provider = getProvider(network);
    const networkInfo = LZ_NETWORKS[network.id];
    
    if (!networkInfo) {
      throw new Error(`Network not supported: ${network.id}`);
    }
    
    return new ethers.Contract(networkInfo.oftAddress, OFTAbi, provider);
  } catch (error) {
    console.error("Error getting OFT contract:", error);
    throw error;
  }
}

/**
 * Get the LayerZero Endpoint contract instance for a specific network
 */
export const getLZEndpointContract = (network: Network) => {
  try {
    const provider = getProvider(network);
    const networkInfo = LZ_NETWORKS[network.id];
    
    if (!networkInfo) {
      throw new Error(`Network not supported: ${network.id}`);
    }
    
    return new ethers.Contract(networkInfo.endpointAddress, LZEndpointAbi, provider);
  } catch (error) {
    console.error("Error getting LZ Endpoint contract:", error);
    throw error;
  }
}

/**
 * Estimate gas fees for a cross-chain transfer
 */
export const estimateCrossChainFee = async (
  srcNetwork: Network,
  dstNetwork: Network,
  amount: string,
  addressFrom: string
) => {
  try {
    const srcNetworkInfo = LZ_NETWORKS[srcNetwork.id];
    const dstNetworkInfo = LZ_NETWORKS[dstNetwork.id];
    
    if (!srcNetworkInfo || !dstNetworkInfo) {
      throw new Error('Network not supported');
    }
    
    const provider = getProvider(srcNetwork);
    const oftContract = new ethers.Contract(srcNetworkInfo.oftAddress, OFTAbi, provider);
    
    // Convert the destination address to bytes
    const dstAddressBytes = ethers.toUtf8Bytes(addressFrom);
    
    // Convert amount to Wei
    const amountInWei = ethers.parseEther(amount);
    
    // Get fee estimate from the OFT contract
    const [nativeFee, zroFee] = await oftContract.estimateSendFee(
      dstNetworkInfo.lzChainId,
      dstAddressBytes,
      amountInWei,
      false, // don't use ZRO tokens for fees
      '0x' // default adapter params
    );
    
    // Convert the fees from Wei to Ether
    const nativeFeeInEth = ethers.formatEther(nativeFee);
    const zroFeeInEth = ethers.formatEther(zroFee);
    
    return {
      nativeFee: parseFloat(nativeFeeInEth),
      zroFee: parseFloat(zroFeeInEth),
      totalFee: parseFloat(nativeFeeInEth) + parseFloat(zroFeeInEth)
    };
  } catch (error) {
    console.error("Error estimating cross-chain fee:", error);
    // Return default values if estimation fails
    return {
      nativeFee: 0.01,
      zroFee: 0,
      totalFee: 0.01
    };
  }
}

/**
 * Send tokens across chains using OFT
 */
export const sendTokensCrossChain = async (
  srcNetwork: Network,
  dstNetwork: Network,
  amount: string,
  addressFrom: string,
  signer: ethers.Signer
) => {
  try {
    const srcNetworkInfo = LZ_NETWORKS[srcNetwork.id];
    const dstNetworkInfo = LZ_NETWORKS[dstNetwork.id];
    
    if (!srcNetworkInfo || !dstNetworkInfo) {
      throw new Error('Network not supported');
    }
    
    // Get the connected OFT contract with signer
    const oftContract = new ethers.Contract(srcNetworkInfo.oftAddress, OFTAbi, signer);
    
    // Convert amount to Wei
    const amountInWei = ethers.parseEther(amount);
    
    // Convert the destination address to bytes
    const dstAddressBytes = ethers.toUtf8Bytes(addressFrom);
    
    // Estimate the fee first
    const [nativeFee] = await oftContract.estimateSendFee(
      dstNetworkInfo.lzChainId,
      dstAddressBytes,
      amountInWei,
      false, // don't use ZRO tokens for fees
      '0x' // default adapter params
    );
    
    // Add a buffer to the estimated fee (10% more)
    const feeWithBuffer = nativeFee.mul(110).div(100);
    
    // Send the transaction
    const tx = await oftContract.sendFrom(
      addressFrom,
      dstNetworkInfo.lzChainId,
      dstAddressBytes,
      amountInWei,
      addressFrom, // refund address
      ethers.ZeroAddress, // zroPaymentAddress (not using ZRO tokens)
      '0x', // adapterParams
      { value: feeWithBuffer }
    );
    
    // Wait for the transaction to be mined
    return await tx.wait();
  } catch (error) {
    console.error("Error sending tokens across chains:", error);
    throw error;
  }
}

/**
 * Get token balances across all supported chains for an address
 */
export const getBalancesAcrossChains = async (address: string) => {
  const balances: Record<string, string> = {};
  const promises = Object.entries(LZ_NETWORKS).map(async ([networkId, networkInfo]) => {
    try {
      // Create a network object for getProvider
      const network: Network = {
        id: networkId,
        name: networkInfo.name,
        chainId: networkInfo.chainId,
        status: 'Online',
        latency: 50,
        gasPrice: 1,
        txCount: 0
      };
      
      const provider = getProvider(network);
      const oftContract = new ethers.Contract(networkInfo.oftAddress, OFTAbi, provider);
      
      // Get balance
      const balance = await oftContract.balanceOf(address);
      const decimals = await oftContract.decimals();
      
      // Format balance based on decimals
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      balances[networkId] = formattedBalance;
    } catch (error) {
      console.error(`Error getting balance for ${networkId}:`, error);
      balances[networkId] = "0";
    }
  });
  
  await Promise.all(promises);
  return balances;
}

/**
 * Get total token supply across all chains
 */
export const getTotalSupplyAcrossChains = async () => {
  let totalSupply = ethers.parseEther("0");
  
  const promises = Object.entries(LZ_NETWORKS).map(async ([networkId, networkInfo]) => {
    try {
      // Create a network object for getProvider
      const network: Network = {
        id: networkId,
        name: networkInfo.name,
        chainId: networkInfo.chainId,
        status: 'Online',
        latency: 50,
        gasPrice: 1,
        txCount: 0
      };
      
      const provider = getProvider(network);
      const oftContract = new ethers.Contract(networkInfo.oftAddress, OFTAbi, provider);
      
      // Get total supply on this chain
      const supply = await oftContract.totalSupply();
      
      // Add to total
      totalSupply = totalSupply + supply;
    } catch (error) {
      console.error(`Error getting supply for ${networkId}:`, error);
    }
  });
  
  await Promise.all(promises);
  
  // Format the total supply
  return ethers.formatEther(totalSupply);
}

/**
 * Apply for testnet OFT tokens (faucet functionality)
 */
export const requestTestnetTokens = async (
  network: Network,
  address: string,
  signer: ethers.Signer
) => {
  try {
    const networkInfo = LZ_NETWORKS[network.id];
    if (!networkInfo) {
      throw new Error('Network not supported');
    }
    
    // Note: This is a mock function as most testnets don't have OFT faucets
    // In a real implementation, you would call a faucet contract or API
    
    // For demonstration purposes, we'll simulate a 2-second delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: `Requested 100 OGV testnet tokens for ${address} on ${network.name}`
    };
  } catch (error) {
    console.error("Error requesting testnet tokens:", error);
    throw error;
  }
}

/**
 * Verify token supply consistency across chains
 */
export const verifySupplyConsistency = async () => {
  try {
    let totalMinted = ethers.parseEther("0");
    const chainSupplies: Record<string, string> = {};
    
    // Get supply on each chain
    const promises = Object.entries(LZ_NETWORKS).map(async ([networkId, networkInfo]) => {
      try {
        // Create a network object for getProvider
        const network: Network = {
          id: networkId,
          name: networkInfo.name,
          chainId: networkInfo.chainId,
          status: 'Online',
          latency: 50,
          gasPrice: 1,
          txCount: 0
        };
        
        const provider = getProvider(network);
        const oftContract = new ethers.Contract(networkInfo.oftAddress, OFTAbi, provider);
        
        // Get total supply on this chain
        const supply = await oftContract.totalSupply();
        const formattedSupply = ethers.formatEther(supply);
        chainSupplies[networkId] = formattedSupply;
        
        // Add to total
        totalMinted = totalMinted + supply;
      } catch (error) {
        console.error(`Error getting supply for ${networkId}:`, error);
      }
    });
    
    await Promise.all(promises);
    
    // Check if the token supply is consistent
    const isConsistent = (totalMinted.toString() === ethers.parseEther("100000000").toString());
    
    return {
      isConsistent,
      totalMinted: ethers.formatEther(totalMinted),
      expectedTotal: "100,000,000",
      chainSupplies
    };
  } catch (error) {
    console.error("Error verifying supply consistency:", error);
    return {
      isConsistent: false,
      totalMinted: "0",
      expectedTotal: "100,000,000",
      chainSupplies: {}
    };
  }
}