export interface Network {
  id: string;
  name: string;
  chainId: number;
  lzChainId: number;
  rpc: string;
  isHub: boolean;
  color: string;
}

export interface NetworkStatus {
  id: number;
  networkId: string;
  name: string;
  chainId: number;
  status: string;
  gasPrice: string | null;
  latency: number | null;
  txCount: number | null;
  updatedAt: Date | null;
}

export interface GasEstimation {
  networkId: string;
  chainId: number;
  baseFee: string;
  priorityFee: string;
  total: string;
  estimatedTimeBlocks: number;
  equivalentUSD?: string;
}

export interface LayerZeroFee {
  messageFee: string;
  dvnFee: string;
  oracleFee: string;
  total: string;
  estimatedUSD?: string;
}

export interface DVNConfiguration {
  networkId: string;
  securityScore: number;
  securityLevel: string;
  dvns: Array<{
    id: string;
    name: string;
    enabled: boolean;
    requiredSignatures: number;
  }>;
}