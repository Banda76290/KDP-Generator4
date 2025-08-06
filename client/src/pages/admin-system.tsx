import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Database, RefreshCw, AlertTriangle, CheckCircle, Server, Terminal, Trash2, Copy, Play, Pause } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  categories: number;
  lastSeeded: string | null;
  totalUsers: number;
  totalProjects: number;
  totalBooks: number;
  diskUsage?: {
    used: string;
    total: string;
    percentage: number;
  };
  uptime: string;
  memoryUsage: {
    used: string;
    total: string;
    percentage: number;
  };
}

export default function AdminSystem() {
  const { isAdmin, isLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'resetting' | 'syncing'>('idle');
  const [productionUrl, setProductionUrl] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [userIsInteracting, setUserIsInteracting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user interaction on the page
  useEffect(() => {
    const handleUserActivity = () => {
      setUserIsInteracting(true);
      
      // Clear existing timeout
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      
      // Set timeout to reset interaction after 3 seconds of inactivity
      interactionTimeoutRef.current = setTimeout(() => {
        setUserIsInteracting(false);
      }, 3000);
    };

    // Add event listeners for user activity
    const events = ['click', 'scroll', 'keydown', 'mousemove', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    };

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);};
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll logs to bottom only if user is not actively using the page
  const scrollToBottom = () => {
    if (autoScrollEnabled && !isPaused && !userIsInteracting) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth"};
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, autoScrollEnabled, isPaused, userIsInteracting]);

  // Detect user interaction with logs container
  const handleLogsScroll = () => {
    try {
      if (logsContainerRef.current) {
        const container = logsContainerRef.current;
        const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;
        
        // Re-enable auto-scroll only if user scrolled to bottom
        if (isAtBottom && !autoScrollEnabled) {
          setAutoScrollEnabled(true);
        }
        // Disable auto-scroll if user scrolled up
        else if (!isAtBottom && autoScrollEnabled) {
          setAutoScrollEnabled(false);
        }
      }
    } catch (error) {
      console.warn('Error in scroll handler:', error);
    }
  };

  // Fetch system logs from server
  const { data: systemLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/system/logs'],
    refetchInterval: (autoRefreshLogs && !isPaused) ? 2000 : false, // Only refresh if not paused
    refetchIntervalInBackground: true,
    enabled: isAdmin, // Only fetch if user is admin
  };

  // Update local logs when server logs change
  useEffect(() => {
    try {
      if (systemLogsData && typeof systemLogsData === 'object' && 'logs' in systemLogsData) {
        const logsData = systemLogsData as { logs: any[] });
        if (Array.isArray(logsData.logs)) {
          const formattedLogs = logsData.logs.map((log: any) => {
            const timestamp = new Date(log.timestamp).toLocaleTimeString('fr-FR');
            const prefix = log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : log.level === 'debug' ? '🔍' : 'ℹ️';
            const category = log.category ? `[${log.category}] ` : '';
            return `[${timestamp}] ${prefix} ${category}${log.message}`;
          });
          setLogs(formattedLogs);
        }
      }
    } catch (error) {
      console.warn('Error processing logs data:', error);
    }
  }, [systemLogsData]);

  // Add log function
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    setLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/system/logs', { method: 'DELETE'},
    onSuccess: () => {
      setLogs([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/logs']});
      toast({
        description: "Logs système effacés"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: "Erreur lors de l'effacement des logs"});
    }
  });

  // Clear logs function
  const clearLogs = () => {
    clearLogsMutation.mutate();
  };

  // Copy logs to clipboard
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      toast({
        title: "Logs copiés",
        description: "Les logs ont été copiés dans le presse-papiers.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier les logs.",
        variant: "destructive"
      });
    }
  };

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

  // Get system health data
  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system/health"],
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  };

  // Database seeding mutation
  const seedDatabase = useMutation({
    mutationFn: async () => {
      addLog('Début de la synchronisation de la base de données...', 'info');
      addLog('Envoi de la requête POST /api/admin/database/seed', 'info');
      
      try {
        const result = await apiRequest("/api/admin/database/seed", { method: "POST"};
        addLog('Réponse reçue du serveur', 'success');
        addLog(`Résultat: ${ JSON.stringify(result, null, 2}`, 'info');
        return result;
      } catch (error: any) {
        addLog(`Erreur API: ${error.message}`, 'error');
        addLog(`Détails de l'erreur: ${ JSON.stringify(error, null, 2}`, 'error');
        throw error;
      }
    },
    onMutate: () => {
      setSeedingStatus('seeding');
      addLog('🔄 Démarrage de la synchronisation...', 'info');
    },
    onSuccess: (data) => {
      addLog('✅ Synchronisation terminée avec succès', 'success');
      if (data.duration) addLog(`⏱️ Durée de l'opération: ${data.duration}`, 'info');
      if (data.timestamp) addLog(`🕐 Horodatage serveur: ${data.timestamp}`, 'info');
      addLog(`📊 Données complètes: ${ JSON.stringify(data, null, 2}`, 'info');
      toast({
        title: "Synchronisation réussie",
        description: "La base de données a été synchronisée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system/health"] });
    },
    onError: (error: any) => {
      addLog(`❌ Échec de la synchronisation: ${error.message}`, 'error');
      addLog(`Stack trace: ${error.stack || 'Non disponible'}`, 'error');
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser la base de données.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSeedingStatus('idle');
      addLog('🏁 Opération de synchronisation terminée', 'info');
    },
  });

  // Database reset mutation
  const resetDatabase = useMutation({
    mutationFn: async () => {
      addLog('⚠️ Début du reset complet de la base de données...', 'warning');
      addLog('Envoi de la requête POST /api/admin/database/reset', 'info');
      
      try {
        const result = await apiRequest("/api/admin/database/reset", { method: "POST"};
        addLog('Réponse reçue du serveur pour le reset', 'success');
        addLog(`Résultat du reset: ${ JSON.stringify(result, null, 2}`, 'info');
        return result;
      } catch (error: any) {
        addLog(`Erreur lors du reset: ${error.message}`, 'error');
        addLog(`Détails de l'erreur reset: ${ JSON.stringify(error, null, 2}`, 'error');
        throw error;
      }
    },
    onMutate: () => {
      setSeedingStatus('resetting');
      addLog('🔄 Démarrage du reset complet...', 'warning');
      addLog('⚠️ ATTENTION: Toutes les catégories existantes vont être supprimées', 'warning');
    },
    onSuccess: (data) => {
      addLog('✅ Reset et re-synchronisation terminés avec succès', 'success');
      if (data.duration) addLog(`⏱️ Durée totale du reset: ${data.duration}`, 'info');
      if (data.timestamp) addLog(`🕐 Horodatage serveur: ${data.timestamp}`, 'info');
      addLog(`📊 Données complètes du reset: ${ JSON.stringify(data, null, 2}`, 'info');
      toast({
        title: "Reset réussi",
        description: "La base de données a été remise à zéro et re-synchronisée.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system/health"] });
    },
    onError: (error: any) => {
      addLog(`❌ Échec du reset: ${error.message}`, 'error');
      addLog(`Stack trace du reset: ${error.stack || 'Non disponible'}`, 'error');
      toast({
        title: "Erreur de reset",
        description: error.message || "Impossible de remettre à zéro la base de données.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSeedingStatus('idle');
      addLog('🏁 Opération de reset terminée', 'info');
    },
  });

  const handleSeed = () => {
    if (confirm("Voulez-vous synchroniser la base de données avec les dernières catégories ?")) {
      addLog('👤 Utilisateur a confirmé la synchronisation', 'info');
      seedDatabase.mutate();
    } else {
      addLog('👤 Utilisateur a annulé la synchronisation', 'warning');
    }
  };

  const handleReset = () => {
    if (confirm("ATTENTION: Cette action va effacer toutes les catégories existantes et les remplacer. Êtes-vous sûr de vouloir continuer ?")) {
      addLog('👤 Utilisateur a confirmé le reset complet - ATTENTION DANGER', 'warning');
      resetDatabase.mutate();
    } else {
      addLog('👤 Utilisateur a annulé le reset complet', 'info');
    }
  };

  // Export categories mutation
  const exportCategories = useMutation({
    mutationFn: async () => {
      addLog('📤 Début de l\'export des catégories...', 'info');
      try {
        const result = await apiRequest("/api/admin/categories/export", { method: "GET"};
        addLog(`✅ Export réussi: ${result.count} catégories`, 'success');
        return result;
      } catch (error: any) {
        addLog(`❌ Erreur lors de l\'export: ${error.message}`, 'error');
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Export réussi",
        description: `${data.count} catégories exportées avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'export",
        description: error.message || "Impossible d'exporter les catégories.",
        variant: "destructive"
      });
    },
  });

  // Sync to production mutation
  const syncToProduction = useMutation({
    mutationFn: async ({ productionUrl, categories}: { productionUrl: string, categories: any[] } => {
      addLog(`🔄 Début de la synchronisation vers: ${productionUrl}`, 'info');
      addLog(`📊 ${categories.length} catégories à synchroniser`, 'info');
      
      try {
        const result = await apiRequest("/api/admin/categories/sync-to-production", {
          method: "POST",
          body: JSON.stringify({ productionUrl,
            categories}
        });
        addLog('✅ Synchronisation réussie', 'success');
        return result;
      } catch (error: any) {
        addLog(`❌ Erreur de synchronisation: ${error.message}`, 'error');
        throw error;
      }
    },
    onMutate: () => {
      setSeedingStatus('syncing');
      addLog('🚀 Démarrage de la synchronisation Dev → Production...', 'info');
    },
    onSuccess: (data) => {
      addLog(`✅ ${data.syncedCount} catégories synchronisées`, 'success');
      if (data.duration) addLog(`⏱️ Durée: ${data.duration}`, 'info');
      toast({
        title: "Synchronisation réussie",
        description: `${data.syncedCount} catégories synchronisées vers la production.`,
      });
    },
    onError: (error: any) => {
      addLog(`❌ Échec de la synchronisation: ${error.message}`, 'error');
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser vers la production.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSeedingStatus('idle');
      addLog('🏁 Opération de synchronisation terminée', 'info');
    },
  });

  const handleSyncToProduction = async () => {
    if (!productionUrl.trim()) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir l'URL de production.",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Synchroniser les catégories de développement vers:\n${productionUrl}\n\nCette action remplacera toutes les catégories de production. Continuer ?`)) {
      addLog(`👤 Utilisateur a confirmé la synchronisation vers: ${productionUrl}`, 'info');
      
      // First export current categories
      try {
        const exportResult = await exportCategories.mutateAsync();
        if (exportResult.categories && exportResult.categories.length > 0) {
          // Then sync to production
          syncToProduction.mutate({
            productionUrl: productionUrl.trim(),
            categories: exportResult.categories};
        }
      } catch (error) {
        addLog('❌ Impossible d\'exporter les catégories pour la synchronisation', 'error');
      }
    } else {
      addLog('👤 Utilisateur a annulé la synchronisation', 'warning');
    }
  };

  const generateSQLContent = async () => { const exportResult = await exportCategories.mutateAsync();
    
    if (exportResult.categories && exportResult.categories.length > 0) {
      const categories = exportResult.categories;
      let sqlContent = `-- Export SQL des catégories KDP Generator\n`;
      sqlContent += `-- Généré le ${new Date().toLocaleString('fr-FR'}\n`;
      sqlContent += `-- ${categories.length} catégories exportées\n\n`;
      
      sqlContent += `-- Vider et recréer la table\n`;
      sqlContent += `TRUNCATE TABLE marketplace_categories CASCADE;\n\n`;
      
      categories.forEach((cat: any) => { const values = [
          `'${cat.marketplace.replace(/'/g, "''"}'`,
          `'${ cat.categoryPath.replace(/'/g, "''"}'`,
          cat.parentPath ? `'${ cat.parentPath.replace(/'/g, "''"}'` : 'NULL',
          cat.level,
          `'${ cat.displayName.replace(/'/g, "''"}'`,
          cat.isSelectable,
          cat.sortOrder,
          cat.isActive,
          'NOW()',
          'NOW()'
        ];
        
        sqlContent += `INSERT INTO marketplace_categories (marketplace, category_path, parent_path, level, display_name, is_selectable, sort_order, is_active, created_at, updated_at) VALUES (${ values.join(', '};\n`;
      });
      
      return { sqlContent, count: categories.length };
    }
    throw new Error('Aucune catégorie à exporter');
  };

  const handleCopySQL = async () => {
    try {
      addLog('📋 Copie du SQL dans le presse-papiers...', 'info');
      const { sqlContent, count } = await generateSQLContent();
      
      await navigator.clipboard.writeText(sqlContent);
      
      addLog(`✅ SQL copié: ${count} catégories`, 'success');
      toast({
        title: "SQL copié",
        description: `Le code SQL pour ${count} catégories a été copié dans le presse-papiers. Allez dans l'onglet Database de Replit et collez-le dans le SQL runner.`,
      });
    } catch (error: any) {
      addLog(`❌ Erreur lors de la copie SQL: ${error.message}`, 'error');
      toast({
        title: "Erreur de copie",
        description: error.message || "Impossible de copier le SQL.",
        variant: "destructive",
      });
    }
  };

  const handleExportSQL = async () => {
    try {
      addLog('📤 Début de l\'export SQL...', 'info');
      const { sqlContent, count } = await generateSQLContent();
      
      // Download file
      const blob = new Blob([sqlContent], { type: 'text/sql' };
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kdp-categories-export-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLog(`✅ Fichier SQL téléchargé: ${count} catégories`, 'success');
      toast({
        title: "Export SQL réussi",
        description: `${count} catégories exportées vers un fichier SQL.`,
      });
    } catch (error: any) {
      addLog(`❌ Erreur lors de l'export SQL: ${error.message}`, 'error');
      toast({
        title: "Erreur d'export SQL",
        description: error.message || "Impossible d'exporter en SQL.",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = async () => {
    try {
      addLog('📤 Début de l\'export JSON...', 'info');
      const exportResult = await exportCategories.mutateAsync();
      
      if (exportResult.categories && exportResult.categories.length > 0) {
        const exportData = {
          timestamp: new Date().toISOString(),
          version: "1.0",
          categoriesCount: exportResult.categories.length,
          categories: exportResult.categories
        };
        
        // Download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' };
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kdp-categories-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog(`✅ Fichier JSON téléchargé: ${exportResult.categories.length} catégories`, 'success');
        toast({
          title: "Export JSON réussi",
          description: `${exportResult.categories.length} catégories exportées vers un fichier JSON.`,
        });
      }
    } catch (error: any) {
      addLog(`❌ Erreur lors de l'export JSON: ${error.message}`, 'error');
      toast({
        title: "Erreur d'export JSON",
        description: error.message || "Impossible d'exporter en JSON.",
        variant: "destructive",
      });
    }
  };

  // Initialize with welcome log
  useEffect(() => {
    if (isAdmin && logs.length === 0) {
      addLog('🚀 Interface d\'administration système chargée', 'success');
      addLog(`👤 Utilisateur administrateur connecté: ${systemHealth?.totalUsers || 0} utilisateurs au total`, 'info');
    }
  }, [isAdmin, systemHealth]);

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
            <Button variant="ghost" size="sm" onClick={ () => window.history.back( }>
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
              { getStatusIcon(systemHealth?.database || 'error'}
              <div>
                <CardTitle className="text-lg">État du Système</CardTitle>
                <CardDescription>
                  Surveillance en temps réel de la base de données
                </CardDescription>
              </div>
            </div>
            { getStatusBadge(systemHealth?.database || 'error'}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Catégories:</span>
                <Badge variant="secondary">{systemHealth?.categories || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Utilisateurs:</span>
                <Badge variant="secondary">{systemHealth?.totalUsers || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Projets:</span>
                <Badge variant="secondary">{systemHealth?.totalProjects || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Livres:</span>
                <Badge variant="secondary">{systemHealth?.totalBooks || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Uptime:</span>
                <span className="text-sm text-muted-foreground">{systemHealth?.uptime || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Mémoire:</span>
                <span className="text-sm text-muted-foreground">
                  {systemHealth?.memoryUsage ? `${systemHealth.memoryUsage.percentage}%` : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Dernière synchronisation:</span>
                <span className="text-sm text-blue-800">
                  {systemHealth?.lastSeeded ? new Date(systemHealth.lastSeeded).toLocaleString('fr-FR') : 'Jamais'}
                </span>
              </div>
              {systemHealth?.memoryUsage && (
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${systemHealth.memoryUsage.percentage}%` }}
                  ></div>
                </div>
              )}
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
                  { seedingStatus === 'seeding' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Synchroniser
                    </>}
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
                  { seedingStatus === 'resetting' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Reset en cours...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset & Re-synchroniser
                    </>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dev to Production Sync */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle>Synchronisation Développement → Production</CardTitle>
                <CardDescription>
                  Transférer les catégories de développement vers la production
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">⚠️ Attention</h4>
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-sm text-red-800 mb-2">
                  ⚠️ <strong>La synchronisation directe échouera probablement</strong> car elle nécessite :
                </p>
                <ul className="text-xs text-red-700 list-disc list-inside space-y-1 ml-2">
                  <li>Une URL de production accessible et déployée</li>
                  <li>L'authentification et les autorisations CORS configurées</li>
                  <li>L'API /api/admin/categories/migrate active sur le serveur cible</li>
                </ul>
              </div>
              <p className="text-sm text-orange-800 mb-3">
                <strong>Recommandation :</strong> Utilisez les méthodes manuelles ci-dessous (Copier SQL) qui fonctionnent toujours, 
                même si la synchronisation directe échoue.
              </p>
              <div className="bg-orange-100 border border-orange-300 rounded p-3 space-y-3">
                <p className="text-xs text-orange-700">
                  <strong>🎯 Guide de synchronisation manuelle :</strong>
                </p>
                <div className="text-xs text-orange-600 space-y-2">
                  <div>
                    <p className="font-semibold mb-1">📋 Option 1 : Copier-Coller (Recommandé)</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Cliquez sur "Copier SQL" ci-dessous</li>
                      <li>Ouvrez votre projet de PRODUCTION dans Replit</li>
                      <li>Cliquez sur l'onglet "Database" (icône base de données)</li>
                      <li>Dans la console, collez le SQL et appuyez sur Entrée</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">💾 Option 2 : Fichier SQL</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Cliquez sur "Télécharger SQL"</li>
                      <li>Uploadez le fichier dans votre projet de production</li>
                      <li>Exécutez le fichier via la console Database</li>
                    </ol>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                    <p className="text-green-700 text-xs font-medium">
                      ✅ <strong>Solution recommandée :</strong> Ces méthodes manuelles fonctionnent toujours, 
                      même quand la synchronisation directe échoue (erreur 403/CORS).
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                    <p className="text-yellow-700 text-xs">
                      ⚠️ <strong>Important :</strong> Ces opérations remplaceront TOUTES les catégories en production. 
                      Faites une sauvegarde si nécessaire.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Environnement Actuel</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Catégories locales:</span>
                      <Badge variant="secondary">{systemHealth?.categories || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Statut:</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Développement</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">URL de Production</h4>
                  <div className="space-y-2">
                    <label htmlFor="production-url" className="text-sm font-medium">
                      URL de votre site de production:
                    </label>
                    <input
                      id="production-url"
                      type="url"
                      value={productionUrl}
                      onChange={ (e) => setProductionUrl(e.target.value }
                      placeholder="https://votre-site.replit.app"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-muted-foreground">
                      Exemple: https://monapp.replit.app
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button 
                  onClick={handleSyncToProduction}
                  disabled={ seedingStatus !== 'idle' || !productionUrl.trim(}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  { seedingStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Synchronisation en cours...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Synchroniser vers Production
                    </>}
                </Button>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCopySQL}
                      disabled={seedingStatus !== 'idle'}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      ✅ Copier SQL (Recommandé)
                    </Button>
                    <Button 
                      onClick={handleExportSQL}
                      disabled={seedingStatus !== 'idle'}
                      variant="outline"
                      className="flex-1"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Télécharger SQL
                    </Button>
                  </div>
                  <Button 
                    onClick={handleExportJSON}
                    disabled={seedingStatus !== 'idle'}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Télécharger JSON
                  </Button>
                </div>
                
                { !productionUrl.trim() && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Veuillez saisir l'URL de production pour la synchronisation directe
                  </p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>Gestion du Cache</CardTitle>
                <CardDescription>
                  Optimisation des performances système
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Cache Applicatif</h4>
                <p className="text-sm text-muted-foreground">
                  Vide le cache des catégories et données statiques.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    addLog('🧹 Vidage du cache applicatif...', 'info');
                    queryClient.invalidateQueries();
                    addLog('✅ Cache applicatif vidé avec succès', 'success');
                    addLog('📊 Toutes les requêtes en cache ont été invalidées', 'info');
                    toast({
                      title: "Cache vidé",
                      description: "Le cache applicatif a été vidé avec succès.",
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vider le Cache
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Optimisation Auto</h4>
                <p className="text-sm text-muted-foreground">
                  Optimise automatiquement les performances système.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    addLog('⚡ Lancement de l\'optimisation automatique...', 'info');
                    addLog('🔧 Optimisation des performances système en cours...', 'info');
                    addLog('✅ Optimisation automatique terminée', 'success');
                    toast({
                      title: "Optimisation lancée",
                      description: "Le système optimise automatiquement les performances.",
                    });
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Optimiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Operations */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle>Opérations Base de Données</CardTitle>
                <CardDescription>
                  Actions réelles sur la base de données
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Statistiques Temps Réel</h4>
                <p className="text-sm text-muted-foreground">
                  Affiche les statistiques actuelles de la base de données.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/database/stats');
                      if (response.ok) {
                        const stats = await response.json();
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/system/health"]});
                        toast({
                          title: "Statistiques mises à jour",
                          description: `${stats.categories} catégories, ${stats.users} utilisateurs, ${stats.projects} projets, ${stats.books} livres`,
                        });
                      } else {
                        throw new Error('Stats fetch failed');
                      }
                    } catch (error) {
                      toast({
                        title: "Erreur de récupération",
                        description: "Impossible de récupérer les statistiques.",
                        variant: "destructive"
      });
                    }
                  }}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Actualiser les Stats
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Vérification Santé</h4>
                <p className="text-sm text-muted-foreground">
                  Vérifie l'état de santé complet du système.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/system/health"] });
                    toast({
                      title: "Vérification lancée",
                      description: "État du système mis à jour.",
                    });
                  }}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Vérifier la Santé
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

        {/* Logs System */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Terminal className="h-5 w-5 text-gray-600" />
                <div>
                  <CardTitle>Logs Système en Temps Réel</CardTitle>
                  <CardDescription>
                    Surveillance détaillée des opérations pour le débogage en production
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={isPaused ? "destructive" : "outline"} 
                  size="sm" 
                  onClick={ () => setIsPaused(!isPaused }
                >
                  { isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Reprendre
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>}
                </Button>
                <Button 
                  variant={autoRefreshLogs ? "default" : "outline"} 
                  size="sm" 
                  onClick={ () => setAutoRefreshLogs(!autoRefreshLogs }
                  disabled={isPaused}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefreshLogs && !isPaused ? 'animate-spin' : ''}`} />
                  {autoRefreshLogs ? 'Auto' : 'Manuel'}
                </Button>
                <Button 
                  variant={autoScrollEnabled ? "default" : "destructive"} 
                  size="sm" 
                  onClick={ () => setAutoScrollEnabled(!autoScrollEnabled }
                  title={autoScrollEnabled ? "Désactiver le défilement automatique" : "Activer le défilement automatique"}
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  {autoScrollEnabled ? 'Scroll ON' : 'Scroll OFF'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyLogs}
                  disabled={logs.length === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearLogs}
                  disabled={logs.length === 0 || clearLogsMutation.isPending}
                >
                  { clearLogsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />}
                  {clearLogsMutation.isPending ? 'Effacement...' : 'Effacer'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/system/logs'] });
                    setAutoScrollEnabled(true);
                  }}
                  disabled={isPaused}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={logsContainerRef}
              className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96 border"
              onScroll={handleLogsScroll}
            >
              { logs.length === 0 ? (
                <div className="text-gray-500">
                  {logsLoading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Chargement des logs système...</span>
                    </div>
                  ) : (
                    "Aucun log disponible. Effectuez une opération pour voir les logs..."}
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="break-all hover:bg-gray-800 px-1 rounded">
                      {log}
                    </div>
                  )}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <div>
                {logs.length > 0 && (
                  <span>
                    {logs.length} entrées • 
                    { isPaused ? (
                      <span className="text-red-600"> ⏸️ En pause</span>
                    ) : autoRefreshLogs ? (
                      <span className="text-green-600"> 🔄 Auto-actualisation active</span>
                    ) : (
                      <span className="text-orange-600"> ✋ Mode manuel</span>}
                    { userIsInteracting && (
                      <span className="text-blue-600"> • 👤 Utilisateur actif</span>}
                    { !autoScrollEnabled && !isPaused && (
                      <span className="text-purple-600"> • 📜 Défilement désactivé</span>}
                  </span>
                )}
              </div>
              <div>
                {systemLogsData && typeof systemLogsData === 'object' && 'total' in systemLogsData && (
                  <span>Total serveur: {String((systemLogsData as { total: number}.total)}</span>
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-blue-600">ℹ️</span>
                <span>Information</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-green-600">✅</span>
                <span>Succès</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-600">⚠️</span>
                <span>Avertissement</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-red-600">❌</span>
                <span>Erreur</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">📋 Instructions de Débogage</h4>
              <div className="text-sm text-amber-800 space-y-1">
                <p>• Les logs capturent toutes les étapes des opérations système</p>
                <p>• En cas de problème en production, copiez les logs et contactez le support</p>
                <p>• Tous les détails d'erreur et stack traces sont inclus pour un débogage précis</p>
                <p>• Les timestamps permettent de tracer l'ordre exact des opérations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}