import { useQuery } from '@tanstack/react-query';
import { Network, NetworkStatus } from '@/types/network';

/**
 * Hook to fetch LayerZero network data and statuses
 */
export default function useNetworkData() {
  const {
    data: networks,
    isLoading: isLoadingNetworks, 
    error: networksError
  } = useQuery({
    queryKey: ['layerzero', 'networks'],
    queryFn: async (): Promise<Network[]> => {
      const response = await fetch('/api/layerzero/networks');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch networks');
      }
      return await response.json();
    }
  });
  
  const {
    data: networkStatus,
    isLoading: isLoadingStatus,
    error: statusError
  } = useQuery({
    queryKey: ['networks', 'status'],
    queryFn: async (): Promise<NetworkStatus[]> => {
      const response = await fetch('/api/networks');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch network status');
      }
      return await response.json();
    }
  });
  
  const getNetworkById = (id: string): Network | undefined => {
    return networks?.find(network => network.id === id);
  };
  
  const getNetworkByChainId = (chainId: number): Network | undefined => {
    return networks?.find(network => network.chainId === chainId);
  };
  
  const getNetworkStatusById = (id: string): NetworkStatus | undefined => {
    return networkStatus?.find(status => status.networkId === id);
  };
  
  return {
    networks,
    networkStatus,
    isLoading: isLoadingNetworks || isLoadingStatus,
    error: networksError || statusError,
    getNetworkById,
    getNetworkByChainId,
    getNetworkStatusById
  };
}