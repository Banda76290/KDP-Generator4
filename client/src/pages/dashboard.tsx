import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import KPICards from "@/components/dashboard/KPICards";
import SalesChart from "@/components/dashboard/SalesChart";
import FormatChart from "@/components/dashboard/FormatChart";
import ProjectsTable from "@/components/dashboard/ProjectsTable";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 md:ml-64">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's your publishing overview.</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="text-gray-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button onClick={() => setLocation("/project-create-simple")} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <KPICards />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SalesChart />
            <FormatChart />
          </div>

          {/* Recent Projects Table */}
          <ProjectsTable />
        </main>
      </div>
    </div>
  );
}
