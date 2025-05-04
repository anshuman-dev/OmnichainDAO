import { ChainDistribution, SupplyCheck, Network } from "@/types/token";

// Default token stats
export const DEFAULT_TOKEN_STATS = {
  totalSupply: "100,000,000",
  price: "1.25",
  volume: "3,456,789",
  circulatingSupply: "65,432,100"
};

// Default user balance
export const DEFAULT_USER_BALANCE = {
  total: "0.00",
  usdValue: "0.00"
};

// Default contracts
export const DEFAULT_CONTRACTS = {
  oft: "0x1234...5678",
  endpoint: "0xabcd...ef01"
};

// Initial chain distribution
export const INITIAL_CHAIN_DISTRIBUTION: ChainDistribution[] = [
  {
    name: "Ethereum",
    amount: "50,000,000",
    percentage: 50
  },
  {
    name: "Polygon",
    amount: "30,000,000",
    percentage: 30
  },
  {
    name: "Arbitrum",
    amount: "15,000,000",
    percentage: 15
  },
  {
    name: "Base",
    amount: "5,000,000",
    percentage: 5
  }
];

// Initial supply checks
export const INITIAL_SUPPLY_CHECKS: SupplyCheck[] = [
  {
    date: "2025-05-04",
    chain: "Ethereum → Polygon",
    event: "checkSupply()",
    status: "Verified"
  },
  {
    date: "2025-05-03",
    chain: "Arbitrum → Base",
    event: "checkSupply()",
    status: "Verified"
  },
  {
    date: "2025-05-02",
    chain: "All Chains",
    event: "dailyAudit()",
    status: "Verified"
  },
  {
    date: "2025-05-01",
    chain: "Polygon → Arbitrum",
    event: "checkSupply()",
    status: "Reconciled"
  }
];

// Available networks
export const AVAILABLE_NETWORKS: Network[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    status: "Online",
    latency: 125,
    gasPrice: 25,
    txCount: 532
  },
  {
    id: "polygon",
    name: "Polygon",
    chainId: 137,
    status: "Online",
    latency: 85,
    gasPrice: 30,
    txCount: 287
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    status: "Online",
    latency: 92,
    gasPrice: 0.1,
    txCount: 156
  },
  {
    id: "base",
    name: "Base",
    chainId: 8453,
    status: "Syncing",
    latency: 145,
    gasPrice: 0.2,
    txCount: 89
  }
];

// Bridge fee percentage (0.1%)
export const BRIDGE_FEE_PERCENTAGE = 0.001;

// Fixed LayerZero fee (in USD)
export const LAYERZERO_BASE_FEE = 0.15;
