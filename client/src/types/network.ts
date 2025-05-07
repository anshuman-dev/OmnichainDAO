/**
 * Network related types for the LayerZero networks
 */

// Network interface for a blockchain network
export interface Network {
  id: string;           // Unique identifier for the network
  name: string;         // Display name (e.g., "Ethereum Sepolia")
  chainId: number;      // EVM chain ID
  lzChainId: number;    // LayerZero chain ID (used in LZ protocol)
  rpc: string;          // RPC endpoint URL
  isHub: boolean;       // Whether this network is a LayerZero Hub
  color: string;        // Color code for UI representation
}

// Network status interface for monitoring network health
export interface NetworkStatus {
  id: number;           // Status ID
  networkId: string;    // Corresponds to Network.id
  name: string;         // Display name
  chainId: number;      // EVM chain ID
  status: string;       // 'active', 'congested', 'inactive'
  gasPrice: string | null; // Current gas price in gwei
  latency: number | null;  // Network latency in ms
  txCount: number | null;  // Recent transaction count
  updatedAt: Date | null;  // Last update timestamp
}

// Gas fee estimation interface
export interface GasEstimation {
  networkId: string;           // Corresponds to Network.id
  chainId: number;             // EVM chain ID
  baseFee: string;             // Base fee in gwei
  priorityFee: string;         // Priority fee in gwei
  total: string;               // Total gas price
  estimatedTimeBlocks: number; // Estimated confirmation time
  equivalentUSD?: string;      // USD equivalent (if available)
}

// LayerZero fee structure
export interface LayerZeroFee {
  messageFee: string;      // Fee for message 
  dvnFee: string;          // Fee for DVN (verification)
  oracleFee: string;       // Fee for Oracle
  total: string;           // Total LayerZero fee
  estimatedUSD?: string;   // USD equivalent (if available)
}

// DVN configuration interface
export interface DVNConfiguration {
  networkId: string;           // Corresponds to Network.id
  securityScore: number;       // Overall security score (0-100)
  securityLevel: string;       // "low", "medium", "high"
  dvns: Array<{                // List of DVNs available
    id: string;                // DVN identifier
    name: string;              // Display name 
    enabled: boolean;          // Whether it's currently enabled
    requiredSignatures: number; // Signatures needed
  }>;
}