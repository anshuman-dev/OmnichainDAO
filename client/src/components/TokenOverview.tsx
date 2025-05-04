import { useToken } from "@/hooks/useToken";
import { ChainDistribution, SupplyCheck } from "@/types/token";

export default function TokenOverview() {
  const { tokenStats, chainDistribution, supplyChecks, isLoading } = useToken();
  
  // Chain distribution color mapping
  const chainColors: Record<string, string> = {
    Ethereum: "bg-green-500",
    Polygon: "bg-purple-500",
    Arbitrum: "bg-blue-500",
    Base: "bg-yellow-500"
  };

  return (
    <div className="lg:col-span-2">
      <div className="lz-card h-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-['Roboto']">Governance Token</h2>
          <div className="uppercase-label inline-block bg-black px-3 py-1 rounded-full border border-[#323232]">
            PHASE 1
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Stats */}
          <div>
            <h3 className="uppercase-label mb-4">TOKEN STATS</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm secondary-text mb-1">Total Supply</div>
                <div className="text-lg font-['Roboto_Mono']">{tokenStats.totalSupply} OGV</div>
              </div>
              
              <div>
                <div className="text-sm secondary-text mb-1">Current Price</div>
                <div className="text-lg font-['Roboto_Mono']">${tokenStats.price} USD</div>
              </div>
              
              <div>
                <div className="text-sm secondary-text mb-1">24h Volume</div>
                <div className="text-lg font-['Roboto_Mono']">${tokenStats.volume}</div>
              </div>
              
              <div>
                <div className="text-sm secondary-text mb-1">Circulating Supply</div>
                <div className="text-lg font-['Roboto_Mono']">{tokenStats.circulatingSupply} OGV</div>
              </div>
            </div>
          </div>
          
          {/* Chain Distribution */}
          <div>
            <h3 className="uppercase-label mb-4">CHAIN DISTRIBUTION</h3>
            
            {chainDistribution.map((chain: ChainDistribution) => (
              <div key={chain.name} className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${chainColors[chain.name] || 'bg-gray-500'} mr-2`}></div>
                  <span className="font-['Roboto']">{chain.name}</span>
                </div>
                <div className="secondary-text text-right">
                  <div className="font-['Roboto_Mono']">{chain.amount} OGV</div>
                  <div className="text-xs font-['Roboto_Mono']">{chain.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Supply Consistency History */}
        <div className="mt-8">
          <h3 className="uppercase-label mb-4">SUPPLY CONSISTENCY CHECKS</h3>
          
          <div className="border border-[#323232] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[#323232]">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase-label">DATE</th>
                  <th className="px-4 py-3 text-left text-xs uppercase-label">CHAIN</th>
                  <th className="px-4 py-3 text-left text-xs uppercase-label">EVENT</th>
                  <th className="px-4 py-3 text-left text-xs uppercase-label">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#323232] bg-[#0A0A0A]">
                {supplyChecks.map((check: SupplyCheck, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-['Roboto_Mono']">{check.date}</td>
                    <td className="px-4 py-3 text-sm font-['Roboto']">{check.chain}</td>
                    <td className="px-4 py-3 text-sm font-['Roboto_Mono']">{check.event}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`lz-badge ${
                        check.status === 'Verified' 
                          ? 'lz-badge-green' 
                          : 'lz-badge-yellow'
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
