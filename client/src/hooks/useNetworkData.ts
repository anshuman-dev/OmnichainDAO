import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface Network {
  id: string;
  name: string;
  chainId: number;
  lzChainId: number; // LayerZero chain ID
  rpc?: string;
  isHub?: boolean;
  color?: string;
  status?: 'active' | 'degraded' | 'inactive';
  blockNumber?: number;
  gasPrice?: string;
  txCount?: number;
  latency?: number;
}

interface NetworkStatus {
  networkId: string;
  status: 'active' | 'degraded' | 'inactive';
  latency?: number;
  blockNumber?: number;
  gasPrice?: string;
  txCount?: number;
  updatedAt?: Date;
}

export function useNetworkData() {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  
  // Get all networks
  const { 
    data: networks = [], 
    isLoading: isLoadingNetworks,
    error: networksError
  } = useQuery<Network[]>({
    queryKey: ['/api/layerzero/networks'],
    queryFn: async () => {
      const response = await fetch('/api/layerzero/networks');
      if (!response.ok) {
        throw new Error('Failed to fetch networks');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Get network status
  const {
    data: networkStatus = [],
    isLoading: isLoadingStatus,
    error: statusError
  } = useQuery<NetworkStatus[]>({
    queryKey: ['/api/networks'],
    queryFn: async () => {
      const response = await fetch('/api/networks');
      if (!response.ok) {
        throw new Error('Failed to fetch network status');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Select a network by ID
  const selectNetwork = useCallback((networkId: string) => {
    const network = networks.find(n => n.id === networkId);
    if (network) {
      setSelectedNetwork(network);
    }
  }, [networks]);
  
  // Get a network by ID
  const getNetwork = useCallback((networkId: string) => {
    return networks.find(n => n.id === networkId) || null;
  }, [networks]);
  
  // Get active networks (those with status 'active')
  const activeNetworks = networks.filter(network => {
    const status = networkStatus.find(s => s.networkId === network.id);
    return !status || status.status === 'active';
  });
  
  // Get hub network
  const hubNetwork = networks.find(n => n.isHub === true) || null;
  
  // Get satellite networks (non-hub networks)
  const satelliteNetworks = networks.filter(n => n.isHub !== true);
  
  // Select the first network if none is selected
  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0]);
    }
  }, [networks, selectedNetwork]);
  
  // Get enhanced networks with status information
  const enhancedNetworks = networks.map(network => {
    const status = networkStatus.find(s => s.networkId === network.id);
    return {
      ...network,
      status: status?.status || 'active',
      blockNumber: status?.blockNumber,
      gasPrice: status?.gasPrice,
      txCount: status?.txCount,
      latency: status?.latency
    };
  });
  
  return {
    networks,
    networkStatus,
    enhancedNetworks,
    selectedNetwork,
    activeNetworks,
    hubNetwork,
    satelliteNetworks,
    isLoadingNetworks,
    isLoadingStatus,
    networksError,
    statusError,
    selectNetwork,
    getNetwork
  };
}