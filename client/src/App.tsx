import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Analytics from "@/pages/analytics";
import KDPReports from "@/pages/kdp-reports";
import AIAssistant from "@/pages/ai-assistant";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Always render all routes, handle auth in components */}
      <Route path="/" component={isLoading || !isAuthenticated ? Landing : Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/kdp-reports" component={KDPReports} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
