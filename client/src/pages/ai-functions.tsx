import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState("functions");
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Check authentication
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
  }, [isAuthenticated, isLoading, toast]);

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
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fonctionnalités IA Configurables</h1>
                <p className="text-gray-600">Utilisez l'IA avec des prompts et modèles personnalisés</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="functions">Configuration</TabsTrigger>
                <TabsTrigger value="advanced">Paramètres Avancés</TabsTrigger>
                <TabsTrigger value="results">Résultats</TabsTrigger>
              </TabsList>

              {/* Configuration Tab */}
              <TabsContent value="functions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Function Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sélectionner une Fonction IA</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {functionsLoading ? (
                        <div className="text-center py-8">Chargement des fonctions...</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {(aiFunctions as AIFunction[])?.map((func) => {
                            const IconComponent = functionIcons[func.type] || Bot;
                            return (
                              <div
                                key={func.type}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedFunction === func.type
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedFunction(func.type)}
                              >
                                <div className="flex items-start gap-3">
                                  <IconComponent className="w-5 h-5 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h3 className="font-medium">{func.name}</h3>
                                    <p className="text-sm text-gray-600">{func.description}</p>
                                  </div>
                                  {selectedFunction === func.type && (
                                    <Badge>Sélectionné</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Context Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contexte des Données</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="project">Projet (optionnel)</Label>
                        <Select value={selectedProject} onValueChange={(value) => handleContextChange('project', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un projet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun projet</SelectItem>
                            {(projects as any)?.map((project: any) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="book">Livre (optionnel)</Label>
                        <Select value={selectedBook} onValueChange={(value) => handleContextChange('book', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un livre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun livre</SelectItem>
                            {(books as any)?.map((book: any) => (
                              <SelectItem key={book.id} value={book.id}>
                                {book.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Preview of available variables */}
                      {(selectedBook || selectedProject) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">Aperçu des variables disponibles :</h4>
                          <div className="text-sm space-y-1">
                            {Object.entries(previewValues).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <code className="px-1 bg-gray-200 rounded text-xs">{`{${key}}`}</code>
                                <span className="text-gray-600">=</span>
                                <span className="text-gray-800">{String(value || '[non défini]').substring(0, 50)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedFunction || generateMutation.isPending}
                    size="lg"
                    className="px-8"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Générer le Contenu
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Paramètres Avancés</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customModel">Modèle Personnalisé (optionnel)</Label>
                      <Select value={customModel} onValueChange={setCustomModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Utiliser le modèle par défaut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Par défaut</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="customPrompt">Prompt Personnalisé (optionnel)</Label>
                      <Textarea
                        id="customPrompt"
                        rows={6}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Remplace le prompt par défaut. Utilisez {variable_name} pour insérer des variables."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Contenu Généré</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          disabled={!generatedContent}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {generatedContent ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun contenu généré pour le moment</p>
                        <p className="text-sm">Configurez une fonction et générez du contenu pour voir les résultats ici</p>
                      </div>
                    )}
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