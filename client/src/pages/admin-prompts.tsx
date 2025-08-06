import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAdmin } from "@/hooks/useAdmin";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Bot, 
  MessageSquare, 
  RefreshCw,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { AiPromptTemplate, InsertAiPromptTemplate } from "@shared/schema";

interface PromptFormData {
  type: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
}

export default function AdminPrompts() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AiPromptTemplate | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    type: "",
    name: "",
    systemPrompt: "",
    userPromptTemplate: "",
    isActive: true
  });

  // Fetch prompts
  const { data: prompts = [], isLoading } = useQuery<AiPromptTemplate[]>({
    queryKey: ['/api/admin/prompts'],
    enabled: isAdmin,
  });

  // Create prompt mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertAiPromptTemplate) => 
      apiRequest('/api/admin/prompts', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Prompt créé",
        description: "Le template de prompt a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le prompt",
        variant: "destructive",
      });
    }
  });

  // Update prompt mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AiPromptTemplate> }) => 
      apiRequest(`/api/admin/prompts/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      setIsDialogOpen(false);
      setEditingPrompt(null);
      resetForm();
      toast({
        title: "Prompt mis à jour",
        description: "Le template de prompt a été modifié avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de modification",
        description: error.message || "Impossible de modifier le prompt",
        variant: "destructive",
      });
    }
  });

  // Delete prompt mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/admin/prompts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      toast({
        title: "Prompt supprimé",
        description: "Le template de prompt a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer le prompt",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      type: "",
      name: "",
      systemPrompt: "",
      userPromptTemplate: "",
      isActive: true
    });
  };

  const handleEdit = (prompt: AiPromptTemplate) => {
    setEditingPrompt(prompt);
    setFormData({
      type: prompt.type,
      name: prompt.name,
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      isActive: prompt.isActive ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.type || !formData.name || !formData.systemPrompt || !formData.userPromptTemplate) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (editingPrompt) {
      updateMutation.mutate({ 
        id: editingPrompt.id, 
        data: formData 
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      keywords: "bg-blue-100 text-blue-800",
      categories: "bg-green-100 text-green-800",
      title: "bg-purple-100 text-purple-800",
      description: "bg-orange-100 text-orange-800",
      marketing: "bg-pink-100 text-pink-800",
      pricing: "bg-yellow-100 text-yellow-800",
      structure: "bg-indigo-100 text-indigo-800",
      chapters: "bg-teal-100 text-teal-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h2>
            <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Prompts IA</h1>
            <p className="text-muted-foreground">
              Configurez les templates de prompts pour les recommandations IA
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Intégration automatique :</strong> Les prompts créés ici apparaissent automatiquement dans la page "AI Functions" et sont utilisés par le système de génération IA.
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingPrompt(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPrompt ? "Modifier le prompt" : "Créer un nouveau prompt"}
                </DialogTitle>
                <DialogDescription>
                  Configurez les prompts système et utilisateur pour les recommandations IA.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type *</label>
                    <Input
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="ex: keywords, title, description..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nom *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nom du template"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prompt Système *</label>
                  <Textarea
                    rows={4}
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    placeholder="Définit le rôle et le comportement de l'IA..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Template Prompt Utilisateur *</label>
                  <Textarea
                    rows={6}
                    value={formData.userPromptTemplate}
                    onChange={(e) => setFormData({ ...formData, userPromptTemplate: e.target.value })}
                    placeholder="Template avec variables {bookContext}, {bookTitle}, etc..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variables disponibles: {"{bookContext}"}, {"{bookTitle}"}, {"{type}"}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Prompt actif
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPrompt(null);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingPrompt ? "Modifier" : "Créer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4">
            {prompts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun prompt configuré</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre premier template de prompt pour les recommandations IA.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un prompt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              prompts.map((prompt: AiPromptTemplate) => (
                <Card key={prompt.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{prompt.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {prompt.description || "Aucune description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTypeColor(prompt.type)}>
                          {prompt.type}
                        </Badge>
                        <Badge variant={prompt.isActive ? "default" : "secondary"}>
                          {prompt.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Prompt Système
                        </h4>
                        <p className="text-sm bg-gray-50 p-3 rounded-md line-clamp-3">
                          {prompt.systemPrompt}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Template Utilisateur
                        </h4>
                        <p className="text-sm bg-gray-50 p-3 rounded-md line-clamp-3">
                          {prompt.userPromptTemplate}
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prompt)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le prompt "{prompt.name}" ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(prompt.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}