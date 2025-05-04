import { useToken } from "@/hooks/useToken";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContractDetails() {
  const { contracts } = useToken();
  const { toast } = useToast();
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} address copied`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="bg-[#101010] border border-[#323232] rounded-xl p-6">
      <h2 className="text-xl mb-4">Contract Details</h2>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-[#797575] mb-1">GovernanceOFT</div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 flex items-center">
            <code className="text-sm text-[#F2F2F2] truncate flex-1">{contracts.oft}</code>
            <button 
              className="ml-2 text-[#797575] hover:text-[#F2F2F2]"
              onClick={() => copyToClipboard(contracts.oft, "GovernanceOFT")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-[#797575] mb-1">LayerZero Endpoint</div>
          <div className="bg-[#0A0A0A] rounded-lg p-2 flex items-center">
            <code className="text-sm text-[#F2F2F2] truncate flex-1">{contracts.endpoint}</code>
            <button 
              className="ml-2 text-[#797575] hover:text-[#F2F2F2]"
              onClick={() => copyToClipboard(contracts.endpoint, "LayerZero Endpoint")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-[#797575] mb-1">Implementation</div>
          <div className="text-sm bg-[#0A0A0A] rounded-lg p-3 overflow-x-auto">
            <pre>
              <code>
                <span className="text-[#A77DFF]">contract</span> <span className="text-[#F2F2F2]">GovernanceOFT</span> <span className="text-[#F2F2F2]">is</span> <span className="text-[#6CADF5]">OFTAdapterV2</span>, <span className="text-[#6CADF5]">ERC20Votes</span> {`{
  `}<span className="text-[#A77DFF]">uint256</span> <span className="text-[#F2F2F2]">public</span> bridgeFee;
  
  <span className="text-[#F1DF38]">function</span> <span className="text-[#6CADF5]">sendFrom</span>(<span className="text-[#A77DFF]">address</span> _from, <span className="text-[#A77DFF]">uint16</span> _dstChainId,
     <span className="text-[#A77DFF]">bytes</span> <span className="text-[#F2F2F2]">calldata</span> _toAddress, <span className="text-[#A77DFF]">uint256</span> _amount) 
     <span className="text-[#F2F2F2]">external</span> <span className="text-[#F2F2F2]">payable</span> <span className="text-[#F2F2F2]">override</span> {`{
      
    `}<span className="text-[#A77DFF]">require</span>(_amount * bridgeFee &lt;= msg.value, <span className="text-[#6CADF5]">"Insufficient fee"</span>);
    <span className="text-[#F2F2F2]">super</span>.sendFrom(_from, _dstChainId, _toAddress, _amount);
  {`}`}
{`}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
