import { useState, useEffect } from "react";
import { useNetwork } from "@/hooks/useNetwork";

interface HeaderProps {
  isConnected: boolean;
  openWalletModal: () => void;
}

export default function Header({ isConnected, openWalletModal }: HeaderProps) {
  const { currentNetwork, gasPrice } = useNetwork();
  const [formattedGasPrice, setFormattedGasPrice] = useState("$0.10");
  
  useEffect(() => {
    if (gasPrice) {
      setFormattedGasPrice(`$${gasPrice.toFixed(2)}`);
    }
  }, [gasPrice]);
  
  return (
    <header className="border-b border-[#323232] py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* OmniGovern Logo */}
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white"/>
            <path d="M12 10.5C15 10.5 15 7.5 12 7.5C9 7.5 9 10.5 12 10.5Z" fill="white"/>
            <path d="M12 13.5C9 13.5 9 16.5 12 16.5C15 16.5 15 13.5 12 13.5Z" fill="white"/>
          </svg>
          <div>
            <h1 className="text-xl font-medium font-['Roboto']">OmniGovern</h1>
            <div className="text-xs text-[#757575] font-['Roboto_Mono']">Powered by LayerZero V2</div>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center">
          <div className="hidden md:flex items-center mr-6 space-x-6">
            {/* Gas Price */}
            <div className="flex items-center space-x-2">
              <div className="uppercase-label">GAS</div>
              <div className="flex items-center bg-[#0A0A0A] rounded-lg px-3 py-1 border border-[#323232]">
                <span className="text-[#F1DF38] text-sm font-['Roboto_Mono']">{formattedGasPrice}</span>
              </div>
            </div>
            
            {/* Network Indicator */}
            {currentNetwork && (
              <div className="flex items-center space-x-2">
                <div className="uppercase-label">NETWORK</div>
                <div className="flex items-center bg-[#0A0A0A] rounded-lg px-3 py-1 border border-[#323232]">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 network-active"></div>
                  <span className="text-sm font-['Roboto_Mono']">{currentNetwork.name}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Connect Wallet Button */}
          <button 
            className="lz-button"
            onClick={openWalletModal}
          >
            {isConnected ? "Connected" : "Connect Wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}
