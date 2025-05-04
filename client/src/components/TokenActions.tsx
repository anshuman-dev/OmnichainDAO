import { useState, useEffect } from "react";
import { useToken } from "@/hooks/useToken";
import { useNetwork } from "@/hooks/useNetwork";
import { useWallet } from "@/hooks/useWallet";
import ContractDetails from "@/components/ContractDetails";

interface TokenActionsProps {
  openWalletModal: () => void;
}

export default function TokenActions({ openWalletModal }: TokenActionsProps) {
  const { userBalance, bridgeTokens, calculateBridgeFees } = useToken();
  const { networks, currentNetwork, setCurrentNetwork } = useNetwork();
  const { isConnected } = useWallet();
  
  const [amount, setAmount] = useState("");
  const [destinationChain, setDestinationChain] = useState("");
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
      const calculatedFees = calculateBridgeFees(parseFloat(amount), destinationChain);
      setFees(calculatedFees);
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
  
  const handleBridgeTokens = () => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    if (amount && destinationChain) {
      bridgeTokens(parseFloat(amount), destinationChain);
    }
  };
  
  // Get available destination chains (excluding current network)
  const destinationNetworks = networks.filter(n => n.id !== currentNetwork?.id);
  
  return (
    <div className="lg:col-span-1">
      <div className="bg-[#101010] border border-[#323232] rounded-xl p-6 mb-6">
        <h2 className="text-xl mb-6">Token Actions</h2>
        
        {/* Your Balance */}
        <div className="mb-6">
          <div className="text-sm text-[#797575] mb-1">Your Balance</div>
          <div className="text-2xl font-medium">{userBalance.total} OGV</div>
          <div className="text-[#797575] text-sm">≈ ${userBalance.usdValue} USD</div>
        </div>
        
        {/* Chain Selector */}
        <div className="mb-6">
          <label className="block text-sm text-[#797575] mb-2">Select Chain</label>
          <div className="relative">
            <select 
              className="w-full bg-[#0A0A0A] border border-[#323232] text-white rounded-lg px-4 py-2 appearance-none focus:outline-none focus:border-[#797575]"
              value={currentNetwork?.id}
              onChange={handleNetworkChange}
            >
              {networks.map(network => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-[#797575]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Bridge Module */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="uppercase-label text-[#797575]">Bridge Tokens</h3>
            <div className="text-xs text-[#797575]">Fee: 0.1%</div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-[#797575] mb-2">Amount</label>
            <div className="relative rounded-lg">
              <input 
                type="text" 
                placeholder="0.00"
                value={amount} 
                onChange={handleAmountChange}
                className="w-full bg-[#0A0A0A] border border-[#323232] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#797575]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[#797575]">OGV</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-[#797575] mb-2">Destination Chain</label>
            <div className="relative">
              <select 
                className="w-full bg-[#0A0A0A] border border-[#323232] text-white rounded-lg px-4 py-2 appearance-none focus:outline-none focus:border-[#797575]"
                value={destinationChain}
                onChange={handleDestinationChange}
              >
                {destinationNetworks.map(network => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-[#797575]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Gas Estimation */}
          <div className="bg-[#0A0A0A] rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#797575]">LayerZero Fee</span>
              <span className="text-sm">≈ ${fees.layerZeroFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#797575]">Bridge Fee (0.1%)</span>
              <span className="text-sm">≈ ${fees.bridgeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#797575]">Gas Fee</span>
              <span className="text-sm">≈ ${fees.gasFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#323232] mt-2 pt-2 flex justify-between items-center">
              <span className="text-sm text-[#797575]">Total Cost</span>
              <span>≈ ${fees.totalCost.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            className="w-full bg-[#101010] hover:bg-[#0A0A0A] border border-[#323232] hover:border-[#F2F2F2] text-[#F2F2F2] rounded-lg px-4 py-3 text-sm uppercase-label transition-all"
            onClick={handleBridgeTokens}
          >
            {isConnected ? "Bridge Tokens" : "Connect Wallet to Bridge"}
          </button>
        </div>
      </div>
      
      <ContractDetails />
    </div>
  );
}
