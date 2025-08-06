import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PromptTemplateModal from "@/components/admin/PromptTemplateModal";
import ModelConfigModal from "@/components/admin/ModelConfigModal";
import UsageLimitModal from "@/components/admin/UsageLimitModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Settings, 
  DollarSign, 
  Zap, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface Variable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface AIPromptTemplate {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  isDefault: boolean;
  variables?: Variable[];
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  maxTokens: number;
  contextWindow: number;
  isAvailable: boolean;
}

interface AIUsageLimit {
  id: string;
  subscriptionTier: string;
  monthlyTokenLimit: number | null;
  dailyRequestLimit: number | null;
  maxTokensPerRequest: number;
  allowedModels: string[];
}

export default function AIConfig() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("prompts");
  const [editingPrompt, setEditingPrompt] = useState<AIPromptTemplate | null>(null);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [editingLimit, setEditingLimit] = useState<AIUsageLimit | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && (user as any)?.role !== "admin" && (user as any)?.role !== "superadmin") {
      toast({
        title: "Access Denied",
        description: "You need administrator privileges to access this page.",
        variant: "destructive"
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch AI configuration data
  const { data: promptTemplates, isLoading: promptsLoading } = useQuery({
    queryKey: ["/api/admin/ai/prompts"],
    enabled: isAuthenticated && ((user as any)?.role === "admin" || (user as any)?.role === "superadmin"),
  });

  const { data: aiModels, isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/admin/ai/models"],
    enabled: isAuthenticated && ((user as any)?.role === "admin" || (user as any)?.role === "superadmin"),
  });

  const { data: usageLimits, isLoading: limitsLoading } = useQuery({
    queryKey: ["/api/admin/ai/limits"],
    enabled: isAuthenticated && ((user as any)?.role === "admin" || (user as any)?.role === "superadmin"),
  });

  const { data: aiStats } = useQuery({
    queryKey: ["/api/admin/ai/stats"],
    enabled: isAuthenticated && ((user as any)?.role === "admin" || (user as any)?.role === "superadmin"),
  });

  // Mutations for CRUD operations
  const savePromptMutation = useMutation({
    mutationFn: async (data: Partial<AIPromptTemplate>) => {
      const method = data.id ? "PUT" : "POST";
      const url = data.id ? `/api/admin/ai/prompts/${data.id}` : "/api/admin/ai/prompts";
      return await apiRequest(url, { method, body: JSON.stringify(data});
    });
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/prompts"]});
      setEditingPrompt(null);
      toast({ title: "Success", description: "Prompt template saved successfully" });
    });
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Error", description: "Failed to save prompt template", variant: "destructive" });
    });
  });

  const saveModelMutation = useMutation({
    mutationFn: async (data: Partial<AIModel>) => {
      const method = data.id ? "PUT" : "POST";
      const url = data.id ? `/api/admin/ai/models/${data.id}` : "/api/admin/ai/models";
      return await apiRequest(url, { method, body: JSON.stringify(data});
    });
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/models"]});
      setEditingModel(null);
      toast({ title: "Success", description: "AI model saved successfully" });
    });
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Error", description: "Failed to save AI model", variant: "destructive" });
    });
  });

  const saveLimitMutation = useMutation({
    mutationFn: async (data: Partial<AIUsageLimit>) => {
      const method = data.id ? "PUT" : "POST";
      const url = data.id ? `/api/admin/ai/limits/${data.id}` : "/api/admin/ai/limits";
      return await apiRequest(url, { method, body: JSON.stringify(data});
    });
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/limits"]});
      setEditingLimit(null);
      toast({ title: "Success", description: "Usage limit saved successfully" });
    });
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Error", description: "Failed to save usage limit", variant: "destructive" });
    });
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/ai/prompts/${id}`, { method: "DELETE" });
    });
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/prompts"]});
      toast({ title: "Success", description: "Prompt template deleted successfully" });
    });
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "superadmin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 md:ml-64">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
                <p className="text-gray-600">Gérer les prompts IA, modèles et limites d'usage</p>
              </div>
            </div>

            {/* AI Usage Overview */}
            {aiStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Tokens Used</p>
                        <p className="text-lg font-semibold">{aiStats.totalTokensUsed?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="text-lg font-semibold">${aiStats.totalCost?.toFixed(2) || "0.00"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Requests</p>
                        <p className="text-lg font-semibold">{aiStats.monthlyRequests || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Templates</p>
                        <p className="text-lg font-semibold">{promptTemplates?.filter((t: any) => t.isActive).length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompts">Fonctionnalités IA</TabsTrigger>
              <TabsTrigger value="models">Modèles IA</TabsTrigger>
              <TabsTrigger value="limits">Limites d'Usage</TabsTrigger>
            </TabsList>

            {/* Prompt Templates Tab */}
            <TabsContent value="prompts" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Fonctionnalités IA Configurables</CardTitle>
                    <Button onClick={() => setEditingPrompt({)} as AIPromptTemplate)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Fonctionnalité
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {promptsLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : (
                      (promptTemplates as any)?.map((template: any) => (
                        <div key={template.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{template.name}</h3>
                                <Badge variant={template.isActive ? "default" : "secondary"}>
                                  {template.isActive ? "Actif" : "Inactif"}
                                </Badge>
                                { template.isDefault && (
                                  <Badge variant="outline">Par défaut</Badge>}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">Type: {template.type}</p>
                              <p className="text-sm text-gray-600 mb-2">Modèle: {template.model}</p>
                              <div className="text-xs text-gray-500">
                                Max Tokens: {template.maxTokens} | Température: {template.temperature}
                                {template.variables && template.variables.length > 0 && (
                                  <span className="ml-2">| Variables: {template.variables.length}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={ () => setEditingPrompt(template }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={ () => deletePromptMutation.mutate(template.id }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Models Tab */}
            <TabsContent value="models" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>AI Models Configuration</CardTitle>
                    <Button onClick={() => setEditingModel({)} as AIModel)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Model
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelsLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : (
                      (aiModels as any)?.map((model: any) => (
                        <div key={model.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{model.displayName}</h3>
                                <Badge variant={model.isAvailable ? "default" : "secondary"}>
                                  {model.isAvailable ? "Disponible" : "Désactivé"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">Provider: {model.provider}</p>
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div>Input: ${model.inputPricePer1kTokens}/1k tokens</div>
                                <div>Output: ${model.outputPricePer1kTokens}/1k tokens</div>
                                <div>Max Tokens: {model.maxTokens}</div>
                                <div>Context Window: {model.contextWindow}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={ () => setEditingModel(model }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Limits Tab */}
            <TabsContent value="limits" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Usage Limits by Subscription Tier</CardTitle>
                    <Button onClick={() => setEditingLimit({)} as AIUsageLimit)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Limit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {limitsLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : (
                      (usageLimits as any)?.map((limit: any) => (
                        <div key={limit.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium capitalize mb-2">{limit.subscriptionTier} Tier</h3>
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <p className="font-medium">Monthly Tokens</p>
                                  <p>{limit.monthlyTokenLimit?.toLocaleString() || "Unlimited"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Daily Requests</p>
                                  <p>{limit.dailyRequestLimit || "Unlimited"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Max Tokens/Request</p>
                                  <p>{limit.maxTokensPerRequest}</p>
                                </div>
                              </div>
                              {limit.allowedModels && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-600">Allowed Models:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {limit.allowedModels.map((model: string) => (
                                      <Badge key={model} variant="outline" className="text-xs">
                                        {model}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={ () => setEditingLimit(limit }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modals de Configuration */}
          {editingPrompt && (
            <PromptTemplateModal
              template={editingPrompt}
              onSave={savePromptMutation.mutate}
              onClose={ () => setEditingPrompt(null}
              isLoading={savePromptMutation.isPending}
            />
          )}

          {editingModel && (
            <ModelConfigModal
              model={editingModel}
              onSave={saveModelMutation.mutate}
              onClose={ () => setEditingModel(null}
              isLoading={saveModelMutation.isPending}
            />
          )}

          {editingLimit && (
            <UsageLimitModal
              limit={editingLimit}
              onSave={ (data) => saveLimitMutation.mutate(data}
              onClose={ () => setEditingLimit(null}
              isLoading={saveLimitMutation.isPending}
            />
          ))}
        </main>
      </div>
    </div>
  );
}