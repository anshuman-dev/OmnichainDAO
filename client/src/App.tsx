import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import OmniGovernDAO from "@/pages/OmniGovernDAO";
import NotFound from "@/pages/not-found";
import WalletProvider from "./components/WalletProvider";

function Router() {
  return (
    <Switch>
      <Route path="/" component={OmniGovernDAO} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <div className="main-background"></div>
          <Toaster />
          <Router />
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
