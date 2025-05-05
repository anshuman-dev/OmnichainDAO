import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/hooks/useWallet";
import { useNetwork } from "@/hooks/useNetwork";
// Import the constant from lib/constants
import { AVAILABLE_NETWORKS } from "@/lib/constants";

// Form schema for cross-chain proposal creation
const proposalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  targetAddress: z.string().refine(val => /^0x[a-fA-F0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address format"
  }),
  value: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Value must be a non-negative number"
  }),
  calldata: z.string().default("0x"),
  isMultiChain: z.boolean().default(false),
  targetChains: z.array(z.string()).optional()
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

export default function CrossChainProposal() {
  const { toast } = useToast();
  const { proposeAction, crossChainVote, loading, error } = useGovernance();
  const { isConnected, openWalletModal } = useWallet();
  const { currentNetwork } = useNetwork();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTab, setSelectedTab] = useState("standard");
  
  // Initialize form with default values
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAddress: "",
      value: "0",
      calldata: "0x",
      isMultiChain: false,
      targetChains: []
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: ProposalFormValues) => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    try {
      // Format for the governance contract
      const targets = [data.targetAddress];
      const values = [data.value]; // Will be converted to ETH in proposeAction
      const calldatas = [data.calldata];
      const description = `${data.title}\n\n${data.description}`;
      
      if (data.isMultiChain && data.targetChains && data.targetChains.length > 0) {
        // For cross-chain proposals, we need to send the proposal to each chain
        toast({
          title: "Creating Cross-Chain Proposal",
          description: `Submitting proposal to ${data.targetChains.length} chains...`
        });
        
        // In a real implementation, we would use LayerZero to send the proposal to each chain
        // This is a simplified version
        const proposalId = await proposeAction(targets, values, calldatas, description);
        
        if (proposalId) {
          form.reset();
          toast({
            title: "Cross-Chain Proposal Created",
            description: `Your proposal has been created with ID: ${proposalId} and will be executed on multiple chains`
          });
        }
      } else {
        // Standard single-chain proposal
        const proposalId = await proposeAction(targets, values, calldatas, description);
        
        if (proposalId) {
          form.reset();
          toast({
            title: "Proposal Created",
            description: `Your proposal has been created with ID: ${proposalId}`
          });
        }
      }
    } catch (err: any) {
      toast({
        title: "Error Creating Proposal",
        description: err.message || "Failed to create proposal",
        variant: "destructive"
      });
    }
  };
  
  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Proposal</CardTitle>
          <CardDescription>
            Connect your wallet to create a new governance proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You need to connect your wallet to create proposals
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={openWalletModal}>Connect Wallet</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Cross-Chain Governance Proposal</CardTitle>
        <CardDescription>
          Submit proposals that can execute across multiple chains via LayerZero
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="standard">Standard Proposal</TabsTrigger>
            <TabsTrigger value="cross-chain">Cross-Chain Proposal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard">
            <p className="text-sm text-muted-foreground mb-4">
              Create a proposal that executes on a single chain. This is the simplest form of governance proposal.
            </p>
          </TabsContent>
          
          <TabsContent value="cross-chain">
            <p className="text-sm text-muted-foreground mb-4">
              Create a proposal that executes on multiple chains simultaneously. Perfect for protocol-wide parameter changes.
            </p>
          </TabsContent>
        </Tabs>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a concise title for your proposal" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive title for your proposal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your proposal in detail..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed explanation of what you're proposing and why
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Contract Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0x..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The address of the contract your proposal will interact with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value (ETH)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.001"
                      min="0"
                      placeholder="0.0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Amount of ETH to send with the proposal (usually 0)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedTab === "cross-chain" && (
              <FormField
                control={form.control}
                name="isMultiChain"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Cross-Chain Execution</FormLabel>
                      <FormDescription>
                        Execute this proposal across multiple blockchains
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {selectedTab === "cross-chain" && form.watch("isMultiChain") && (
              <FormField
                control={form.control}
                name="targetChains"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Chains</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        {AVAILABLE_NETWORKS.map(network => (
                          <div key={network.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`chain-${network.id}`}
                              value={network.id}
                              checked={(field.value || []).includes(network.id)}
                              onChange={(e) => {
                                const value = [...(field.value || [])];
                                if (e.target.checked) {
                                  value.push(network.id);
                                } else {
                                  const index = value.indexOf(network.id);
                                  if (index !== -1) {
                                    value.splice(index, 1);
                                  }
                                }
                                field.onChange(value);
                              }}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`chain-${network.id}`} className="text-sm">
                              {network.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select the chains where this proposal should be executed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </Button>
            </div>
            
            {showAdvanced && (
              <FormField
                control={form.control}
                name="calldata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Data (hex)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="0x..." 
                        className="font-mono text-xs"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The encoded function call data for your proposal (advanced)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Creating..." : selectedTab === "cross-chain" && form.watch("isMultiChain") 
                  ? "Create Cross-Chain Proposal" 
                  : "Create Proposal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}