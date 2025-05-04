import { useNetwork } from "@/hooks/useNetwork";

export default function NetworkStatus() {
  const { networkStatus } = useNetwork();
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-['Roboto'] mb-6">Network Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {networkStatus.map((network) => (
          <div key={network.id} className="lz-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  network.status === "Online" 
                    ? "bg-green-500" 
                    : "bg-yellow-500"
                } mr-2 network-active`}></div>
                <h3 className="font-['Roboto']">{network.name}</h3>
              </div>
              <span className={`lz-badge ${
                network.status === "Online" 
                  ? "lz-badge-green" 
                  : "lz-badge-yellow"
              }`}>
                {network.status}
              </span>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="secondary-text">Latency</span>
                <span className="font-['Roboto_Mono']">{network.latency}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="secondary-text">Gas Price</span>
                <span className="font-['Roboto_Mono']">{network.gasPrice} Gwei</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="secondary-text">Tx Count</span>
                <span className="font-['Roboto_Mono']">{network.txCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
