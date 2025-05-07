import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ChainSelector from "./ChainSelector";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "./WalletProvider";
import { useNetworkData } from "@/hooks/useNetworkData";
import { useLayerZeroTransaction } from "@/hooks/useLayerZeroTransaction";
import { Network } from "@/types/network";
import { Spinner } from "@/components/ui/spinner";
import TransactionConfirmationModal from './TransactionConfirmationModal';
import { TransactionStatus } from '@/types/transaction';
import TransactionErrorHandler from './TransactionErrorHandler';
import { ErrorType } from '@/types/error';
import contractService from '@/services/contractService';

interface EnhancedTokenActionsProps {
  openWalletModal: () => void;
}

// Form validation schema for token transfer
const transferSchema = z.object({
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Amount must be a positive number" }
  ),
  recipientAddress: z
    .string()
    .min(1, { message: "Recipient address is required" })
    .refine(
      (val) => val.startsWith("0x") && val.length === 42,
      { message: "Invalid Ethereum address" }
    ),
});

type TransferFormValues = z.infer<typeof transferSchema>;

// Form validation schema for bridging
const bridgeSchema = z.object({
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Amount must be a positive number" }
  ),
});

type BridgeFormValues = z.infer<typeof bridgeSchema>;

export default function EnhancedTokenActions({ openWalletModal }: EnhancedTokenActionsProps) {
  const { toast } = useToast();
  const { isConnected, address, chainId } = useWalletContext();
  // Mock values for balance and currentNetwork - in a real app these would come from a proper hook
  const balance = 100; // Mock balance value
  const currentNetwork = { id: chainId?.toString() || "1", name: "Ethereum" };
  const { networks } = useNetworkData();
  const [sourceBridgeNetwork, setSourceBridgeNetwork] = useState<Network | null>(null);
  const [targetBridgeNetwork, setTargetBridgeNetwork] = useState<Network | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('pending');
  const [transactionHash, setTransactionHash] = useState<string | undefined>(undefined);
  const [estimatedFee, setEstimatedFee] = useState<string | undefined>(undefined);
  
  const {
    createTransaction,
    transaction,
    transactionError: error,
    resetTransaction,
    retryTransaction
  } = useLayerZeroTransaction({
    onSuccess: (tx) => {
      setTransactionHash(tx.sourceTxHash);
      setTransactionStatus('source_confirmed');
    },
    onError: () => {
      setTransactionStatus('failed');
    }
  });

  // Initialize react-hook-form for transfer
  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: "",
      recipientAddress: "",
    },
  });

  // Initialize react-hook-form for bridge
  const bridgeForm = useForm<BridgeFormValues>({
    resolver: zodResolver(bridgeSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Handler for token transfer submission
  const onTransferSubmit = async (data: TransferFormValues) => {
    if (!isConnected) {
      openWalletModal();
      return;
    }

    try {
      // Simulate a transfer transaction 
      const txResponse = await contractService.transferToken(data.recipientAddress, data.amount);
      
      // Create a transaction in our system
      createTransaction({
        type: "token_bridge",
        sourceChain: currentNetwork?.id || "",
        sourceTxHash: txResponse.hash,
        status: "pending"
      });

      // Show confirmation modal
      setTransactionStatus('pending');
      setTransactionHash(txResponse.hash);
      setIsModalOpen(true);
      
      // Reset form
      transferForm.reset();
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handler for token bridge submission
  const onBridgeSubmit = async (data: BridgeFormValues) => {
    if (!isConnected) {
      openWalletModal();
      return;
    }

    if (!sourceBridgeNetwork || !targetBridgeNetwork) {
      toast({
        title: "Network Selection Required",
        description: "Please select source and destination networks",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate the estimated fee (simulate the backend fee estimation)
      const baseFeeLz = 0.001; // ETH
      let calculatedFee;
      
      if (sourceBridgeNetwork.isHub && !targetBridgeNetwork.isHub) {
        // Hub to satellite is cheaper
        calculatedFee = baseFeeLz * Number(data.amount) * 0.0001;
      } else if (!sourceBridgeNetwork.isHub && targetBridgeNetwork.isHub) {
        // Satellite to hub has standard fee
        calculatedFee = baseFeeLz * Number(data.amount) * 0.0002;
      } else {
        // Satellite to satellite has higher fee (would use lzCompose)
        calculatedFee = baseFeeLz * Number(data.amount) * 0.0003;
      }
      
      setEstimatedFee(calculatedFee.toFixed(6));

      // Simulate a bridge transaction
      const txResponse = await contractService.bridgeToken(
        sourceBridgeNetwork.id,
        targetBridgeNetwork.id,
        data.amount
      );
      
      // Create a transaction in our system
      createTransaction({
        type: "token_bridge",
        sourceChain: sourceBridgeNetwork.id,
        destinationChain: targetBridgeNetwork.id,
        sourceTxHash: txResponse.hash,
        status: "pending"
      });
      
      // Show confirmation modal
      setTransactionStatus('pending');
      setTransactionHash(txResponse.hash);
      setIsModalOpen(true);
      
      // Reset form
      bridgeForm.reset();
    } catch (error: any) {
      toast({
        title: "Bridge Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Token Management</CardTitle>
          <CardDescription>Transfer tokens between accounts or across chains</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transfer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="bridge">Bridge</TabsTrigger>
            </TabsList>
            
            {!isConnected && (
              <div className="mt-4">
                <TransactionErrorHandler 
                  error={new Error("Wallet not connected")} 
                  errorType={ErrorType.NETWORK_ERROR}
                  networkName="Wallet"
                  onClear={resetTransaction}
                />
              </div>
            )}
            
            {error && (
              <div className="mt-4">
                <TransactionErrorHandler 
                  error={error} 
                  transactionId={transaction?.id}
                  errorType={ErrorType.EXECUTION_ERROR}
                  onRetry={() => transaction?.id && retryTransaction(transaction.id)}
                  onClear={resetTransaction}
                />
              </div>
            )}
            
            <TabsContent value="transfer">
              <div className="space-y-4 pt-4">
                <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-6">
                    <FormField
                      control={transferForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="flex space-x-2">
                              <Input placeholder="0.0" {...field} />
                              <Button type="button" variant="outline" onClick={() => transferForm.setValue('amount', balance.toString())}>
                                Max
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Available: {balance ? balance.toFixed(6) : '0'} GOVN
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={transferForm.control}
                      name="recipientAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Address</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} />
                          </FormControl>
                          <FormDescription>
                            The wallet address of the recipient
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={!isConnected || transferForm.formState.isSubmitting}
                      className="w-full"
                    >
                      {transferForm.formState.isSubmitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" /> Processing...
                        </>
                      ) : (
                        "Transfer Tokens"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
            
            <TabsContent value="bridge">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>From Chain</Label>
                    <ChainSelector 
                      onChainChange={(network) => setSourceBridgeNetwork(network as Network)} 
                      showHubIndicator
                    />
                  </div>
                  <div>
                    <Label>To Chain</Label>
                    <ChainSelector 
                      onChainChange={(network) => setTargetBridgeNetwork(network as Network)} 
                      showHubIndicator
                    />
                  </div>
                </div>
                
                <Form {...bridgeForm}>
                  <form onSubmit={bridgeForm.handleSubmit(onBridgeSubmit)} className="space-y-6">
                    <FormField
                      control={bridgeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="flex space-x-2">
                              <Input placeholder="0.0" {...field} />
                              <Button type="button" variant="outline" onClick={() => bridgeForm.setValue('amount', balance.toString())}>
                                Max
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Available: {balance ? balance.toFixed(6) : '0'} GOVN
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={
                        !isConnected || 
                        bridgeForm.formState.isSubmitting ||
                        !sourceBridgeNetwork ||
                        !targetBridgeNetwork ||
                        sourceBridgeNetwork.id === targetBridgeNetwork.id
                      }
                      className="w-full"
                    >
                      {bridgeForm.formState.isSubmitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" /> Processing...
                        </>
                      ) : (
                        "Bridge Tokens"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between flex-col sm:flex-row space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Powered by <span className="font-semibold">LayerZero</span> Omnichain Technology
          </div>
          {!isConnected && (
            <Button variant="outline" onClick={openWalletModal}>
              Connect Wallet
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Transaction in Progress"
        description="Your transaction is being processed across chains"
        sourceChain={sourceBridgeNetwork?.name || currentNetwork?.name || "Unknown"}
        destinationChain={targetBridgeNetwork?.name}
        sourceTxHash={transactionHash}
        status={transactionStatus}
        error={error}
        onRetry={() => transaction?.id && retryTransaction(transaction.id)}
      />
    </>
  );
}