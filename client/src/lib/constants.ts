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

// Testnet contracts - LayerZero Endpoints for testnets
export const DEFAULT_CONTRACTS = {
  oft: "0x3c2269811836af69497E5F486A85D7316753cf62", // OFT contract on Ethereum Goerli testnet
  endpoint: "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23" // LayerZero Endpoint on Ethereum Goerli testnet
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

// Available testnet networks
export const AVAILABLE_NETWORKS: Network[] = [
  {
    id: "ethereum-goerli",
    name: "Ethereum Goerli",
    chainId: 5,
    status: "Online",
    latency: 65,
    gasPrice: 3.2,
    txCount: 0
  },
  {
    id: "polygon-mumbai",
    name: "Polygon Mumbai",
    chainId: 80001,
    status: "Online",
    latency: 45,
    gasPrice: 5.0,
    txCount: 0
  },
  {
    id: "arbitrum-goerli",
    name: "Arbitrum Goerli",
    chainId: 421613,
    status: "Online",
    latency: 55,
    gasPrice: 0.1,
    txCount: 0
  },
  {
    id: "base-goerli",
    name: "Base Goerli",
    chainId: 84531,
    status: "Online",
    latency: 72,
    gasPrice: 0.05,
    txCount: 0
  }
];

// Bridge fee percentage (0.1%)
export const BRIDGE_FEE_PERCENTAGE = 0.001;

// Fixed LayerZero fee (in USD)
export const LAYERZERO_BASE_FEE = 0.15;
