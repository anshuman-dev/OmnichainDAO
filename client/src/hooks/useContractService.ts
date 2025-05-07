// Hook for using contract service with current wallet and network
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractService, { ContractError, ContractErrorType } from '../services/contractService';
import { useWallet } from './useWallet';

// Hook for using contract service
export function useContractService() {
  const { provider, network, isConnected } = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<ContractError | null>(null);
  
  // Initialize contract service with current wallet and network
  useEffect(() => {
    if (provider && network && isConnected) {
      try {
        contractService.setProvider(provider);
        contractService.setNetwork(network);
        setIsInitialized(true);
        setError(null);
      } catch (error) {
        setError(new ContractError(
          'Failed to initialize contract service',
          ContractErrorType.CONNECTION_ERROR,
          error
        ));
        setIsInitialized(false);
      }
    } else {
      setIsInitialized(false);
    }
  }, [provider, network, isConnected]);
  
  return {
    contractService,
    isInitialized,
    error,
    clearError: () => setError(null)
  };
}