import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Network } from '@/types/network';

export function useNetworkData() {
  const [networks, setNetworks] = useState<Network[]>([]);
  
  // Fetch network data from API
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['/api/layerzero/networks'],
    queryFn: () => apiRequest('/api/layerzero/networks'),
  });
  
  // Fetch network status data
  const { data: statusData } = useQuery({
    queryKey: ['/api/networks'],
    queryFn: () => apiRequest('/api/networks'),
  });
  
  // Process and merge network data with status
  useEffect(() => {
    if (data && Array.isArray(data)) {
      let networksWithStatus = data.map(network => {
        // Find status for this network if available
        const status = statusData && Array.isArray(statusData) 
          ? statusData.find(s => s.networkId === network.id)
          : null;
          
        return {
          ...network,
          // Add additional status information if available
          status: status?.status || 'unknown',
          latency: status?.latency || null,
          gasPrice: status?.gasPrice ? parseFloat(status.gasPrice) : null,
          txCount: status?.txCount || 0
        } as Network;
      });
      
      setNetworks(networksWithStatus);
    }
  }, [data, statusData]);
  
  return { 
    networks, 
    isLoading, 
    error: error as Error | null,
    setNetworks
  };
}