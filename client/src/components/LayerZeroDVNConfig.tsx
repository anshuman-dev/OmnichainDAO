import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import ChainSelector from '@/components/ChainSelector';
import { useToast } from '@/hooks/use-toast';
import { Network } from '@/types/token';
import { useNetwork } from '@/hooks/useNetwork';
import { useWallet } from '@/hooks/useWallet';

// DVN providers focused on actual LayerZero technology
const DVN_PROVIDERS = [
  { 
    id: 'default', 
    name: 'LayerZero Default DVN', 
    description: 'The standard DVN package provided by LayerZero', 
    fee: 0.010, 
    reliability: 99.995, 
    logoColor: '#3B82F6'
  },
  { 
    id: 'ultra', 
    name: 'Ultra Secure DVN', 
    description: 'Enhanced security with additional validators and advanced cryptographic verification',
    fee: 0.018, 
    reliability: 99.999, 
    logoColor: '#8B5CF6'
  },
  { 
    id: 'lite', 
    name: 'Lite DVN', 
    description: 'Optimized for lower cost with fewer validators but still maintaining security',
    fee: 0.006, 
    reliability: 99.98, 
    logoColor: '#10B981'
  }
];

export default function LayerZeroDVNConfig() {
  const { currentNetwork } = useNetwork();
  const { isConnected } = useWallet();
  const { toast } = useToast();
  
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(currentNetwork);
  const [securityLevel, setSecurityLevel] = useState(2);
  const [selectedDvns, setSelectedDvns] = useState<string[]>(['default']);
  const [trustedEndpoints, setTrustedEndpoints] = useState(false);
  const [multiSignatureVerification, setMultiSignatureVerification] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configProgress, setConfigProgress] = useState(0);
  
  // Toggle DVN selection
  const toggleDvn = (dvnId: string) => {
    setSelectedDvns(prev => {
      // If DVN is already selected, remove it (unless it's the last one)
      if (prev.includes(dvnId)) {
        return prev.length > 1 ? prev.filter(id => id !== dvnId) : prev;
      } 
      // Otherwise add it
      return [...prev, dvnId];
    });
  };
  
  // Calculate security score based on settings
  const calculateSecurityScore = () => {
    let score = 0;
    
    // Base score from selected DVNs
    selectedDvns.forEach(dvnId => {
      const dvn = DVN_PROVIDERS.find(d => d.id === dvnId);
      if (dvn) {
        score += dvn.id === 'ultra' ? 40 : dvn.id === 'default' ? 30 : 20;
      }
    });
    
    // Additional score from security level
    score += securityLevel * 10;
    
    // Score from additional security features
    if (trustedEndpoints) score += 15;
    if (multiSignatureVerification) score += 25;
    
    // Normalize to 0-100
    return Math.min(100, score);
  };
  
  // Calculate estimated gas fee for this configuration
  const calculateEstimatedFee = () => {
    let baseFee = 0;
    
    // Sum the fees of selected DVNs
    selectedDvns.forEach(dvnId => {
      const dvn = DVN_PROVIDERS.find(d => d.id === dvnId);
      if (dvn) baseFee += dvn.fee;
    });
    
    // Apply security level multiplier
    const securityMultiplier = 1 + (securityLevel - 1) * 0.15;
    
    // Apply additional features multiplier
    const featuresMultiplier = 1 + 
      (trustedEndpoints ? 0.1 : 0) + 
      (multiSignatureVerification ? 0.2 : 0);
    
    return (baseFee * securityMultiplier * featuresMultiplier).toFixed(4);
  };
  
  // Update the DVN configuration
  const updateConfiguration = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to configure DVN settings",
        variant: "destructive",
      });
      return;
    }
    
    setIsConfiguring(true);
    setConfigProgress(0);
    
    try {
      // Step 1: Initialize configuration
      setConfigProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Initializing DVN Configuration",
        description: `Preparing security settings for ${selectedNetwork.name}`,
      });
      
      // Step 2: Update endpoint configuration
      setConfigProgress(30);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Updating Endpoint Settings",
        description: "Configuring cross-chain message verification parameters",
      });
      
      // Step 3: Apply DVN selections
      setConfigProgress(60);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Final step: Confirm configuration
      setConfigProgress(90);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      setConfigProgress(100);
      toast({
        title: "DVN Configuration Complete",
        description: `Your security settings have been applied to ${selectedNetwork.name}`,
      });
      
      // Reset after showing completion
      setTimeout(() => {
        setIsConfiguring(false);
        setConfigProgress(0);
      }, 2000);
      
    } catch (error) {
      console.error("Error configuring DVN:", error);
      toast({
        title: "Configuration Failed",
        description: "There was an error updating your security settings",
        variant: "destructive",
      });
      setIsConfiguring(false);
    }
  };
  
  // Get security level description
  const getSecurityLevelDescription = () => {
    switch(securityLevel) {
      case 1: return "Basic verification with minimal confirmations";
      case 2: return "Standard verification with balanced security";
      case 3: return "Advanced verification with multiple confirmations";
      case 4: return "Maximum security with extended verification";
      default: return "Custom security level";
    }
  };
  
  const securityScore = calculateSecurityScore();
  
  return (
    <div className="space-y-6">
      <Card className="w-full bg-gray-900 border border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">DVN Security Configuration</CardTitle>
              <CardDescription className="text-gray-400">
                Enhance your cross-chain message security with LayerZero's DVN
              </CardDescription>
            </div>
            <div>
              <ChainSelector onChainChange={setSelectedNetwork} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-900/20 border border-blue-900/30 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" className="mr-2">
                  <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400">What are Data Validation Networks (DVNs)?</h3>
                <p className="text-sm text-gray-300 mt-1">
                  DVNs are a critical component of LayerZero's security architecture. They provide independent verification 
                  of cross-chain messages, ensuring that only valid messages are delivered and executed. By configuring 
                  multiple DVNs, you can enhance security and protect against malicious attacks.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-medium text-gray-200">Security Score</h3>
              <div className="text-xs text-gray-400">
                {securityScore < 40 ? "Low" : securityScore < 70 ? "Medium" : "High"} Security
              </div>
            </div>
            
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  securityScore < 40 ? 'bg-red-500' :
                  securityScore < 70 ? 'bg-amber-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${securityScore}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className={`p-3 rounded-lg text-center border ${securityScore < 40 ? 'bg-red-900/20 border-red-900/30 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                <div className="text-xs uppercase mb-1">Low</div>
                <div className="text-sm">Lower Cost</div>
              </div>
              <div className={`p-3 rounded-lg text-center border ${securityScore >= 40 && securityScore < 70 ? 'bg-amber-900/20 border-amber-900/30 text-amber-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                <div className="text-xs uppercase mb-1">Medium</div>
                <div className="text-sm">Balanced</div>
              </div>
              <div className={`p-3 rounded-lg text-center border ${securityScore >= 70 ? 'bg-green-900/20 border-green-900/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                <div className="text-xs uppercase mb-1">High</div>
                <div className="text-sm">Max Security</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Message Security Level</h3>
            <p className="text-xs text-gray-400">
              {getSecurityLevelDescription()}
            </p>
            <Slider
              value={[securityLevel]}
              max={4}
              min={1}
              step={1}
              onValueChange={(val) => setSecurityLevel(val[0])}
              className="my-6"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Basic</span>
              <span>Standard</span>
              <span>Advanced</span>
              <span>Maximum</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-200 mb-2">DVN Selection</h3>
            
            <div className="space-y-3">
              {DVN_PROVIDERS.map(dvn => (
                <div 
                  key={dvn.id}
                  className={`p-4 rounded-lg border ${
                    selectedDvns.includes(dvn.id) 
                      ? 'border-blue-900/30 bg-blue-900/10' 
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${dvn.logoColor}30` }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dvn.logoColor}>
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{dvn.name}</div>
                        <div className="text-xs text-gray-400">{dvn.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-right">
                        <div className="text-gray-400">Fee per message</div>
                        <div className="text-gray-200 font-medium">{dvn.fee} ETH</div>
                      </div>
                      <Switch
                        checked={selectedDvns.includes(dvn.id)}
                        onCheckedChange={() => toggleDvn(dvn.id)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-gray-200 mb-2">Advanced Security Features</h3>
            
            <div className="space-y-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="trusted-endpoints" className="text-gray-200">Trusted Endpoint Mode</Label>
                  <p className="text-xs text-gray-400 mt-1">Restrict message handling to verified endpoint addresses only</p>
                </div>
                <Switch 
                  id="trusted-endpoints"
                  checked={trustedEndpoints} 
                  onCheckedChange={setTrustedEndpoints}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <div>
                  <Label htmlFor="multi-sig" className="text-gray-200">Multi-Signature Verification</Label>
                  <p className="text-xs text-gray-400 mt-1">Require multiple validator signatures for message confirmation</p>
                </div>
                <Switch 
                  id="multi-sig"
                  checked={multiSignatureVerification} 
                  onCheckedChange={setMultiSignatureVerification}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </div>
          
          {isConfiguring && (
            <div className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between text-sm text-gray-300">
                <span>DVN Configuration Progress</span>
                <span>{configProgress}%</span>
              </div>
              <Progress value={configProgress} className="h-2 bg-gray-700" />
              
              <div className="mt-2 text-center">
                {configProgress < 30 && (
                  <div className="text-xs text-gray-400">Initializing configuration...</div>
                )}
                {configProgress >= 30 && configProgress < 60 && (
                  <div className="text-xs text-gray-400">Updating LayerZero endpoint parameters...</div>
                )}
                {configProgress >= 60 && configProgress < 90 && (
                  <div className="text-xs text-gray-400">Configuring DVN verification settings...</div>
                )}
                {configProgress >= 90 && (
                  <div className="text-xs text-green-400">Configuration successfully applied!</div>
                )}
              </div>
              
              <div className="relative h-10 mt-2">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-700 w-full"></div>
                
                {configProgress >= 30 && (
                  <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full ${configProgress >= 30 ? 'bg-green-500 dvn-verify' : 'bg-gray-600'} flex items-center justify-center`}>
                    {configProgress >= 30 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white">
                        <path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                
                {configProgress >= 60 && (
                  <div className={`absolute left-1/3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full ${configProgress >= 60 ? 'bg-green-500 dvn-verify' : 'bg-gray-600'} flex items-center justify-center`}>
                    {configProgress >= 60 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white">
                        <path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                
                {configProgress >= 90 && (
                  <div className={`absolute left-2/3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full ${configProgress >= 90 ? 'bg-green-500 dvn-verify' : 'bg-gray-600'} flex items-center justify-center`}>
                    {configProgress >= 90 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white">
                        <path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                
                {configProgress === 100 && (
                  <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full ${configProgress === 100 ? 'bg-green-500 dvn-verify' : 'bg-gray-600'} flex items-center justify-center`}>
                    {configProgress === 100 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white">
                        <path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
          <div className="text-sm">
            <span className="text-gray-400">Est. cost per message: </span>
            <span className="font-medium text-gray-200">{calculateEstimatedFee()} ETH</span>
          </div>
          
          <Button 
            onClick={updateConfiguration}
            disabled={isConfiguring}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConfiguring ? 'Configuring...' : 'Apply Security Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}