import { ChainDistribution, SupplyCheck } from "@/types/token";
import { Network } from "@/types/network";

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
  // OmniGovern token contract (OFT)
  oft: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
  // LayerZero Endpoint on Ethereum Goerli testnet
  endpoint: "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23",
  // OmniGovernor contract
  governor: "0x1234567890123456789012345678901234567890",
  // Timelock controller
  timelock: "0x2345678901234567890123456789012345678901"
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

// Available testnet networks updated for LayerZero V2
export const AVAILABLE_NETWORKS: Network[] = [
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    lzChainId: 10161, // LayerZero chain ID for Sepolia
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
    layerZeroId: 40161, // LayerZero chain ID for Amoy
    status: 'Online',
    latency: 8,
    gasPrice: 0.01,
    txCount: 5432,
    color: '#8247E5',
    isHub: false,
    lzEndpoint: '0xf69186dfBa60DdB133E91E9A4B5673624293d8F8' // LayerZero V2 endpoint on Amoy
  }
];

// Bridge fee percentage (0.1%)
export const BRIDGE_FEE_PERCENTAGE = 0.001;

// Fixed LayerZero fee (in USD)
export const LAYERZERO_BASE_FEE = 0.15;
