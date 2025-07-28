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
import { useState } from "react";
import ProjectModal from "@/components/projects/ProjectModal";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showProjectModal, setShowProjectModal] = useState(false);

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
        <main className="flex-1 ml-64 p-6">
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
                <Button onClick={() => setShowProjectModal(true)} className="bg-primary hover:bg-primary/90">
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

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal 
          isOpen={showProjectModal} 
          onClose={() => setShowProjectModal(false)} 
        />
      )}
    </div>
  );
}
