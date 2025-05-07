// Hook for DVN Configuration Management
import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import { useNetwork } from './useNetwork';
import { useContractService } from './useContractService';
import { SUPPORTED_DVNS } from '../config/contracts';
import { ContractErrorType } from '../services/contractService';

export interface DVNStatus {
  address: string;
  name: string; 
  description: string;
  enabled: boolean;
  requiredSignatures: number;
}

export interface NetworkSecurityConfig {
  chainId: string;
  name: string;
  securityLevel: number;
  dvns: DVNStatus[];
}

export function useDVNConfig() {
  const { toast } = useToast();
  const { currentNetwork, networks } = useNetwork();
  const { contractService, isInitialized } = useContractService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [securityConfigs, setSecurityConfigs] = useState<NetworkSecurityConfig[]>([]);
  const [selectedSecurityLevel, setSelectedSecurityLevel] = useState(1);
  const [selectedDVNs, setSelectedDVNs] = useState<string[]>([]);
  
  // Get DVN configurations for all networks
  const fetchDVNConfigs = useCallback(async () => {
    if (!isInitialized || !currentNetwork) return;
    
    setIsLoading(true);
    
    try {
      const configs: NetworkSecurityConfig[] = [];
      
      for (const network of networks) {
        try {
          if (!network.chainId) continue;
          
          // Set network for contract service
          contractService.setNetwork(network);
          
          // Get chain ID as number
          const chainId = parseInt(network.chainId);
          
          // Get security level
          const securityLevel = await contractService.getSecurityLevel(chainId);
          
          // Get DVN configuration
          const dvnConfig = await contractService.getDVNs(chainId);
          
          // Create DVN status records
          const dvnStatuses: DVNStatus[] = [];
          
          // Map addresses to status
          if (dvnConfig.addresses.length === dvnConfig.enabled.length && 
              dvnConfig.enabled.length === dvnConfig.requiredSignatures.length) {
            
            for (let i = 0; i < dvnConfig.addresses.length; i++) {
              const addr = dvnConfig.addresses[i];
              const dvnInfo = SUPPORTED_DVNS.find(d => d.address.toLowerCase() === addr.toLowerCase());
              
              dvnStatuses.push({
                address: addr,
                name: dvnInfo?.name || 'Unknown DVN',
                description: dvnInfo?.description || 'Unknown Verification Network',
                enabled: dvnConfig.enabled[i],
                requiredSignatures: dvnConfig.requiredSignatures[i]
              });
            }
          }
          
          // If no DVNs found, add all as disabled
          if (dvnStatuses.length === 0) {
            for (const dvn of SUPPORTED_DVNS) {
              dvnStatuses.push({
                ...dvn,
                enabled: false,
                requiredSignatures: 1
              });
            }
          }
          
          // Add network config
          configs.push({
            chainId: network.chainId,
            name: network.name,
            securityLevel,
            dvns: dvnStatuses
          });
          
        } catch (error) {
          console.error(`Error getting DVN config for ${network.name}:`, error);
          
          // Add default config for this network
          configs.push({
            chainId: network.chainId || '0',
            name: network.name,
            securityLevel: 1,
            dvns: SUPPORTED_DVNS.map(dvn => ({
              ...dvn,
              enabled: false,
              requiredSignatures: 1
            }))
          });
        }
      }
      
      setSecurityConfigs(configs);
      
      // Set selected security level from current network
      if (currentNetwork && currentNetwork.chainId) {
        const currentNetworkConfig = configs.find(c => c.chainId === currentNetwork.chainId);
        if (currentNetworkConfig) {
          setSelectedSecurityLevel(currentNetworkConfig.securityLevel);
          
          // Set selected DVNs from current network
          const enabledDVNs = currentNetworkConfig.dvns
            .filter(dvn => dvn.enabled)
            .map(dvn => dvn.address);
          
          setSelectedDVNs(enabledDVNs);
        }
      }
      
    } catch (error) {
      console.error('Error fetching DVN configs:', error);
      toast({
        title: 'Failed to load security configurations',
        description: 'Could not retrieve DVN settings. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [contractService, currentNetwork, networks, isInitialized, toast]);
  
  // Apply security settings to current network
  const applySecuritySettings = useCallback(async () => {
    if (!isInitialized || !currentNetwork || !currentNetwork.chainId) {
      toast({
        title: 'Cannot apply settings',
        description: 'Please connect your wallet and select a network first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Set network for contract service
      contractService.setNetwork(currentNetwork);
      
      // Get chain ID as number
      const chainId = parseInt(currentNetwork.chainId);
      
      // 1. Set security level
      await contractService.setSecurityLevel(chainId, selectedSecurityLevel);
      
      // Get current DVN configuration
      const currentConfig = securityConfigs.find(c => c.chainId === currentNetwork.chainId);
      
      if (currentConfig) {
        // 2. Update each DVN
        for (const dvn of currentConfig.dvns) {
          const isSelected = selectedDVNs.includes(dvn.address);
          
          // Only update if the state has changed
          if (isSelected !== dvn.enabled) {
            await contractService.configureDVN(
              chainId,
              dvn.address,
              isSelected
            );
            
            // If enabled, set required signatures
            if (isSelected) {
              await contractService.setDVNRequiredSignatures(
                chainId,
                dvn.address,
                dvn.requiredSignatures
              );
            }
          }
        }
      }
      
      toast({
        title: 'Security settings applied',
        description: `Security configuration updated for ${currentNetwork.name}.`,
      });
      
      // Refresh DVN configs
      fetchDVNConfigs();
      
    } catch (error: any) {
      console.error('Error applying security settings:', error);
      
      // Handle different error types
      if (error.type === ContractErrorType.USER_REJECTED) {
        toast({
          title: 'Transaction rejected',
          description: 'You rejected the security configuration transaction.',
          variant: 'destructive',
        });
      } else if (error.type === ContractErrorType.INSUFFICIENT_FUNDS) {
        toast({
          title: 'Insufficient funds',
          description: 'You do not have enough funds to complete this transaction.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to apply security settings',
          description: error.message || 'An error occurred while updating security configuration.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    contractService, 
    currentNetwork, 
    isInitialized, 
    selectedSecurityLevel, 
    selectedDVNs, 
    securityConfigs, 
    toast, 
    fetchDVNConfigs
  ]);
  
  // Toggle a DVN in the selected list
  const toggleDVN = useCallback((address: string) => {
    setSelectedDVNs(prev => {
      if (prev.includes(address)) {
        return prev.filter(a => a !== address);
      } else {
        return [...prev, address];
      }
    });
  }, []);
  
  // Load DVN configs on initialization
  useEffect(() => {
    if (isInitialized && currentNetwork) {
      fetchDVNConfigs();
    }
  }, [isInitialized, currentNetwork, fetchDVNConfigs]);
  
  return {
    isLoading,
    securityConfigs,
    selectedSecurityLevel,
    setSelectedSecurityLevel,
    selectedDVNs,
    toggleDVN,
    applySecuritySettings,
    refreshConfigs: fetchDVNConfigs
  };
}