import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAdmin } from "@/hooks/useAdmin";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Wand2, 
  Settings, 
  Copy,
  Download,
  RefreshCw,
  BookOpen,
  MessageSquare,
  Target,
  Lightbulb
} from "lucide-react";

interface DatabaseField {
  table: string;
  field: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  description: string;
  options?: string[];
}

interface AIFunction {
  type: string;
  name: string;
  description: string;
}

export default function AIFunctions() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState("functions");
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Check authentication and admin access
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    if (!isLoading && isAuthenticated && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Cette page est réservée aux administrateurs",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

  // Fetch available AI functions
  const { data: aiFunctions, isLoading: functionsLoading } = useQuery({
    queryKey: ["/api/ai/functions"],
    enabled: isAuthenticated,
  });

  // Fetch database fields
  const { data: databaseFields, isLoading: fieldsLoading } = useQuery({
    queryKey: ["/api/ai/database-fields"],
    enabled: isAuthenticated,
  });

  // Fetch user projects and books
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const { data: books } = useQuery({
    queryKey: ["/api/books"],
    enabled: isAuthenticated,
  });

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: {
      functionType: string;
      context: { bookId?: string; projectId?: string; userId?: string };
      customPrompt?: string;
      customModel?: string;
    }) => {
      return await apiRequest("POST", "/api/ai/generate-configured", data);
    },
    onSuccess: (result) => {
      setGeneratedContent(result.content);
      setActiveTab("results");
      toast({ 
        title: "Contenu généré avec succès", 
        description: `Coût: $${result.cost.toFixed(4)} | Tokens: ${result.tokensUsed}` 
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({ 
        title: "Erreur de génération", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Fetch field values for preview
  const previewMutation = useMutation({
    mutationFn: async (context: { bookId?: string; projectId?: string }) => {
      return await apiRequest("POST", "/api/ai/field-values", { context });
    },
    onSuccess: (values) => {
      setPreviewValues(values);
    },
  });

  // Handle context change
  const handleContextChange = (field: string, value: string) => {
    if (field === 'book') {
      const bookId = value === 'none' ? '' : value;
      setSelectedBook(bookId);
      const context = { bookId: bookId || undefined, projectId: selectedProject || undefined };
      if (bookId || selectedProject) {
        previewMutation.mutate(context);
      }
    } else if (field === 'project') {
      const projectId = value === 'none' ? '' : value;
      setSelectedProject(projectId);
      const context = { bookId: selectedBook || undefined, projectId: projectId || undefined };
      if (selectedBook || projectId) {
        previewMutation.mutate(context);
      }
    }
  };

  // Handle generation
  const handleGenerate = () => {
    if (!selectedFunction) {
      toast({
        title: "Fonction requise",
        description: "Veuillez sélectionner une fonction IA",
        variant: "destructive"
      });
      return;
    }

    generateMutation.mutate({
      functionType: selectedFunction,
      context: {
        bookId: selectedBook || undefined,
        projectId: selectedProject || undefined
      },
      customPrompt: customPrompt || undefined,
      customModel: customModel || undefined
    });
  };

  // Copy content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: "Copié dans le presse-papiers" });
  };

  // Function icons map
  const functionIcons: Record<string, any> = {
    description: BookOpen,
    structure: Settings,
    marketing: Target,
    title: Lightbulb,
    keywords: MessageSquare,
    synopsis: BookOpen,
    blurb: MessageSquare
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 mt-16 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuration des Variables IA</h1>
                <p className="text-gray-600">Configurez les variables disponibles pour toutes les fonctions IA</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="functions">Variables Disponibles</TabsTrigger>
                <TabsTrigger value="advanced">Documentation</TabsTrigger>
              </TabsList>

              {/* Variables Tab */}
              <TabsContent value="functions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Variables Disponibles par Catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fieldsLoading ? (
                      <div className="text-center py-8">Chargement des variables...</div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(databaseFields || {}).map(([category, fields]) => (
                          <div key={category}>
                            <h3 className="text-lg font-semibold mb-3 text-gray-900">{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {fields.map((field: any) => (
                                <div key={`${field.table}-${field.field}`} className="p-3 border rounded-lg bg-gray-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                                      {`{${field.field}}`}
                                    </code>
                                    <Badge variant="outline" className="text-xs">
                                      {field.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{field.description}</p>
                                  {field.options && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-500">Options:</p>
                                      <p className="text-xs text-gray-600">{field.options.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documentation Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentation des Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Comment utiliser les variables :</h3>
                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <p className="text-sm">
                          • Les variables sont automatiquement remplacées par les valeurs réelles des utilisateurs
                        </p>
                        <p className="text-sm">
                          • Utilisez la syntaxe <code className="px-1 bg-white rounded">{`{nom_variable}`}</code> dans vos prompts
                        </p>
                        <p className="text-sm">
                          • Les variables sont organisées par contexte : Livre, Projet, Auteur, Système
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Exemples d'utilisation :</h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Génération de description :</h4>
                          <code className="text-sm text-gray-700 block">
                            "Créez une description marketing pour le livre {`{title}`} de {`{fullAuthorName}`}. 
                            Le livre est écrit en {`{language}`} et appartient à la catégorie {`{primaryCategory}`}. 
                            Prix: {`{ebookPrice}`}€"
                          </code>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Génération de structure :</h4>
                          <code className="text-sm text-gray-700 block">
                            "Créez un plan détaillé pour le livre {`{title}`} qui fait {`{manuscriptPages}`} pages. 
                            Public cible: {`{targetAudience}`}. Incluez {`{expectedLength}`} mots environ."
                          </code>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Contenu marketing :</h4>
                          <code className="text-sm text-gray-700 block">
                            "Créez du contenu promotionnel pour {`{bookFullTitle}`} de {`{fullAuthorName}`}. 
                            Mots-clés: {`{keywords}`}. Date de sortie: {`{currentDate}`}"
                          </code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Variables spéciales :</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <code className="text-blue-600 font-mono text-sm">{`{fullAuthorName}`}</code>
                          <p className="text-sm text-gray-600 mt-1">Prénom + Nom complet</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <code className="text-blue-600 font-mono text-sm">{`{bookFullTitle}`}</code>
                          <p className="text-sm text-gray-600 mt-1">Titre + Sous-titre</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <code className="text-blue-600 font-mono text-sm">{`{currentDate}`}</code>
                          <p className="text-sm text-gray-600 mt-1">Date du jour</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <code className="text-blue-600 font-mono text-sm">{`{currentYear}`}</code>
                          <p className="text-sm text-gray-600 mt-1">Année actuelle</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}