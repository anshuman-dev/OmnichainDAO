// Network configuration types and helpers
import { Network as TokenNetwork } from '../types/token';

// Network type definition aligned with token.ts
export interface Network extends TokenNetwork {}

// Available testnet networks updated for LayerZero V2
export const AVAILABLE_NETWORKS: Network[] = [
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    layerZeroId: 40161, // LayerZero chain ID for Sepolia
    status: 'Online',
    latency: 12,
    gasPrice: 0.05,
    txCount: 8765,
    color: '#627EEA',
    isHub: true, // Hub chain for governance coordination
    lzEndpoint: '0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1' // LayerZero V2 endpoint on Sepolia
  },
  {
    id: 'amoy',
    name: 'Polygon Amoy',
    chainId: 80002,
    layerZeroId: 40181, // LayerZero chain ID for Amoy
    status: 'Online',
    latency: 8,
    gasPrice: 0.01,
    txCount: 5432,
    color: '#8247E5',
    isHub: false,
    lzEndpoint: '0xf69186dfBa60DdB133E91E9A4B5673624293d8F8' // LayerZero V2 endpoint on Amoy
  }
];