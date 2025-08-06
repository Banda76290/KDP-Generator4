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

// Interface avec dropdowns séparés pour chaque unité de temps
function IntervalSelector({ job, onUpdate }: {
  job: CronJob;
  onUpdate: (hours: number) => void;
}) {
  const totalHours = job.intervalHours || 24;
  
  // Calculer les valeurs actuelles
  const months = Math.floor(totalHours / (24 * 30));
  const remainingAfterMonths = totalHours % (24 * 30);
  const days = Math.floor(remainingAfterMonths / 24);
  const remainingAfterDays = remainingAfterMonths % 24;
  const hours = Math.floor(remainingAfterDays);
  const remainingAfterHours = remainingAfterDays % 1;
  const minutes = Math.floor(remainingAfterHours * 60);
  const seconds = Math.round((remainingAfterHours * 60 - minutes) * 60);

  const [selectedMonths, setSelectedMonths] = useState(months);
  const [selectedDays, setSelectedDays] = useState(days);
  const [selectedHours, setSelectedHours] = useState(hours);
  const [selectedMinutes, setSelectedMinutes] = useState(minutes);
  const [selectedSeconds, setSelectedSeconds] = useState(seconds);

  const handleUpdate = () => {
    const totalHours = selectedMonths * 24 * 30 + 
                      selectedDays * 24 + 
                      selectedHours + 
                      selectedMinutes / 60 + 
                      selectedSeconds / 3600;
    
    console.log('Calculated total hours:', totalHours);
    console.log('Selected values:', { selectedMonths, selectedDays, selectedHours, selectedMinutes, selectedSeconds });
    
    if (totalHours > 0) {
      // Arrondir à 2 décimales pour éviter les problèmes de précision
      const roundedHours = Math.round(totalHours * 100) / 100;
      console.log('Rounded hours:', roundedHours);
      onUpdate(roundedHours);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-muted-foreground text-xs">Intervalle:</span>
      <div className="grid grid-cols-5 gap-1">
        {/* Mois */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Mois</label>
          <Select value={selectedMonths.toString()} onValueChange={(value) => setSelectedMonths(parseInt(value))}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 13}, (_, i) => (
                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jours */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Jours</label>
          <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(parseInt(value))}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 31}, (_, i) => (
                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Heures */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Heures</label>
          <Select value={selectedHours.toString()} onValueChange={(value) => setSelectedHours(parseInt(value))}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 24}, (_, i) => (
                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minutes */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Min</label>
          <Select value={selectedMinutes.toString()} onValueChange={(value) => setSelectedMinutes(parseInt(value))}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 60}, (_, i) => (
                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Secondes */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sec</label>
          <Select value={selectedSeconds.toString()} onValueChange={(value) => setSelectedSeconds(parseInt(value))}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 60}, (_, i) => (
                <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleUpdate}
        className="w-full h-7 text-xs"
        disabled={selectedMonths === 0 && selectedDays === 0 && selectedHours === 0 && selectedMinutes === 0 && selectedSeconds === 0}
      >
        Appliquer l'intervalle
      </Button>
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
        body: { enabled }
      });
    },
    onSuccess: () => {
      toast({
        title: "Tâche Cron Mise à Jour",
        description: "La tâche planifiée a été mise à jour avec succès.",
        variant: "success",
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
      console.log('Updating cron config:', { jobId, intervalHours });
      return apiRequest(`/api/admin/cron/jobs/${jobId}/config`, {
        method: 'POST',
        body: { intervalHours }
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Mise à Jour",
        description: "La planification de la tâche a été mise à jour avec succès.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });

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
        variant: "success",
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
                      
                      <div className="space-y-4">
                        <IntervalSelector 
                          job={job}
                          onUpdate={(intervalHours) => {
                            updateConfigMutation.mutate({
                              jobId: job.id,
                              intervalHours
                            });
                          }}
                        />
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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