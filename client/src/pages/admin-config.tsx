import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Settings, Save, Plus } from "lucide-react";

interface SystemConfig {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export default function AdminConfig() {
  const { isAdmin, isLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newConfig, setNewConfig] = useState({
    key: "",
    value: "",
    description: "",
  });

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

  const { data: config, isLoading: configLoading } = useQuery<SystemConfig[]>({
    queryKey: ["/api/admin/config"],
    enabled: isAdmin,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (configData: { key: string; value: string; description?: string }) => {
      return await apiRequest("/api/admin/config", { method: "PUT", body: configData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast.success({
        title: "Succès",
        description: "Configuration mise à jour avec succès.",
      });
      setNewConfig({ key: "", value: "", description: "" });
    },
    onError: (error: Error) => {
      toast.error({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la configuration.",
      });
    },
  });

  const handleAddConfig = () => {
    if (!newConfig.key || !newConfig.value) {
      toast.error({
        title: "Erreur",
        description: "La clé et la valeur sont obligatoires.",
      });
      return;
    }

    updateConfigMutation.mutate(newConfig);
  };

  const commonConfigs = [
    {
      key: "platform_name",
      label: "Nom de la plateforme",
      description: "Le nom affiché de la plateforme",
      defaultValue: "KDP Generator",
    },
    {
      key: "support_email",
      label: "Email de support",
      description: "Adresse email pour le support client",
      defaultValue: "support@kdpgenerator.com",
    },
    {
      key: "max_ai_requests_per_day",
      label: "Requêtes IA max par jour",
      description: "Nombre maximum de requêtes IA par utilisateur par jour",
      defaultValue: "10",
    },
    {
      key: "free_tier_project_limit",
      label: "Limite projets gratuits",
      description: "Nombre maximum de projets pour les comptes gratuits",
      defaultValue: "3",
    },
    {
      key: "maintenance_mode",
      label: "Mode maintenance",
      description: "Activer le mode maintenance",
      defaultValue: "false",
    },
  ];

  if (isLoading || configLoading) {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configuration Système</h1>
          <p className="text-muted-foreground">
            Gestion des paramètres de la plateforme
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter une Configuration
            </CardTitle>
            <CardDescription>
              Créer ou modifier un paramètre système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config-key">Clé de configuration</Label>
              <Input
                id="config-key"
                value={newConfig.key}
                onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                placeholder="ex: platform_name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-value">Valeur</Label>
              <Input
                id="config-value"
                value={newConfig.value}
                onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                placeholder="ex: KDP Generator"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-description">Description (optionnel)</Label>
              <Textarea
                id="config-description"
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="Description du paramètre"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleAddConfig}
              disabled={updateConfigMutation.isPending}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateConfigMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        {/* Common Configurations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurations Courantes
            </CardTitle>
            <CardDescription>
              Paramètres système fréquemment utilisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commonConfigs.map((configItem) => {
                const existingConfig = config?.find(c => c.key === configItem.key);
                return (
                  <div key={configItem.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{configItem.label}</div>
                      <div className="text-sm text-muted-foreground">{configItem.description}</div>
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {configItem.key}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewConfig({
                        key: configItem.key,
                        value: existingConfig?.value || configItem.defaultValue,
                        description: configItem.description,
                      })}
                    >
                      {existingConfig ? "Modifier" : "Ajouter"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Actuelle</CardTitle>
          <CardDescription>
            Paramètres système actuellement configurés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config && config.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Dernière modification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.map((configItem) => (
                    <TableRow key={configItem.key}>
                      <TableCell className="font-mono text-sm">{configItem.key}</TableCell>
                      <TableCell className="max-w-xs truncate">{configItem.value}</TableCell>
                      <TableCell className="max-w-xs truncate">{configItem.description || "-"}</TableCell>
                      <TableCell>
                        {new Date(configItem.updatedAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewConfig({
                            key: configItem.key,
                            value: configItem.value,
                            description: configItem.description || "",
                          })}
                        >
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune configuration système trouvée. Ajoutez votre première configuration ci-dessus.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}