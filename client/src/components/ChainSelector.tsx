import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Network } from '@/types/network';
import { useNetwork } from '@/hooks/useNetwork';

interface ChainSelectorProps {
  onChainChange?: (network: Network) => void;
  showHubIndicator?: boolean;
}

export default function ChainSelector({ 
  onChainChange, 
  showHubIndicator = true 
}: ChainSelectorProps) {
  const { networks, currentNetwork, setCurrentNetwork, isHubNetwork } = useNetwork();
  
  const handleNetworkChange = (value: string) => {
    const selectedNetwork = networks.find(net => net.id === value);
    if (selectedNetwork) {
      setCurrentNetwork(selectedNetwork);
      if (onChainChange) {
        onChainChange(selectedNetwork);
      }
    }
  };

  // Default color if not specified
  const getNetworkColor = (network: Network) => network.color || '#888888';

  return (
    <div className="flex items-center space-x-4">
      <Select value={currentNetwork.id} onValueChange={handleNetworkChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Chain" />
        </SelectTrigger>
        <SelectContent>
          {networks.map((network) => (
            <SelectItem key={network.id} value={network.id}>
              <div className="flex items-center">
                <span className="mr-2 w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getNetworkColor(network) }}></span>
                {network.name}
                {showHubIndicator && isHubNetwork(network) && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">Hub</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center">
        <span className="w-3 h-3 rounded-full mr-2" 
          style={{ backgroundColor: getNetworkColor(currentNetwork) }}></span>
        <span className="text-sm font-medium">{currentNetwork.name}</span>
        {showHubIndicator && isHubNetwork(currentNetwork) && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">Hub</span>
        )}
      </div>
    </div>
  );
}