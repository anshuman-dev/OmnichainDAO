import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import ChainSelector from '@/components/ChainSelector';
import { Network } from '@/types/token';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/use-toast';

// Mock DVN data
const MOCK_DVNS = [
  {
    id: 'blockdaemon',
    name: 'Blockdaemon',
    address: '0x71D7a02d21aE5Cb957E6BfF9D6280e2fAa47E223',
    description: 'Enterprise-grade blockchain infrastructure provider',
    requiredSignatures: 1,
    enabled: true
  },
  {
    id: 'layerzero',
    name: 'LayerZero Labs',
    address: '0xA658742d33ebd2ce2F0bdFf73515Aa797Fd161D9',
    description: 'Official validators operated by LayerZero team',
    requiredSignatures: 1,
    enabled: true
  },
  {
    id: 'axelar',
    name: 'Axelar Network',
    address: '0x9768484573D072696F8B1572382619Ab437Af19D',
    description: 'Decentralized cross-chain communication protocol',
    requiredSignatures: 1,
    enabled: false
  }
];

export default function LayerZeroDVNConfig() {
  const { networks, currentNetwork, setCurrentNetwork } = useNetwork();
  const { toast } = useToast();
  
  // State
  const [dvns, setDVNs] = useState(MOCK_DVNS);
  const [minRequiredDVNs, setMinRequiredDVNs] = useState(2);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Toggle DVN enabled status
  const toggleDVN = (dvnId: string) => {
    setDVNs(prev => prev.map(dvn => 
      dvn.id === dvnId ? { ...dvn, enabled: !dvn.enabled } : dvn
    ));
  };
  
  // Update required signatures for a DVN
  const updateRequiredSignatures = (dvnId: string, signatures: number) => {
    setDVNs(prev => prev.map(dvn => 
      dvn.id === dvnId ? { ...dvn, requiredSignatures: signatures } : dvn
    ));
  };
  
  // Check if configuration is valid
  const isConfigValid = () => {
    const enabledDVNs = dvns.filter(dvn => dvn.enabled).length;
    return enabledDVNs >= minRequiredDVNs;
  };
  
  // Calculate security level based on configuration
  const calculateSecurityLevel = () => {
    const enabledDVNs = dvns.filter(dvn => dvn.enabled).length;
    const totalSignatures = dvns.reduce((sum, dvn) => sum + (dvn.enabled ? dvn.requiredSignatures : 0), 0);
    
    if (enabledDVNs < 2) return 'Low';
    if (enabledDVNs === 2 && totalSignatures <= 2) return 'Medium';
    if (enabledDVNs >= 3 || totalSignatures >= 3) return 'High';
    return 'Medium';
  };
  
  // Save configuration
  const saveConfiguration = async () => {
    if (!isConfigValid()) {
      toast({
        title: "Invalid Configuration",
        description: `At least ${minRequiredDVNs} DVNs must be enabled`,
        variant: "destructive",
      });
      return;
    }
    
    setIsConfiguring(true);
    
    try {
      // In a real implementation, this would call the contract to update DVN configuration
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Configuration Saved",
        description: `DVN security configuration updated for ${currentNetwork.name}`,
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Configuration Failed",
        description: "There was an error updating the DVN configuration",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };
  
  // Get security level color
  const getSecurityLevelColor = () => {
    const level = calculateSecurityLevel();
    switch (level) {
      case 'Low': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-amber-600 bg-amber-50';
      case 'High': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>LayerZero DVN Security Configuration</CardTitle>
              <CardDescription>
                Configure Data Validation Network settings for enhanced cross-chain security
              </CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSecurityLevelColor()}`}>
              {calculateSecurityLevel()} Security
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Configure Chain</h3>
              <p className="text-sm text-muted-foreground">
                Select the chain to configure DVN security
              </p>
            </div>
            <ChainSelector />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Minimum Required DVNs</h3>
                <p className="text-sm text-muted-foreground">
                  Minimum number of DVNs required for message verification
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Slider 
                  value={[minRequiredDVNs]}
                  min={1}
                  max={dvns.length}
                  step={1}
                  className="w-32"
                  onValueChange={(value) => setMinRequiredDVNs(value[0])}
                />
                <span className="font-medium">{minRequiredDVNs}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                      stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">What are DVNs?</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Data Validation Networks (DVNs) are third-party validators that verify cross-chain messages for LayerZero. 
                      Configuring multiple DVNs and required signatures enhances security by ensuring message integrity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Available DVNs</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DVN</TableHead>
                  <TableHead>Required Signatures</TableHead>
                  <TableHead>Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dvns.map(dvn => (
                  <TableRow key={dvn.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dvn.name}</div>
                        <div className="text-xs text-muted-foreground">{dvn.address.slice(0, 6)}...{dvn.address.slice(-4)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={dvn.requiredSignatures}
                          onChange={(e) => updateRequiredSignatures(dvn.id, parseInt(e.target.value))}
                          disabled={!dvn.enabled}
                          className="w-16"
                        />
                        <span className="text-xs text-muted-foreground">signatures</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={dvn.enabled}
                        onCheckedChange={() => toggleDVN(dvn.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {!isConfigValid() && (
              <div className="mt-2 text-sm text-red-600">
                At least {minRequiredDVNs} DVNs must be enabled
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline">
            Reset to Defaults
          </Button>
          
          <Button 
            disabled={!isConfigValid() || isConfiguring}
            onClick={saveConfiguration}
          >
            {isConfiguring ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}