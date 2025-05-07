export interface Network {
  id: string;
  name: string;
  chainId: number;
  lzChainId: number;
  rpc: string;
  isHub: boolean;
  color: string;
  status?: string;
  latency?: number | null;
  gasPrice?: number | string | null;
  txCount?: number;
  blockNumber?: number;
}