import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Play, Pause, RefreshCw, Calendar, AlertCircle, CheckCircle, Settings, Power } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'running' | 'stopped' | 'error' | 'completed';
  intervalHours?: number;
  runCount?: number;
  lastError?: string;
}

// Helper function to format interval display
const formatInterval = (hours: number): string => {
  if (hours >= 24 * 30) {
    return `${Math.round(hours / (24 * 30))} mois`;
  } else if (hours >= 24) {
    return `${Math.round(hours / 24)} jour${Math.round(hours / 24) > 1 ? 's' : ''}`;
  } else if (hours >= 1) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    const minutes = Math.round(hours * 60);
    if (minutes >= 1) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const seconds = Math.round(hours * 3600);
      return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }
  }
};

// Nouvelle interface simplifiée pour l'intervalle
function IntervalDisplay({ job, onUpdate }: {
  job: CronJob;
  onUpdate: (hours: number) => void;
}) {
  const intervals = [
    { label: '30 secondes', hours: 30 / 3600 },
    { label: '1 minute', hours: 1 / 60 },
    { label: '5 minutes', hours: 5 / 60 },
    { label: '15 minutes', hours: 15 / 60 },
    { label: '30 minutes', hours: 0.5 },
    { label: '1 heure', hours: 1 },
    { label: '2 heures', hours: 2 },
    { label: '6 heures', hours: 6 },
    { label: '12 heures', hours: 12 },
    { label: '1 jour', hours: 24 },
    { label: '3 jours', hours: 72 },
    { label: '1 semaine', hours: 168 },
    { label: '1 mois', hours: 720 }
  ];

  const currentInterval = intervals.find(interval => 
    Math.abs(interval.hours - (job.intervalHours || 24)) < 0.01
  );

  return (
    <div className="space-y-2">
      <span className="text-muted-foreground text-xs">Intervalle:</span>
      <Select 
        value={currentInterval?.hours.toString() || '24'}
        onValueChange={(value) => {
          const hours = parseFloat(value);
          onUpdate(hours);
        }}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Choisir..." />
        </SelectTrigger>
        <SelectContent>
          {intervals.map((interval) => (
            <SelectItem key={interval.hours} value={interval.hours.toString()}>
              {interval.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function AdminCron() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les tâches cron
  const { data: cronJobs, isLoading } = useQuery({
    queryKey: ["/api/admin/cron/jobs"],
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  // Récupérer les logs cron
  const { data: cronLogs } = useQuery({
    queryKey: ["/api/admin/cron/logs"],
    refetchInterval: 10000, // Actualiser toutes les 10 secondes
  });

  // Toggle cron job
  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, enabled }: { jobId: string; enabled: boolean }) => {
      return apiRequest(`/api/admin/cron/jobs/${jobId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Tâche Cron Mise à Jour",
        description: "La tâche planifiée a été mise à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour de la tâche planifiée.",
        variant: "destructive",
      });
    },
  });

  // Update job configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ jobId, intervalHours }: { jobId: string; intervalHours: number }) => {
      return apiRequest(`/api/admin/cron/jobs/${jobId}/config`, {
        method: 'POST',
        body: JSON.stringify({ intervalHours }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Mise à Jour",
        description: "La planification de la tâche a été mise à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
      setEditingJob(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour de la configuration de la tâche.",
        variant: "destructive",
      });
    },
  });

  // Run job manually
  const runJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest(`/api/admin/cron/jobs/${jobId}/run`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Tâche Démarrée",
        description: "La tâche planifiée a été démarrée manuellement.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/logs"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec du démarrage de la tâche planifiée.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) {
      return <Badge variant="destructive" className="bg-red-500 text-white">Désactivé</Badge>;
    }
    
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500 text-white">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-600 text-white">Actif</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Arrêté</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tâches Planifiées & Cron Jobs</h1>
            <p className="text-muted-foreground">
              Gérer et surveiller les tâches automatisées en arrière-plan
            </p>
          </div>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
              queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/logs"] });
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Cron Jobs Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tâches Planifiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-8 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : cronJobs && Array.isArray(cronJobs) && cronJobs.length > 0 ? (
                <div className="space-y-4">
                  {cronJobs.map((job: CronJob) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h3 className="font-semibold">{job.name}</h3>
                            <p className="text-sm text-muted-foreground">{job.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status, job.enabled)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runJobMutation.mutate(job.id)}
                            disabled={runJobMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            {runJobMutation.isPending ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            Exécuter maintenant
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <IntervalDisplay 
                          job={job}
                          onUpdate={(intervalHours) => {
                            updateConfigMutation.mutate({
                              jobId: job.id,
                              intervalHours
                            });
                          }}
                        />
                        <div>
                          <span className="text-muted-foreground">État:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Switch
                              checked={job.enabled}
                              onCheckedChange={(enabled) => toggleJobMutation.mutate({
                                jobId: job.id,
                                enabled
                              })}
                            />
                            {job.enabled ? (
                              <div className="flex items-center gap-1">
                                <Power className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">Actif</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Power className="h-3 w-3 text-red-500" />
                                <span className="text-xs text-red-600">Désactivé</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dernière exécution:</span>
                          <p className="text-xs">{job.lastRun ? new Date(job.lastRun).toLocaleString('fr-FR') : 'Jamais'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prochaine exécution:</span>
                          <p className="text-xs">{job.nextRun ? new Date(job.nextRun).toLocaleString('fr-FR') : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exécutions:</span>
                          <p className="text-xs">{job.runCount || 0} fois</p>
                          {job.lastError && (
                            <p className="text-xs text-red-500 mt-1" title={job.lastError}>
                              Dernière erreur: {job.lastError.substring(0, 30)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune Tâche Planifiée</h3>
                  <p className="text-muted-foreground">
                    Aucune tâche cron n'est actuellement configurée.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs Récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Journaux d'Activité Récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cronLogs && Array.isArray(cronLogs) && cronLogs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cronLogs.map((log: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {log.level === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{log.job}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun Journal d'Activité</h3>
                  <p className="text-muted-foreground">
                    Aucune activité de tâche cron n'a encore été enregistrée.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}