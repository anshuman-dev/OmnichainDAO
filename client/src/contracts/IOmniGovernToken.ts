// Interface for OmniGovernToken - LayerZero OFT Implementation
import { ethers } from 'ethers';

export const OmniGovernTokenABI = [
  // ERC20 Standard Functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // OFT Specific Functions
  "function estimateSendFee(uint16 dstChainId, bytes calldata toAddress, uint amount, bool useZro, bytes calldata adapterParams) view returns (uint nativeFee, uint zroFee)",
  "function sendFrom(address from, uint16 dstChainId, bytes calldata toAddress, uint amount, address payable refundAddress, address zroPaymentAddress, bytes calldata adapterParams) payable returns (uint)",
  "function circulatingSupply() view returns (uint256)",
  
  // Governance Functions
  "function delegate(address delegatee) returns (bool)",
  "function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) returns (bool)",
  "function delegates(address account) view returns (address)",
  "function getVotes(address account) view returns (uint256)",
  "function getPastVotes(address account, uint blockNumber) view returns (uint256)",
  "function getPastTotalSupply(uint blockNumber) view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  "event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance)",
  "event SendToChain(uint16 indexed dstChainId, address indexed from, bytes toAddress, uint amount)",
  "event ReceiveFromChain(uint16 indexed srcChainId, address indexed to, uint amount)"
];

export interface OmniGovernToken extends ethers.Contract {
  // Basic ERC20 Functions
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<ethers.BigNumber>;
  balanceOf(account: string): Promise<ethers.BigNumber>;
  transfer(to: string, amount: ethers.BigNumberish): Promise<ethers.ContractTransaction>;
  allowance(owner: string, spender: string): Promise<ethers.BigNumber>;
  approve(spender: string, amount: ethers.BigNumberish): Promise<ethers.ContractTransaction>;
  transferFrom(from: string, to: string, amount: ethers.BigNumberish): Promise<ethers.ContractTransaction>;
  
  // OFT Specific Functions
  estimateSendFee(
    dstChainId: number, 
    toAddress: string, 
    amount: ethers.BigNumberish, 
    useZro: boolean, 
    adapterParams: string
  ): Promise<[ethers.BigNumber, ethers.BigNumber]>;
  
  sendFrom(
    from: string,
    dstChainId: number,
    toAddress: string,
    amount: ethers.BigNumberish,
    refundAddress: string,
    zroPaymentAddress: string,
    adapterParams: string,
    overrides?: ethers.PayableOverrides
  ): Promise<ethers.ContractTransaction>;
  
  circulatingSupply(): Promise<ethers.BigNumber>;
  
  // Governance Functions
  delegate(delegatee: string): Promise<ethers.ContractTransaction>;
  delegateBySig(
    delegatee: string, 
    nonce: ethers.BigNumberish, 
    expiry: ethers.BigNumberish, 
    v: number, 
    r: string, 
    s: string
  ): Promise<ethers.ContractTransaction>;
  delegates(account: string): Promise<string>;
  getVotes(account: string): Promise<ethers.BigNumber>;
  getPastVotes(account: string, blockNumber: ethers.BigNumberish): Promise<ethers.BigNumber>;
  getPastTotalSupply(blockNumber: ethers.BigNumberish): Promise<ethers.BigNumber>;
}

export function getOmniGovernTokenContract(
  address: string, 
  provider: ethers.providers.Provider | ethers.Signer
): OmniGovernToken {
  return new ethers.Contract(address, OmniGovernTokenABI, provider) as OmniGovernToken;
}