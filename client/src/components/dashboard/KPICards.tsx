import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowUp, ArrowDown, FolderOpen, DollarSign, Book, Bot } from "lucide-react";
import { useEffect } from "react";

export default function KPICards() {
  const { toast } = useToast();
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  };

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      change: "+2 this month",
      changeType: "positive" as const,
      icon: FolderOpen,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    { title: "Monthly Revenue",
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      change: "+18.2%",
      changeType: "positive" as const,
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-success",
    },
    {
      title: "Total Books Sold",
      value: (stats?.totalBooksSold || 0).toLocaleString(),
      change: "-3.1%",
      changeType: "negative" as const,
      icon: Book,
      iconBg: "bg-yellow-100",
      iconColor: "text-warning",
    },
    {
      title: "AI Generations",
      value: (stats?.aiGenerations || 0).toLocaleString(),
      change: "+25.4%",
      changeType: "positive" as const,
      icon: Bot,
      iconBg: "bg-purple-100",
      iconColor: "text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi) => (
        <Card key={kpi.title} className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                <p className={`text-sm mt-2 flex items-center ${
                  kpi.changeType === "positive" ? "text-success" : "text-warning"
                }`}>
                  { kpi.changeType === "positive" ? (
                    <ArrowUp className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-1" />)}
                  {kpi.change}
                </p>
              </div>
              <div className={`${kpi.iconBg} p-3 rounded-lg`}>
                <kpi.icon className={`${kpi.iconColor} text-xl w-6 h-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
