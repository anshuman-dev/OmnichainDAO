import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGovernance } from "@/hooks/useGovernance";
import { useWallet } from "@/hooks/useWallet";

// Form schema for proposal creation
const proposalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  targetAddress: z.string().refine(val => /^0x[a-fA-F0-9]{40}$/.test(val), {
    message: "Invalid Ethereum address format"
  }),
  value: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Value must be a non-negative number"
  }),
  calldata: z.string().default("0x")
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

export default function ProposalForm() {
  const { toast } = useToast();
  const { proposeAction, loading, error } = useGovernance();
  const { isConnected, openWalletModal } = useWallet();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Initialize form with default values
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAddress: "",
      value: "0",
      calldata: "0x"
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
      
      const proposalId = await proposeAction(targets, values, calldatas, description);
      
      if (proposalId) {
        form.reset();
        toast({
          title: "Proposal Created",
          description: `Your proposal has been created with ID: ${proposalId}`
        });
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
    <Card>
      <CardHeader>
        <CardTitle>Create Governance Proposal</CardTitle>
        <CardDescription>
          Submit a new proposal for the OmniGovern DAO to vote on
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      <Input 
                        placeholder="0x..." 
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
                {loading ? "Creating..." : "Create Proposal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}