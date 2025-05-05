import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { LucideAlertTriangle, LucideCheckCircle, LucideSettings, LucideShieldCheck, LucideWifi } from 'lucide-react';

const DVN_OPTIONS = [
  {
    id: 'default',
    name: 'LayerZero Default DVN',
    description: 'The standard Data Verification Network provided by LayerZero.',
    recommended: true
  },
  {
    id: 'ultra',
    name: 'Ultra Secure DVN',
    description: 'Enhanced security with additional verification requirements and multiple oracles.',
    recommended: false
  },
  {
    id: 'lite',
    name: 'Lite DVN',
    description: 'Optimized for speed with minimal verification overhead.',
    recommended: false
  }
];

export default function LayerZeroDVNConfig() {
  const { currentNetwork } = useNetwork();
  const { toast } = useToast();
  
  // State for DVN configuration
  const [securityLevel, setSecurityLevel] = useState(2); // 1-4
  const [selectedDVNs, setSelectedDVNs] = useState<string[]>(['default']);
  const [trustedEndpointMode, setTrustedEndpointMode] = useState(false);
  const [multiSignatureVerification, setMultiSignatureVerification] = useState(false);
  const [securityScore, setSecurityScore] = useState(65);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Handle DVN selection change
  const handleDVNChange = (dvnId: string, checked: boolean) => {
    if (checked) {
      setSelectedDVNs([...selectedDVNs, dvnId]);
    } else {
      setSelectedDVNs(selectedDVNs.filter(id => id !== dvnId));
    }
  };
  
  // Apply security configuration
  const applyConfiguration = () => {
    setIsConfiguring(true);
    
    // Calculate new security score based on settings
    let score = 0;
    
    // Base score from security level
    score += securityLevel * 15;
    
    // Score from DVNs
    if (selectedDVNs.includes('default')) score += 25;
    if (selectedDVNs.includes('ultra')) score += 35;
    if (selectedDVNs.includes('lite')) score += 15;
    
    // Additional features
    if (trustedEndpointMode) score += 15;
    if (multiSignatureVerification) score += 20;
    
    // Cap at 100
    score = Math.min(score, 100);
    
    // Simulate API call to update configuration
    setTimeout(() => {
      setSecurityScore(score);
      setIsConfiguring(false);
      
      toast({
        title: "Security Configuration Updated",
        description: `DVN settings applied with a security score of ${score}/100.`,
        duration: 5000,
      });
    }, 2000);
  };
  
  // Get security level text based on score
  const getSecurityLevelText = (score: number) => {
    if (score >= 80) return { text: "Very High", color: "text-green-500" };
    if (score >= 60) return { text: "High", color: "text-green-400" };
    if (score >= 40) return { text: "Medium", color: "text-yellow-500" };
    return { text: "Low", color: "text-red-500" };
  };
  
  // Get progress bar color based on score
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-green-400";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Security Settings */}
      <div className="md:col-span-2 space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <LucideShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle>DVN Security Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure Data Verification Networks to enhance the security of cross-chain messages for {currentNetwork?.name || 'your network'}.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-0 space-y-6">
            {/* Security Level Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="security-level">Security Level</Label>
                <span className="text-sm">{securityLevel}/4</span>
              </div>
              <Slider 
                id="security-level"
                value={[securityLevel]} 
                min={1} 
                max={4} 
                step={1}
                onValueChange={(value) => setSecurityLevel(value[0])}
              />
              <div className="grid grid-cols-4 text-xs text-muted-foreground">
                <div>Basic</div>
                <div className="text-center">Standard</div>
                <div className="text-center">Enhanced</div>
                <div className="text-right">Maximum</div>
              </div>
            </div>
            
            {/* DVN Selection */}
            <div className="space-y-4">
              <Label>Select Data Verification Networks</Label>
              
              <div className="space-y-3">
                {DVN_OPTIONS.map((dvn) => (
                  <div key={dvn.id} className="flex items-start space-x-3 border p-3 rounded-md">
                    <Checkbox 
                      id={`dvn-${dvn.id}`}
                      checked={selectedDVNs.includes(dvn.id)}
                      onCheckedChange={(checked) => handleDVNChange(dvn.id, checked === true)}
                      className="mt-1"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor={`dvn-${dvn.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {dvn.name}
                        </Label>
                        {dvn.recommended && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dvn.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Additional Security Features */}
            <div className="space-y-4">
              <Label>Additional Security Features</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border p-3 rounded-md">
                  <div className="space-y-1">
                    <Label htmlFor="trusted-endpoint" className="font-medium cursor-pointer">
                      Trusted Endpoint Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Only allow messages from verified LayerZero endpoints.
                    </p>
                  </div>
                  <Switch 
                    id="trusted-endpoint"
                    checked={trustedEndpointMode}
                    onCheckedChange={setTrustedEndpointMode}
                  />
                </div>
                
                <div className="flex items-center justify-between border p-3 rounded-md">
                  <div className="space-y-1">
                    <Label htmlFor="multi-signature" className="font-medium cursor-pointer">
                      Multi-Signature Verification
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require multiple signatures for message validation.
                    </p>
                  </div>
                  <Switch 
                    id="multi-signature"
                    checked={multiSignatureVerification}
                    onCheckedChange={setMultiSignatureVerification}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-6">
            <Button 
              onClick={applyConfiguration} 
              disabled={isConfiguring || selectedDVNs.length === 0}
              className="w-full"
            >
              {isConfiguring ? "Applying Configuration..." : "Apply Security Configuration"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right Column - Security Status */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <LucideWifi className="w-5 h-5 text-primary" />
              <CardTitle>Network Security</CardTitle>
            </div>
            <CardDescription>
              Current security configuration for {currentNetwork?.name || 'your network'}.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Security Score */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Security Score</Label>
                <span className={`font-medium ${getSecurityLevelText(securityScore).color}`}>
                  {getSecurityLevelText(securityScore).text}
                </span>
              </div>
              <Progress value={securityScore} className={getProgressColor(securityScore)} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
            
            {/* Active DVNs */}
            <div className="space-y-2">
              <Label>Active DVNs</Label>
              <div className="space-y-2 mt-1">
                {selectedDVNs.length > 0 ? (
                  selectedDVNs.map(id => {
                    const dvn = DVN_OPTIONS.find(d => d.id === id);
                    return (
                      <div key={id} className="flex items-center gap-2 text-sm">
                        <LucideCheckCircle className="w-4 h-4 text-green-500" />
                        <span>{dvn?.name || id}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LucideAlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>No DVNs selected</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Security Features */}
            <div className="space-y-2">
              <Label>Security Features</Label>
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className={trustedEndpointMode ? "text-green-500" : "text-muted-foreground"}>
                    <LucideCheckCircle className="w-4 h-4" />
                  </div>
                  <span className={trustedEndpointMode ? "" : "text-muted-foreground"}>
                    Trusted Endpoint Mode
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={multiSignatureVerification ? "text-green-500" : "text-muted-foreground"}>
                    <LucideCheckCircle className="w-4 h-4" />
                  </div>
                  <span className={multiSignatureVerification ? "" : "text-muted-foreground"}>
                    Multi-Signature Verification
                  </span>
                </div>
              </div>
            </div>
            
            {/* Security Level */}
            <div className="space-y-2">
              <Label>Security Level</Label>
              <RadioGroup value={securityLevel.toString()} className="flex gap-4 pt-1">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} className="flex items-center gap-1.5">
                    <RadioGroupItem 
                      id={`level-${level}`} 
                      value={level.toString()} 
                      disabled
                      className={level <= securityLevel ? "border-primary" : ""}
                    />
                    <Label htmlFor={`level-${level}`} className="text-sm cursor-pointer">
                      {level}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <LucideSettings className="w-5 h-5 text-primary" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setSecurityLevel(4);
                setSelectedDVNs(['default', 'ultra']);
                setTrustedEndpointMode(true);
                setMultiSignatureVerification(true);
              }}
            >
              Apply Maximum Security
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setSecurityLevel(2);
                setSelectedDVNs(['default']);
                setTrustedEndpointMode(false);
                setMultiSignatureVerification(false);
              }}
            >
              Apply Standard Security
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setSecurityLevel(1);
                setSelectedDVNs(['lite']);
                setTrustedEndpointMode(false);
                setMultiSignatureVerification(false);
              }}
            >
              Apply Light Security (Fastest)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}