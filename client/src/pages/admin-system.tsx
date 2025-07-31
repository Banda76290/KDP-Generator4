import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, RefreshCw, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  categories: number;
  lastSeeded: string | null;
}

export default function AdminSystem() {
  const { isAdmin, isLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'resetting'>('idle');

  // Redirect to home if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions d'administrateur.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAdmin, isLoading, toast]);

  // Get system health data
  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system/health"],
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Database seeding mutation
  const seedDatabase = useMutation({
    mutationFn: () => apiRequest("/api/admin/database/seed", "POST"),
    onMutate: () => {
      setSeedingStatus('seeding');
    },
    onSuccess: () => {
      toast({
        title: "Synchronisation réussie",
        description: "La base de données a été synchronisée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system/health"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser la base de données.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSeedingStatus('idle');
    },
  });

  // Database reset mutation
  const resetDatabase = useMutation({
    mutationFn: () => apiRequest("/api/admin/database/reset", "POST"),
    onMutate: () => {
      setSeedingStatus('resetting');
    },
    onSuccess: () => {
      toast({
        title: "Reset réussi",
        description: "La base de données a été remise à zéro et re-synchronisée.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system/health"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de reset",
        description: error.message || "Impossible de remettre à zéro la base de données.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSeedingStatus('idle');
    },
  });

  const handleSeed = () => {
    if (confirm("Voulez-vous synchroniser la base de données avec les dernières catégories ?")) {
      seedDatabase.mutate();
    }
  };

  const handleReset = () => {
    if (confirm("ATTENTION: Cette action va effacer toutes les catégories existantes et les remplacer. Êtes-vous sûr de vouloir continuer ?")) {
      resetDatabase.mutate();
    }
  };

  if (isLoading || healthLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Système opérationnel</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Attention requise</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Erreur système</Badge>;
      default:
        return <Badge variant="outline">Statut inconnu</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Server className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Administration Système</h1>
              <p className="text-muted-foreground">
                Gestion de la base de données et synchronisation
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Administrateur Système
          </Badge>
        </div>

        {/* System Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              {getStatusIcon(systemHealth?.database || 'error')}
              <div>
                <CardTitle className="text-lg">État du Système</CardTitle>
                <CardDescription>
                  Surveillance en temps réel de la base de données
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(systemHealth?.database || 'error')}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Catégories chargées:</span>
                <Badge variant="secondary">{systemHealth?.categories || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Dernière synchronisation:</span>
                <span className="text-sm text-muted-foreground">
                  {systemHealth?.lastSeeded ? new Date(systemHealth.lastSeeded).toLocaleString('fr-FR') : 'Jamais'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Gestion de la Base de Données</CardTitle>
                <CardDescription>
                  Synchronisation des catégories Amazon KDP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">ℹ️ Information</h4>
              <p className="text-sm text-blue-800">
                La synchronisation automatique se fait au démarrage de l'application. 
                Utilisez ces contrôles uniquement si vous devez forcer une mise à jour manuelle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Synchronisation Simple</h4>
                <p className="text-sm text-muted-foreground">
                  Ajoute les catégories manquantes sans effacer les données existantes.
                </p>
                <Button 
                  onClick={handleSeed}
                  disabled={seedingStatus !== 'idle'}
                  className="w-full"
                >
                  {seedingStatus === 'seeding' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Synchroniser
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-red-600">Reset Complet</h4>
                <p className="text-sm text-muted-foreground">
                  ⚠️ Efface toutes les catégories et les recharge complètement.
                </p>
                <Button 
                  onClick={handleReset}
                  disabled={seedingStatus !== 'idle'}
                  variant="destructive"
                  className="w-full"
                >
                  {seedingStatus === 'resetting' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Reset en cours...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset & Re-synchroniser
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Techniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Données incluses:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 249 catégories Amazon KDP</li>
                  <li>• 6 marketplaces (FR, IT, DE, UK, ES, COM)</li>
                  <li>• Types: Kindle eBook & Paperback</li>
                  <li>• Structure hiérarchique complète</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Processus automatique:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Démarrage serveur → Vérification</li>
                  <li>• Base vide → Import automatique</li>
                  <li>• Données existantes → Ignore</li>
                  <li>• Production → Zéro intervention</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}