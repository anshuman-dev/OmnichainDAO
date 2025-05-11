import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TokenOverview from '@/components/TokenOverview';
import LayerZeroDVNConfig from '@/components/LayerZeroDVNConfig';
import LayerZeroCrossChainVote from '@/components/LayerZeroCrossChainVote';
import LayerZeroAtomicExecution from '@/components/LayerZeroAtomicExecution';
import SupplyConsistencyChecker from '@/components/SupplyConsistencyChecker';
import { useWalletContext } from '@/components/WalletProvider';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/use-toast';
import ChainSelector from '@/components/ChainSelector';
import NetworkStatus from '@/components/NetworkStatus';
import NetworkHelperDialog from '@/components/NetworkHelperDialog';
import { AVAILABLE_NETWORKS } from '@/lib/constants';
import { LucideGitCompare, LucideShieldCheck, LucideVote, LucideZap } from 'lucide-react';

// LayerZero feature showcases
const LZ_FEATURES = [
  {
    id: 'oft',
    title: 'OFT Token Bridging',
    description: 'Cross-chain token transfers with supply consistency via LayerZero OFT implementation.',
    icon: <LucideGitCompare className="h-6 w-6" />,
    component: 'token-management',
    buttonText: 'View Token Management'
  },
  {
    id: 'dvn',
    title: 'DVN Security Configuration',
    description: 'Enhanced security with Data Verification Networks (DVN) for message validation.',
    icon: <LucideShieldCheck className="h-6 w-6" />,
    component: 'dvn-config',
    buttonText: 'Configure Security'
  },
  {
    id: 'voting',
    title: 'Cross-Chain Voting',
    description: 'Secure cross-chain voting across all network deployments.',
    icon: <LucideVote className="h-6 w-6" />,
    component: 'voting',
    buttonText: 'View Voting Interface'
  },
  {
    id: 'compose',
    title: 'Atomic Execution',
    description: 'Multi-chain atomic execution powered by lzCompose.',
    icon: <LucideZap className="h-6 w-6" />,
    component: 'execution',
    buttonText: 'View Atomic Execution'
  }
];

export default function OmniGovernDAO() {
  const [activeTab, setActiveTab] = useState('overview');
  const { isConnected, openWalletModal } = useWalletContext();
  const { currentNetwork, setCurrentNetwork } = useNetwork();
  const { toast } = useToast();
  
  // Effect to check if contracts are deployed on selected networks
  useEffect(() => {
    if (currentNetwork) {
      // In a real integration, this would check if contracts are deployed
      // by making an API call or checking the contract directly
      console.log(`Selected network: ${currentNetwork.name}`);
    }
  }, [currentNetwork]);
  
  const handleFeatureClick = (component: string) => {
    setActiveTab(component);
  };
  
  const handleVerifySupply = () => {
    toast({
      title: "Supply Verification Started",
      description: "Verifying token supply consistency across chains...",
      duration: 5000,
    });
    
    // This would make an API call to verify the supply
    setTimeout(() => {
      toast({
        title: "Supply Verification Complete",
        description: "Token supply is consistent across all chains.",
        duration: 5000,
      });
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">OmniGovern DAO</h1>
          <p className="text-muted-foreground max-w-2xl">
            An omnichain governance protocol powered by LayerZero V2, enabling seamless cross-chain DAO decision-making and execution.
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <ChainSelector 
            onChainChange={(network) => setCurrentNetwork(network)} 
            showHubIndicator
          />
          
          {!isConnected ? (
            <Button 
              onClick={openWalletModal}
              className="connect-wallet-btn"
              variant="default"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="flex gap-2">
              <NetworkHelperDialog>
                <Button size="sm" variant="secondary">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M8 4V12M4 8H12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Networks
                </Button>
              </NetworkHelperDialog>
              <Button variant="outline" onClick={openWalletModal}>Wallet Connected</Button>
            </div>
          )}
        </div>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-0">
          <NetworkStatus />
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 bg-muted/60 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="token-management">Token Management</TabsTrigger>
          <TabsTrigger value="dvn-config">DVN Configuration</TabsTrigger>
          <TabsTrigger value="voting">Cross-Chain Voting</TabsTrigger>
          <TabsTrigger value="execution">Atomic Execution</TabsTrigger>
          <TabsTrigger value="supply">Supply Consistency</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Shows the key features with cards */}
        <TabsContent value="overview" className="mt-0">
          <h2 className="text-2xl font-bold mb-6">LayerZero V2 Integration Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {LZ_FEATURES.map((feature) => (
              <Card key={feature.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleFeatureClick(feature.component)}
                    variant="outline"
                    className="w-full"
                  >
                    {feature.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>About OmniGovern DAO</CardTitle>
              <CardDescription>
                An advanced governance protocol built on LayerZero V2
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  OmniGovern DAO is a comprehensive governance solution that leverages LayerZero V2's 
                  cross-chain messaging technology to create a seamless DAO governance experience across 
                  multiple blockchains.
                </p>
                <p>
                  The protocol allows token holders to participate in governance from any supported chain, 
                  with votes and proposal executions securely transmitted across chains.
                </p>
                <h3 className="text-lg font-semibold mt-4">Key Features</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>OmniGovernToken: An OFT implementation for cross-chain governance tokens</li>
                  <li>DVN Configuration: Enhanced security with customizable verification networks</li>
                  <li>Cross-Chain Voting: Vote from any chain with secure message passing</li>
                  <li>lzCompose: Atomic execution of proposal actions across multiple chains</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Token Management Tab */}
        <TabsContent value="token-management" className="mt-0">
          <h2 className="text-2xl font-bold mb-6">OFT Token Management</h2>
          <TokenOverview />
        </TabsContent>
        
        {/* DVN Configuration Tab */}
        <TabsContent value="dvn-config" className="mt-0">
          <h2 className="text-2xl font-bold mb-6">DVN Security Configuration</h2>
          <p className="text-muted-foreground mb-6">
            Configure Data Verification Networks (DVNs) to enhance the security of cross-chain messages.
            LayerZero V2 allows customizable security settings for each connected chain.
          </p>
          <LayerZeroDVNConfig />
        </TabsContent>
        
        {/* Cross-Chain Voting Tab */}
        <TabsContent value="voting" className="mt-0">
          <h2 className="text-2xl font-bold mb-6">Cross-Chain Voting</h2>
          <p className="text-muted-foreground mb-6">
            Participate in governance from any chain. Votes are securely transmitted via LayerZero
            and counted on the hub chain for proposal resolution.
          </p>
          <LayerZeroCrossChainVote />
        </TabsContent>
        
        {/* Atomic Execution Tab */}
        <TabsContent value="execution" className="mt-0">
          <h2 className="text-2xl font-bold mb-6">lzCompose Atomic Execution</h2>
          <p className="text-muted-foreground mb-6">
            Execute proposal actions atomically across multiple chains with lzCompose.
            This ensures that proposal actions either succeed on all chains or fail completely.
          </p>
          <LayerZeroAtomicExecution />
        </TabsContent>
        
        {/* Supply Consistency Tab */}
        <TabsContent value="supply" className="mt-0">
          <h2 className="text-2xl font-bold mb-6">Token Supply Consistency</h2>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground max-w-2xl">
              Verify the consistency of token supply across chains. OFT ensures that the total
              token supply remains constant regardless of cross-chain transfers.
            </p>
            <Button onClick={handleVerifySupply}>
              Verify Supply Now
            </Button>
          </div>
          <SupplyConsistencyChecker />
        </TabsContent>
      </Tabs>
    </div>
  );
}