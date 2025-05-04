import { useState, useEffect } from "react";
import { useToken } from "@/hooks/useToken";
import { useNetwork } from "@/hooks/useNetwork";
import { useWallet } from "@/hooks/useWallet";
import ContractDetails from "@/components/ContractDetails";

interface TokenActionsProps {
  openWalletModal: () => void;
}

export default function TokenActions({ openWalletModal }: TokenActionsProps) {
  const { userBalance, bridgeTokens, calculateBridgeFees, isLoading: tokenLoading } = useToken();
  const { networks, currentNetwork, setCurrentNetwork } = useNetwork();
  const { isConnected } = useWallet();
  
  const [amount, setAmount] = useState("");
  const [destinationChain, setDestinationChain] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [calculatingFees, setCalculatingFees] = useState(false);
  const [fees, setFees] = useState({
    layerZeroFee: 0.15,
    bridgeFee: 0,
    gasFee: 1.25,
    totalCost: 1.40
  });
  
  // Set default destination chain when current network changes
  useEffect(() => {
    if (networks.length > 0 && currentNetwork) {
      const otherNetworks = networks.filter(n => n.id !== currentNetwork.id);
      if (otherNetworks.length > 0) {
        setDestinationChain(otherNetworks[0].id);
      }
    }
  }, [currentNetwork, networks]);
  
  // Update fees when amount or destination chain changes
  useEffect(() => {
    if (amount && destinationChain) {
      setCalculatingFees(true);
      try {
        const calculatedFees = calculateBridgeFees(parseFloat(amount), destinationChain);
        setFees(calculatedFees);
      } catch (error) {
        console.error("Error calculating fees:", error);
      } finally {
        setCalculatingFees(false);
      }
    }
  }, [amount, destinationChain, calculateBridgeFees]);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };
  
  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const networkId = e.target.value;
    const network = networks.find(n => n.id === networkId);
    if (network) {
      setCurrentNetwork(network);
    }
  };
  
  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestinationChain(e.target.value);
  };
  
  const handleBridgeTokens = async () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    if (amount && destinationChain) {
      try {
        setIsBridging(true);
        await bridgeTokens(parseFloat(amount), destinationChain);
        // Clear amount after successful bridge
        setAmount("");
      } catch (error) {
        console.error("Error bridging tokens:", error);
      } finally {
        setIsBridging(false);
      }
    }
  };
  
  // Get available destination chains (excluding current network)
  const destinationNetworks = networks.filter(n => n.id !== currentNetwork?.id);
  
  return (
    <div className="lg:col-span-1">
      <div className="lz-card mb-6">
        <h2 className="text-xl font-['Roboto'] mb-6">Token Actions</h2>
        
        {/* Your Balance */}
        <div className="mb-6">
          <div className="secondary-text text-sm mb-1">Your Balance</div>
          <div className="text-2xl font-medium font-['Roboto']">{userBalance.total} OGV</div>
          <div className="secondary-text text-sm">≈ ${userBalance.usdValue} USD</div>
        </div>
        
        {/* Chain Selector */}
        <div className="mb-6">
          <label className="block secondary-text text-sm mb-2">Select Chain</label>
          <div className="lz-select-wrapper">
            <select 
              className="lz-select w-full"
              value={currentNetwork?.id}
              onChange={handleNetworkChange}
            >
              {networks.map(network => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Bridge Module */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="uppercase-label">BRIDGE TOKENS</h3>
            <div className="text-xs secondary-text">Fee: 0.1%</div>
          </div>
          
          <div className="mb-4">
            <label className="block secondary-text text-sm mb-2">Amount</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="0.00"
                value={amount} 
                onChange={handleAmountChange}
                className="lz-input w-full pr-16"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="secondary-text font-['Roboto_Mono']">OGV</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block secondary-text text-sm mb-2">Destination Chain</label>
            <div className="lz-select-wrapper">
              <select 
                className="lz-select w-full"
                value={destinationChain}
                onChange={handleDestinationChange}
              >
                {destinationNetworks.map(network => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Gas Estimation */}
          <div className="bg-black rounded-lg p-4 mb-6 border border-[#323232]">
            {calculatingFees ? (
              <div className="flex flex-col items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <span className="text-sm">Calculating fees...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm secondary-text">LayerZero Fee</span>
                  <span className="text-sm font-['Roboto_Mono']">≈ ${fees.layerZeroFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm secondary-text">Bridge Fee (0.1%)</span>
                  <span className="text-sm font-['Roboto_Mono']">≈ ${fees.bridgeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm secondary-text">Gas Fee</span>
                  <span className="text-sm font-['Roboto_Mono']">≈ ${fees.gasFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#323232] mt-2 pt-2 flex justify-between items-center">
                  <span className="text-sm secondary-text">Total Cost</span>
                  <span className="font-medium font-['Roboto_Mono']">≈ ${fees.totalCost.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          
          <button 
            className={`lz-button w-full py-3 ${isBridging || tokenLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleBridgeTokens}
            disabled={isBridging || tokenLoading}
          >
            {!isConnected ? (
              "Connect Wallet to Bridge"
            ) : isBridging ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span>Bridging...</span>
              </div>
            ) : tokenLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span>Loading...</span>
              </div>
            ) : (
              "Bridge Tokens"
            )}
          </button>
        </div>
      </div>
      
      <ContractDetails />
    </div>
  );
}
