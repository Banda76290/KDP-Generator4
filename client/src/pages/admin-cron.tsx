import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Play, Pause, RefreshCw, Calendar, AlertCircle, CheckCircle, Settings } from "lucide-react";
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

export default function AdminCron() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cron jobs
  const { data: cronJobs, isLoading } = useQuery({
    queryKey: ["/api/admin/cron/jobs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch cron logs
  const { data: cronLogs } = useQuery({
    queryKey: ["/api/admin/cron/logs"],
    refetchInterval: 10000, // Refresh every 10 seconds
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
        title: "Cron Job Updated",
        description: "The scheduled task has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the scheduled task.",
        variant: "destructive",
      });
    },
  });

  // Update job configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ jobId, intervalHours }: { jobId: string; intervalHours: number }) => {
      return apiRequest(`/api/admin/cron/jobs/${jobId}/config`, {
        method: 'POST',
        body: { intervalHours }
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "The job schedule has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job configuration.",
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
        title: "Job Started",
        description: "The scheduled task has been started manually.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cron/logs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start the scheduled task.",
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
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Stopped</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Scheduled Tasks & Cron Jobs</h1>
            <p className="text-muted-foreground">
              Manage and monitor automated background tasks
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
            Refresh
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Cron Jobs Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Tasks
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
                            Run Now
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Interval:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              min="1"
                              max="168"
                              value={job.intervalHours || 24}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value);
                                if (hours >= 1 && hours <= 168) {
                                  updateConfigMutation.mutate({
                                    jobId: job.id,
                                    intervalHours: hours
                                  });
                                }
                              }}
                              className="w-16 h-8 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">hours</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Enabled:</span>
                          <div className="mt-1">
                            <Switch
                              checked={job.enabled}
                              onCheckedChange={(enabled) => toggleJobMutation.mutate({
                                jobId: job.id,
                                enabled
                              })}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Run:</span>
                          <p className="text-xs">{job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Run:</span>
                          <p className="text-xs">{job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Runs:</span>
                          <p className="text-xs">{job.runCount || 0} times</p>
                          {job.lastError && (
                            <p className="text-xs text-red-500 mt-1" title={job.lastError}>
                              Last error: {job.lastError.substring(0, 30)}...
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
                  <h3 className="text-lg font-semibold mb-2">No Scheduled Tasks</h3>
                  <p className="text-muted-foreground">
                    No cron jobs are currently configured.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Activity Logs
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
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity logs available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}