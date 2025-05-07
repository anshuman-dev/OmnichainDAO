import { useState, useEffect } from 'react';
import { Network, NetworkStatus, GasEstimation, LayerZeroFee, DVNConfiguration } from '@/types/network';

interface NetworkData {
  networks: Network[];
  networkStatus: NetworkStatus[];
  gasEstimations: Record<string, GasEstimation>;
  layerZeroFees: Record<string, LayerZeroFee>;
  dvnConfigurations: Record<string, DVNConfiguration>;
  isLoading: boolean;
  error: Error | null;
  refreshNetworkData: () => Promise<void>;
}

const defaultNetworks: Network[] = [
  {
    id: 'ethereum-sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    lzChainId: 10161,
    rpc: 'https://ethereum-sepolia.publicnode.com',
    isHub: true,
    color: '#5973ff'
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    lzChainId: 10231,
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
    isHub: false,
    color: '#28A0F0'
  },
  {
    id: 'optimism-sepolia',
    name: 'Optimism Sepolia',
    chainId: 11155420,
    lzChainId: 10232,
    rpc: 'https://sepolia.optimism.io',
    isHub: false,
    color: '#FF0420'
  },
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    lzChainId: 10245,
    rpc: 'https://sepolia.base.org',
    isHub: false,
    color: '#0052FF'
  }
];

const useNetworkData = (): NetworkData => {
  const [networks, setNetworks] = useState<Network[]>(defaultNetworks);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus[]>([]);
  const [gasEstimations, setGasEstimations] = useState<Record<string, GasEstimation>>({});
  const [layerZeroFees, setLayerZeroFees] = useState<Record<string, LayerZeroFee>>({});
  const [dvnConfigurations, setDvnConfigurations] = useState<Record<string, DVNConfiguration>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNetworkStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/network/status');
      if (!response.ok) {
        throw new Error('Failed to fetch network status');
      }

      const data = await response.json();
      setNetworkStatus(data);
    } catch (error) {
      console.error('Error fetching network status:', error);
      setError(error instanceof Error ? error : new Error('Unknown error fetching network status'));
    }
  };

  const fetchGasEstimations = async (): Promise<void> => {
    try {
      const response = await fetch('/api/network/gas');
      if (!response.ok) {
        throw new Error('Failed to fetch gas estimations');
      }

      const data = await response.json();
      setGasEstimations(data);
    } catch (error) {
      console.error('Error fetching gas estimations:', error);
      // Don't set error here to not block the UI
    }
  };

  const fetchLayerZeroFees = async (): Promise<void> => {
    try {
      const response = await fetch('/api/layerzero/fees');
      if (!response.ok) {
        throw new Error('Failed to fetch LayerZero fees');
      }

      const data = await response.json();
      setLayerZeroFees(data);
    } catch (error) {
      console.error('Error fetching LayerZero fees:', error);
      // Don't set error here to not block the UI
    }
  };

  const fetchDvnConfigurations = async (): Promise<void> => {
    try {
      const response = await fetch('/api/layerzero/dvn');
      if (!response.ok) {
        throw new Error('Failed to fetch DVN configurations');
      }

      const data = await response.json();
      setDvnConfigurations(data);
    } catch (error) {
      console.error('Error fetching DVN configurations:', error);
      // Don't set error here to not block the UI
    }
  };

  const refreshNetworkData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchNetworkStatus(),
        fetchGasEstimations(),
        fetchLayerZeroFees(),
        fetchDvnConfigurations()
      ]);
    } catch (error) {
      console.error('Error refreshing network data:', error);
      setError(error instanceof Error ? error : new Error('Unknown error refreshing data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshNetworkData();

    // Set up a refresh interval (every 60 seconds)
    const intervalId = setInterval(() => {
      refreshNetworkData();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return {
    networks,
    networkStatus,
    gasEstimations,
    layerZeroFees,
    dvnConfigurations,
    isLoading,
    error,
    refreshNetworkData
  };
};

export default useNetworkData;