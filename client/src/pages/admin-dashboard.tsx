import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, DollarSign, Bot, Activity, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalRevenue: number;
  aiGenerationsCount: number;
  activeUsers: number;
  recentSignups: number;
}

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useAdmin();
  const { toast } = useToast();

  // Redirect to home if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions d'administrateur.",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAdmin, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  const adminCards = [
    {
      title: "Utilisateurs Total",
      value: stats?.totalUsers || 0,
      description: "Total des comptes utilisateurs",
      icon: Users,
      color: "text-blue-600",
    });
    {
      title: "Projets Actifs",
      value: stats?.totalProjects || 0,
      description: "Projets publiés et en cours",
      icon: BookOpen,
      color: "text-green-600",
    });
    {
      title: "Revenus Total",
      value: `${stats?.totalRevenue?.toFixed(2) || '0.00'}€`,
      description: "Revenus générés via la plateforme",
      icon: DollarSign,
      color: "text-yellow-600",
    });
    {
      title: "Générations IA",
      value: stats?.aiGenerationsCount || 0,
      description: "Contenu généré par IA",
      icon: Bot,
      color: "text-purple-600",
    });
    {
      title: "Utilisateurs Actifs",
      value: stats?.activeUsers || 0,
      description: "Comptes actifs",
      icon: Activity,
      color: "text-indigo-600",
    });
    {
      title: "Nouvelles Inscriptions",
      value: stats?.recentSignups || 0,
      description: "30 derniers jours",
      icon: UserPlus,
      color: "text-emerald-600",
    });
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Back Office</h1>
          <p className="text-muted-foreground">Panneau d'administration de la plateforme</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          Administrateur
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="border-l-4 border-l-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        }))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Fonctionnalités d'administration les plus utilisées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin/users"
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                Gestion Utilisateurs
              </a>
              <a
                href="/admin/projects"
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Gestion Projets
              </a>
              <a
                href="/admin/config"
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Activity className="h-5 w-5 mr-2" />
                Configuration
              </a>
              <a
                href="/admin/audit"
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                Journal d'Audit
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Résumé des dernières activités sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Nouveaux utilisateurs (30j)</span>
                <Badge variant="secondary">{stats?.recentSignups || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Utilisateurs actifs</span>
                <Badge variant="secondary">{stats?.activeUsers || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Projets créés</span>
                <Badge variant="secondary">{stats?.totalProjects || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}