import { useToken } from "@/hooks/useToken";
import { ChainDistribution, SupplyCheck } from "@/types/token";

export default function TokenOverview() {
  const { tokenStats, chainDistribution, supplyChecks } = useToken();
  
  // Chain distribution color mapping
  const chainColors: Record<string, string> = {
    Ethereum: "bg-green-500",
    Polygon: "bg-purple-500",
    Arbitrum: "bg-blue-500",
    Base: "bg-yellow-500"
  };

  return (
    <div className="lg:col-span-2">
      <div className="bg-[#101010] border border-[#323232] rounded-xl p-6 h-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl">Governance Token</h2>
          <div className="uppercase-label inline-block bg-[#0A0A0A] px-3 py-1 rounded-full border border-[#323232]">
            Phase 1
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Stats */}
          <div>
            <h3 className="uppercase-label mb-4 text-[#797575]">Token Stats</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[#797575] mb-1">Total Supply</div>
                <div className="text-lg">{tokenStats.totalSupply} OGV</div>
              </div>
              
              <div>
                <div className="text-sm text-[#797575] mb-1">Current Price</div>
                <div className="text-lg">${tokenStats.price} USD</div>
              </div>
              
              <div>
                <div className="text-sm text-[#797575] mb-1">24h Volume</div>
                <div className="text-lg">${tokenStats.volume}</div>
              </div>
              
              <div>
                <div className="text-sm text-[#797575] mb-1">Circulating Supply</div>
                <div className="text-lg">{tokenStats.circulatingSupply} OGV</div>
              </div>
            </div>
          </div>
          
          {/* Chain Distribution */}
          <div>
            <h3 className="uppercase-label mb-4 text-[#797575]">Chain Distribution</h3>
            
            {chainDistribution.map((chain: ChainDistribution) => (
              <div key={chain.name} className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${chainColors[chain.name] || 'bg-gray-500'} mr-2`}></div>
                  <span>{chain.name}</span>
                </div>
                <div className="text-[#797575] text-right">
                  <div>{chain.amount} OGV</div>
                  <div className="text-xs">{chain.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Supply Consistency History */}
        <div className="mt-8">
          <h3 className="uppercase-label mb-4 text-[#797575]">Supply Consistency Checks</h3>
          
          <div className="border border-[#323232] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[#323232]">
              <thead className="bg-[#0A0A0A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase-label text-[#797575]">Date</th>
                  <th className="px-4 py-3 text-left text-xs uppercase-label text-[#797575]">Chain</th>
                  <th className="px-4 py-3 text-left text-xs uppercase-label text-[#797575]">Event</th>
                  <th className="px-4 py-3 text-left text-xs uppercase-label text-[#797575]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#323232] bg-[#101010]">
                {supplyChecks.map((check: SupplyCheck, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">{check.date}</td>
                    <td className="px-4 py-3 text-sm">{check.chain}</td>
                    <td className="px-4 py-3 text-sm">{check.event}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        check.status === 'Verified' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-yellow-900 text-yellow-300'
                      }`}>
                        {check.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
