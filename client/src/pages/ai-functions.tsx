import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, Play, Settings, BookOpen, User, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AIFunction {
  key: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  requiresBookContext: boolean;
  requiresProjectContext: boolean;
  defaultModel: string;
  defaultSystemPrompt: string;
  defaultUserPromptTemplate: string;
  maxTokens: number;
  temperature: number;
  availableForTiers: string[];
  sortOrder: number;
}

interface DatabaseField {
  table: string;
  field: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  description: string;
  options?: string[];
}

const categoryIcons = {
  content: BookOpen,
  marketing: Building,
  seo: Settings,
  profile: User,
};

const categoryColors = {
  content: 'border-green-200 dark:border-green-800',
  marketing: 'border-blue-200 dark:border-blue-800',
  seo: 'border-purple-200 dark:border-purple-800',
  profile: 'border-orange-200 dark:border-orange-800',
};

export default function AIFunctions() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedFunction, setSelectedFunction] = useState<AIFunction | null>(null);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customTemperature, setCustomTemperature] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch AI functions
  const { data: aiFunctions, isLoading: functionsLoading } = useQuery({
    queryKey: ['/api/ai/functions'],
    enabled: isAuthenticated,
  });

  // Fetch database fields for variable preview
  const { data: databaseFields } = useQuery({
    queryKey: ['/api/ai/database-fields'],
    enabled: isAuthenticated,
  });

  // Fetch user's books
  const { data: books } = useQuery({
    queryKey: ['/api/books'],
    enabled: isAuthenticated,
  });

  // Fetch user's projects
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (selectedFunction) {
      setCustomPrompt(selectedFunction.defaultUserPromptTemplate);
      setCustomModel(selectedFunction.defaultModel);
      setCustomTemperature(selectedFunction.temperature.toString());
    }
  }, [selectedFunction]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié !',
      description: 'Le texte a été copié dans le presse-papiers',
    });
  };

  const generateContent = async () => {
    if (!selectedFunction) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionKey: selectedFunction.key,
          bookId: selectedFunction.requiresBookContext ? selectedBook : undefined,
          projectId: selectedFunction.requiresProjectContext ? selectedProject : undefined,
          customPrompt: customPrompt !== selectedFunction.defaultUserPromptTemplate ? customPrompt : undefined,
          customModel: customModel !== selectedFunction.defaultModel ? customModel : undefined,
          customTemperature: parseFloat(customTemperature) !== selectedFunction.temperature ? parseFloat(customTemperature) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      
      toast({
        title: 'Contenu généré !',
        description: 'Le contenu IA a été généré avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le contenu',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getAvailableVariables = () => {
    if (!databaseFields || !selectedFunction) return [];
    
    const relevantFields: DatabaseField[] = [];
    const fields = databaseFields as Record<string, DatabaseField[]>;
    
    if (selectedFunction.requiresBookContext) {
      relevantFields.push(...(fields.Livre || []));
    }
    
    if (selectedFunction.requiresProjectContext) {
      relevantFields.push(...(fields.Projet || []));
    }
    
    // Always include author and system variables
    relevantFields.push(...(fields.Auteur || []));
    relevantFields.push(...(fields.Système || []));
    
    return relevantFields;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour accéder aux fonctionnalités IA.
            </p>
            <Button onClick={() => window.location.href = '/api/login'}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (functionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des fonctionnalités IA...</p>
        </div>
      </div>
    );
  }

  // Group functions by category
  const functionsByCategory = (aiFunctions as AIFunction[] || []).reduce((acc: Record<string, AIFunction[]>, func: AIFunction) => {
    if (!acc[func.category]) acc[func.category] = [];
    acc[func.category].push(func);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Fonctionnalités IA</h1>
          <p className="text-muted-foreground">
            Générez du contenu intelligent pour vos projets d'édition
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Functions List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités disponibles</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4 p-6">
                  {Object.entries(functionsByCategory).map(([category, functions]) => {
                    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                    const colorClass = categoryColors[category as keyof typeof categoryColors] || '';
                    
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="w-4 h-4" />
                          <h3 className="font-semibold capitalize">{category}</h3>
                        </div>
                        <div className="space-y-2 ml-6">
                          {(functions as AIFunction[]).map((func) => (
                            <Button
                              key={func.key}
                              variant={selectedFunction?.key === func.key ? 'default' : 'ghost'}
                              className="w-full justify-start text-left h-auto p-3"
                              onClick={() => setSelectedFunction(func)}
                            >
                              <div>
                                <div className="font-medium">{func.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {func.description}
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {func.availableForTiers.map((tier: string) => (
                                    <Badge key={tier} variant="secondary" className="text-xs">
                                      {tier}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Function Configuration */}
          <div className="lg:col-span-2">
            {selectedFunction ? (
              <Tabs defaultValue="configuration" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
                  <TabsTrigger value="advanced">Paramètres avancés</TabsTrigger>
                  <TabsTrigger value="results">Résultats</TabsTrigger>
                </TabsList>

                <TabsContent value="configuration" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedFunction.name}</CardTitle>
                      <p className="text-muted-foreground">{selectedFunction.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Context Selection */}
                      {selectedFunction.requiresBookContext && (
                        <div>
                          <Label htmlFor="book-select">Sélectionner un livre</Label>
                          <Select value={selectedBook} onValueChange={setSelectedBook}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisissez un livre..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(books as any[] || []).map((book: any) => (
                                <SelectItem key={book.id} value={book.id}>
                                  {book.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedFunction.requiresProjectContext && (
                        <div>
                          <Label htmlFor="project-select">Sélectionner un projet</Label>
                          <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisissez un projet..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(projects as any[] || []).map((project: any) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Available Variables */}
                      <div>
                        <Label>Variables disponibles</Label>
                        <div className="border rounded-lg p-4 bg-muted/50 mt-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getAvailableVariables().map((field) => (
                              <Button
                                key={`${field.table}-${field.field}`}
                                variant="outline"
                                size="sm"
                                className="h-auto p-2 text-left justify-start"
                                onClick={() => copyToClipboard(`{${field.field}}`)}
                              >
                                <div>
                                  <code className="text-xs font-mono">{`{${field.field}}`}</code>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {field.displayName}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Generate Button */}
                      <Button 
                        onClick={generateContent} 
                        disabled={isGenerating || (selectedFunction.requiresBookContext && !selectedBook) || (selectedFunction.requiresProjectContext && !selectedProject)}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Génération en cours...' : 'Générer le contenu'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres avancés</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="custom-prompt">Prompt personnalisé</Label>
                        <Textarea
                          id="custom-prompt"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          rows={6}
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="custom-model">Modèle IA</Label>
                          <Input
                            id="custom-model"
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="custom-temperature">Température</Label>
                          <Input
                            id="custom-temperature"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={customTemperature}
                            onChange={(e) => setCustomTemperature(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="results" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Contenu généré</CardTitle>
                        {generatedContent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generatedContent)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copier
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {generatedContent ? (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm">
                            {generatedContent}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-12">
                          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Aucun contenu généré pour le moment</p>
                          <p className="text-sm">Utilisez l'onglet Configuration pour générer du contenu</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez une fonctionnalité</h3>
                  <p className="text-muted-foreground">
                    Choisissez une fonctionnalité IA dans la liste de gauche pour commencer
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}