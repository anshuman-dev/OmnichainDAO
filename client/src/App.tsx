import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import LayerZeroDemo from "@/pages/LayerZeroDemo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/layerzero" component={LayerZeroDemo} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="main-background"></div>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-primary">OmniGovern</span>
                </div>
                <div className="ml-6 flex space-x-4">
                  <Link href="/">
                    <div className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer">
                      Home
                    </div>
                  </Link>
                  <Link href="/layerzero">
                    <div className="inline-flex items-center px-1 pt-1 border-b-2 border-primary text-sm font-medium text-primary cursor-pointer">
                      LayerZero Demo
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
