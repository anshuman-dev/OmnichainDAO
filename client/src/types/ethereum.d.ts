interface Window {
  ethereum?: {
    isConnected?: boolean;
    selectedAddress?: string;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
  };
}