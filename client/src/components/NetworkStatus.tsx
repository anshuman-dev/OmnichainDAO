import { useNetwork } from "@/hooks/useNetwork";

export default function NetworkStatus() {
  const { networkStatus } = useNetwork();
  
  return (
    <div className="mt-8">
      <h2 className="text-xl mb-6">Network Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {networkStatus.map((network) => (
          <div key={network.id} className="bg-[#101010] border border-[#323232] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  network.status === "Online" 
                    ? "bg-green-500" 
                    : "bg-yellow-500"
                } mr-2 network-active`}></div>
                <h3>{network.name}</h3>
              </div>
              <span className={`text-xs ${
                network.status === "Online" 
                  ? "bg-green-900 text-green-300" 
                  : "bg-yellow-900 text-yellow-300"
              } px-2 py-0.5 rounded`}>
                {network.status}
              </span>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#797575]">Latency</span>
                <span>{network.latency}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#797575]">Gas Price</span>
                <span>{network.gasPrice} Gwei</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#797575]">Tx Count</span>
                <span>{network.txCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
