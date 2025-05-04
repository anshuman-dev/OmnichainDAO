/**
 * Deployment constants for OmniGovern DAO
 */

// LayerZero endpoints on each testnet
const LZ_ENDPOINTS = {
  // Ethereum Goerli
  5: "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23",
  // Polygon Mumbai
  80001: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
  // Arbitrum Goerli
  421613: "0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3",
  // Base Goerli
  84531: "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab",
};

// LayerZero chain IDs
const LZ_CHAIN_IDS = {
  // Ethereum Goerli
  5: 10121,
  // Polygon Mumbai
  80001: 10109,
  // Arbitrum Goerli
  421613: 10143,
  // Base Goerli
  84531: 10160,
};

// OmniGovern DAO configuration
const DAO_CONFIG = {
  // Token configuration
  token: {
    name: "OmniGovern Token",
    symbol: "OGV",
    initialSupply: "100000000000000000000000000", // 100 million tokens with 18 decimals
    bridgeFeeRate: "1000", // 0.1% (denominator is 1,000,000)
  },
  
  // Timelock configuration
  timelock: {
    minDelay: 60 * 60 * 24, // 1 day in seconds
  },
  
  // Governor configuration
  governor: {
    name: "OmniGovern DAO",
    votingDelay: 1, // 1 block delay before voting starts
    votingPeriod: 45818, // ~1 week (assuming 13 sec block time)
    proposalThreshold: "1000000000000000000000", // 1000 tokens with 18 decimals
  }
};

// Configuration for trusted remote connections between chains
const TRUSTED_REMOTES = {
  // Format: sourceChainId => { destChainId => { remoteAddress } }
  5: {
    80001: "", // Will be populated during deployment
    421613: "",
    84531: "",
  },
  80001: {
    5: "",
    421613: "",
    84531: "",
  },
  421613: {
    5: "",
    80001: "",
    84531: "",
  },
  84531: {
    5: "",
    80001: "",
    421613: "",
  },
};

module.exports = {
  LZ_ENDPOINTS,
  LZ_CHAIN_IDS,
  DAO_CONFIG,
  TRUSTED_REMOTES,
};