/**
 * Network type definitions for the OmniGovern DAO platform
 * These types help manage blockchain network information
 */

// Supported network types
export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

// Network status options
export type NetworkStatus = 'active' | 'degraded' | 'inactive';

// Network interface for LayerZero compatible chains
export interface Network {
  id: string;              // Unique identifier (e.g., 'sepolia')
  name: string;            // Display name (e.g., 'Ethereum Sepolia')
  chainId: number;         // EVM chain ID
  lzChainId: number;       // LayerZero endpoint ID
  rpc?: string;            // RPC endpoint URL
  explorer?: string;       // Block explorer URL
  isHub?: boolean;         // Whether this is a hub chain in the LayerZero network
  color?: string;          // Brand color for UI
  logo?: string;           // Logo URL
  type?: NetworkType;      // Network type
  status?: NetworkStatus;  // Current network status
  blockNumber?: number;    // Latest block number
  gasPrice?: string;       // Current gas price
  txCount?: number;        // Recent transaction count
  latency?: number;        // Network latency in ms
}

// DVN (Decentralized Verification Network) configuration
export interface DVNConfig {
  id: string;              // DVN identifier
  name: string;            // DVN name
  enabled: boolean;        // Whether this DVN is enabled
  requiredSignatures: number; // Number of required signatures
  securityLevel?: number;  // Security level 1-4
}

// Security settings for a network
export interface NetworkSecurity {
  networkId: string;
  securityScore: number;   // 0-100 score
  securityLevel: string;   // "Low", "Medium", "High"
  settings?: {
    securityLevel: number;
    trustedEndpointMode: boolean;
    multiSignatureVerification: boolean;
    enabledDvns: string[];
  };
  dvns: DVNConfig[];
}