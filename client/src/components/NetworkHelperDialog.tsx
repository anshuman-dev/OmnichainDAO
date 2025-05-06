import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AVAILABLE_NETWORKS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Network } from "@/types/token";

interface NetworkHelperDialogProps {
  children?: React.ReactNode;
  triggerLabel?: string;
}

export default function NetworkHelperDialog({ 
  children, 
  triggerLabel = "Add Networks" 
}: NetworkHelperDialogProps) {
  const { toast } = useToast();
  
  // Function to add network to MetaMask
  const addNetworkToWallet = async (network: Network) => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another compatible wallet to add networks.",
          variant: "destructive",
        });
        return;
      }
      
      // Add the network to wallet
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${network.chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: {
              name: network.id === 'sepolia' ? 'Sepolia Ether' : 'Amoy MATIC',
              symbol: network.id === 'sepolia' ? 'ETH' : 'MATIC',
              decimals: 18,
            },
            rpcUrls: [
              network.id === 'sepolia' 
                ? 'https://rpc.sepolia.org' 
                : 'https://rpc-amoy.polygon.technology'
            ],
            blockExplorerUrls: [
              network.id === 'sepolia'
                ? 'https://sepolia.etherscan.io/'
                : 'https://www.oklink.com/amoy'
            ],
          },
        ],
      });
      
      toast({
        title: "Network Added",
        description: `${network.name} has been added to your wallet.`,
      });
      
    } catch (error: any) {
      console.error('Error adding network to wallet:', error);
      toast({
        title: "Failed to Add Network",
        description: error.message || "Failed to add network to wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to switch network
  const switchNetwork = async (network: Network) => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another compatible wallet to switch networks.",
          variant: "destructive",
        });
        return;
      }
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
      
      toast({
        title: "Network Switched",
        description: `You are now connected to ${network.name}.`,
      });
      
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        // Chain not added, so we add it then try to switch again
        await addNetworkToWallet(network);
        switchNetwork(network);
      } else {
        console.error('Error switching network:', error);
        toast({
          title: "Failed to Switch Network",
          description: error.message || "Failed to switch network. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button variant="outline">{triggerLabel}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>TestNet Networks</DialogTitle>
          <DialogDescription>
            Add the required testnet networks to your wallet to use the OmniGovern DAO.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <h3 className="text-sm font-medium mb-2">Available Networks:</h3>
          
          {AVAILABLE_NETWORKS.map((network) => (
            <div key={network.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: network.color }}
                />
                <span className="font-medium">{network.name}</span>
                {network.isHub && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Hub
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => addNetworkToWallet(network)}
                >
                  Add
                </Button>
                <Button 
                  size="sm"
                  onClick={() => switchNetwork(network)}
                >
                  Switch
                </Button>
              </div>
            </div>
          ))}
          
          <div className="bg-muted/50 p-3 rounded-md mt-2">
            <h4 className="text-sm font-medium mb-2">Need Test Tokens?</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Get testnet tokens from these faucets:
            </p>
            <ul className="text-xs space-y-1">
              <li>
                <a 
                  href="https://sepoliafaucet.com/" 
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Sepolia ETH Faucet
                </a>
              </li>
              <li>
                <a 
                  href="https://faucet.polygon.technology/" 
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Polygon Amoy Faucet
                </a>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}