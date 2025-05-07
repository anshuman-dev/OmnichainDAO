// OmniGovern DAO Contract Deployments
import { Network } from '../lib/networkConfig';

// Network Chain IDs
export const CHAIN_IDS = {
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON_AMOY: 80002,
};

// Contract Addresses
interface ContractAddresses {
  [chainId: number]: {
    tokenContract: string;
    proposalExecutor: string;
    dvnManager: string;
  };
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  // Ethereum Sepolia Testnet
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    tokenContract: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Replace with your deployed contract address
    proposalExecutor: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Replace with your deployed contract address
    dvnManager: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Replace with your deployed contract address
  },
  
  // Polygon Amoy Testnet
  [CHAIN_IDS.POLYGON_AMOY]: {
    tokenContract: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Replace with your deployed contract address
    proposalExecutor: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Replace with your deployed contract address
    dvnManager: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Replace with your deployed contract address
  }
};

// Get contract addresses by network
export function getContractAddresses(network: Network): {
  tokenContract: string;
  proposalExecutor: string;
  dvnManager: string;
} | null {
  const chainId = network.chainId;
  return CONTRACT_ADDRESSES[chainId] || null;
}

// LayerZero Endpoints
export const LZ_ENDPOINTS: { [chainId: number]: string } = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  [CHAIN_IDS.POLYGON_AMOY]: '0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3'
};

// LayerZero Chain IDs
export const LZ_CHAIN_IDS: { [chainId: number]: number } = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: 40161, // LZ Chain ID for Sepolia
  [CHAIN_IDS.POLYGON_AMOY]: 40181  // LZ Chain ID for Polygon Amoy
};

// Get LayerZero Chain ID for EVM Chain
export function getLzChainId(evmChainId: number): number | null {
  return LZ_CHAIN_IDS[evmChainId] || null;
}

// DVN Configuration
export interface DVNConfig {
  address: string;
  name: string;
  description: string;
}

export const SUPPORTED_DVNS: DVNConfig[] = [
  {
    address: '0xA9E4cAc2ed786cc9CCF4e9e80fB878E42B577e5F',
    name: 'LayerZero DVN',
    description: 'Official LayerZero Decentralized Verification Network'
  },
  {
    address: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    name: 'OmniGovern DVN',
    description: 'OmniGovern DAO Verification Network'
  },
  {
    address: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
    name: 'Certus DVN',
    description: 'Certus One Verification Network'
  },
];