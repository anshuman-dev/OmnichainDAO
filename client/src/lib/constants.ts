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

// Testnet contracts - Using a verified token contract on Goerli
export const DEFAULT_CONTRACTS = {
  // This is a real testnet token contract (USDT on Goerli)
  oft: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
  // LayerZero Endpoint on Ethereum Goerli testnet
  endpoint: "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23"
};

// Initial testnet chain distribution
export const INITIAL_CHAIN_DISTRIBUTION: ChainDistribution[] = [
  {
    name: "Ethereum Goerli",
    amount: "50,000,000",
    percentage: 50
  },
  {
    name: "Polygon Mumbai",
    amount: "30,000,000",
    percentage: 30
  },
  {
    name: "Arbitrum Goerli",
    amount: "15,000,000",
    percentage: 15
  },
  {
    name: "Base Goerli",
    amount: "5,000,000",
    percentage: 5
  }
];

// Initial testnet supply checks
export const INITIAL_SUPPLY_CHECKS: SupplyCheck[] = [
  {
    date: "2025-05-04",
    chain: "Goerli → Mumbai",
    event: "checkSupply()",
    status: "Verified"
  },
  {
    date: "2025-05-03",
    chain: "Arbitrum Goerli → Base Goerli",
    event: "checkSupply()",
    status: "Verified"
  },
  {
    date: "2025-05-02",
    chain: "All Testnets",
    event: "dailyAudit()",
    status: "Verified"
  },
  {
    date: "2025-05-01",
    chain: "Mumbai → Arbitrum Goerli",
    event: "checkSupply()",
    status: "Reconciled"
  }
];

// Available testnet networks
export const AVAILABLE_NETWORKS: Network[] = [
  {
    id: 'ethereum-goerli',
    name: 'Ethereum Goerli',
    chainId: 5,
    status: 'Online',
    latency: 26,
    gasPrice: 3.21,
    txCount: 7891
  },
  {
    id: 'polygon-mumbai',
    name: 'Polygon Mumbai',
    chainId: 80001,
    status: 'Online',
    latency: 15,
    gasPrice: 1.12,
    txCount: 12034
  },
  {
    id: 'arbitrum-goerli',
    name: 'Arbitrum Goerli',
    chainId: 421613,
    status: 'Online',
    latency: 8,
    gasPrice: 0.25,
    txCount: 5421
  },
  {
    id: 'base-goerli',
    name: 'Base Goerli',
    chainId: 84531,
    status: 'Online',
    latency: 12,
    gasPrice: 0.1,
    txCount: 3182
  }
];

// Bridge fee percentage (0.1%)
export const BRIDGE_FEE_PERCENTAGE = 0.001;

// Fixed LayerZero fee (in USD)
export const LAYERZERO_BASE_FEE = 0.15;
