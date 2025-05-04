export interface TokenStats {
  totalSupply: string;
  price: string;
  volume: string;
  circulatingSupply: string;
}

export interface ChainDistribution {
  name: string;
  amount: string;
  percentage: number;
}

export interface SupplyCheck {
  date: string;
  chain: string;
  event: string;
  status: 'Verified' | 'Reconciled';
}

export interface UserBalance {
  total: string;
  usdValue: string;
}

export interface Contracts {
  oft: string;
  endpoint: string;
}

export interface BridgeFees {
  layerZeroFee: number;
  bridgeFee: number;
  gasFee: number;
  totalCost: number;
}

export interface Network {
  id: string;
  name: string;
  chainId: number;
  status: 'Online' | 'Syncing' | 'Offline';
  latency: number;
  gasPrice: number;
  txCount: number;
}
