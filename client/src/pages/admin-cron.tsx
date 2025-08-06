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

// Conversion functions for time units
const convertHoursToUnit = (hours: number): { value: number; unit: string } => {
  if (hours >= 24 * 30) {
    return { value: Math.round(hours / (24 * 30)), unit: 'mois' };
  } else if (hours >= 24) {
    return { value: Math.round(hours / 24), unit: 'jours' };
  } else if (hours >= 1) {
    return { value: hours, unit: 'heures' };
  } else {
    const minutes = Math.round(hours * 60);
    if (minutes >= 1) {
      return { value: minutes, unit: 'minutes' };
    } else {
      return { value: Math.round(hours * 3600), unit: 'secondes' };
    }
  }
};

const convertUnitToHours = (value: number, unit: string): number => {
  switch (unit) {
    case 'mois': return value * 24 * 30;
    case 'jours': return value * 24;
    case 'heures': return value;
    case 'minutes': return value / 60;
    case 'secondes': return value / 3600;
    default: return value;
  }
};

// Component for editing interval
function IntervalEditor({ job, onUpdate, onCancel }: {
  job: CronJob;
  onUpdate: (hours: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(() => {
    const converted = convertHoursToUnit(job.intervalHours || 24);
    return converted.value;
  });
  const [unit, setUnit] = useState(() => {
    return convertHoursToUnit(job.intervalHours || 24).unit;
  });

  const handleUpdate = () => {
    const hours = convertUnitToHours(value, unit);
    onUpdate(hours);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="1"
        max="999"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value) || 1)}
        className="w-16 h-8 text-xs"
      />
      <Select value={unit} onValueChange={setUnit}>
        <SelectTrigger className="w-20 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="secondes">sec</SelectItem>
          <SelectItem value="minutes">min</SelectItem>
          <SelectItem value="heures">h</SelectItem>
          <SelectItem value="jours">j</SelectItem>
          <SelectItem value="mois">mois</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpdate}
        className="h-8 px-2 text-xs"
      >
        ✓
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="h-8 px-2 text-xs"
      >
        ✕
      </Button>
    </div>
  );
}

export default function AdminCron() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<string | null>(null);

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
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Exécuter maintenant
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Intervalle:</span>
                          <div className="flex items-center gap-2 mt-1">
                            {editingJob === job.id ? (
                              <IntervalEditor 
                                job={job}
                                onUpdate={(intervalHours) => {
                                  updateConfigMutation.mutate({
                                    jobId: job.id,
                                    intervalHours
                                  });
                                }}
                                onCancel={() => setEditingJob(null)}
                              />
                            ) : (
                              <div 
                                className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-100"
                                onClick={() => setEditingJob(job.id)}
                              >
                                <span className="text-xs">
                                  {(() => {
                                    const converted = convertHoursToUnit(job.intervalHours || 24);
                                    return `${converted.value} ${converted.unit}`;
                                  })()}
                                </span>
                                <Settings className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
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