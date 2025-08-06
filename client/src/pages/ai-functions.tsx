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
import { Copy, Play, Settings, BookOpen, User, Building, HelpCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Layout from '@/components/Layout';

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Fetch AI functions
  const { data: aiFunctions, isLoading: functionsLoading } = useQuery({
    queryKey: ['/api/ai/functions'],
    enabled: isAuthenticated,
  };

  // Fetch database fields for variable preview
  const { data: databaseFields } = useQuery({
    queryKey: ['/api/ai/database-fields'],
    enabled: isAuthenticated,
  };

  // Fetch user's books
  const { data: books } = useQuery({
    queryKey: ['/api/books'],
    enabled: isAuthenticated,
  };

  // Fetch user's projects
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
  };

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
      title: 'Copied!',
      description: 'Text has been copied to clipboard'
      });
  };

  const generateContent = async () => {
    if (!selectedFunction) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
      }),
        body: JSON.stringify({ functionKey: selectedFunction.key,
          bookId: selectedFunction.requiresBookContext ? selectedBook : undefined,
          projectId: selectedFunction.requiresProjectContext ? selectedProject : undefined,
          customPrompt: customPrompt !== selectedFunction.defaultUserPromptTemplate ? customPrompt : undefined,
          customModel: customModel !== selectedFunction.defaultModel ? customModel : undefined,
          customTemperature: parseFloat(customTemperature) !== selectedFunction.temperature ? parseFloat(customTemperature) : undefined,
        ),
      };

      if (!response.ok) {
        throw new Error('Error during generation');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      
      toast({
        title: 'Content Generated!',
        description: 'AI content has been generated successfully',
      };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to generate content',
        variant: 'destructive'
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
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You must be logged in to access AI functions.
            </p>
            <Button onClick={() => window.location.href = '/api/login')}>
              Sign In
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
          <p className="text-muted-foreground">Loading AI functions...</p>
        </div>
      </div>
    );
  }

  // Group functions by category
  const functionsByCategory = (aiFunctions as AIFunction[] || []).reduce((acc: Record<string, AIFunction[]>, func: AIFunction) => {
    if (!acc[func.category]) acc[func.category] = [];
    acc[func.category].push(func);
    return acc;
  }, {};

  return (
    <Layout>
        <div className="container mx-auto px-6 py-8 pt-24">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-foreground">AI Functions</h1>
              <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Configuration Guide
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">AI Functions Configuration Guide</DialogTitle>
                    <DialogDescription>
                      Complete guide to configure and use AI functions effectively
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold">1. System Overview:</p>
                        <p className="ml-4">AI Functions use dynamic variables extracted from your database (books, projects, authors) to generate personalized content with configurable AI models and prompts.</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold">2. Configuration Process:</p>
                        <div className="ml-4 space-y-1">
                          <p>• <strong>Variables:</strong> View available variables at /admin/ai-variables<br/>
                             &nbsp;&nbsp;(37 Book, 5 Project, 10 Author, 4 System variables)</p>
                          <p>• <strong>Prompts:</strong> Create templates at /admin/ai-config<br/>
                             &nbsp;&nbsp;using {'{variable_name}'} format</p>
                          <p>• <strong>Models:</strong> Configure gpt-4o, gpt-4o-mini<br/>
                             &nbsp;&nbsp;with pricing and limits</p>
                          <p>• <strong>Usage Limits:</strong> Set token quotas by subscription tier<br/>
                             &nbsp;&nbsp;(Free: 1K, Basic: 10K, Premium: 100K tokens/month)</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-semibold">3. Usage Workflow:</p>
                        <p className="ml-4">• Select an AI function<br/>
                           • Choose a book/project for context<br/>
                           • Variables auto-populate<br/>
                           • Generate content with real data substitution</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold">4. Variable Examples:</p>
                        <p className="ml-4">• {'{title}'} - Book title<br/>
                           • {'{genre}'} - Book genre<br/>
                           • {'{author_name}'} - Author name<br/>
                           • {'{pages}'} - Page count<br/>
                           • {'{price}'} - Book price</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold">5. Best Practices:</p>
                        <p className="ml-4">• Use gpt-4o-mini for simple tasks to save costs<br/>
                           • Combine multiple variables for richer context<br/>
                           • Test with real book data<br/>
                           • Monitor usage limits</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground">
              Generate intelligent content for your publishing projects using configurable AI functions
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Functions List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Available Functions</CardTitle>
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
                              onClick={ () => setSelectedFunction(func )}
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
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="configuration" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedFunction.name)}</CardTitle>
                      <p className="text-muted-foreground">{selectedFunction.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Context Selection */}
                      {selectedFunction.requiresBookContext && (
                        <div>
                          <Label htmlFor="book-select">Select a Book</Label>
                          <Select value={selectedBook)} onValueChange={setSelectedBook}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a book..." />
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
                          <Label htmlFor="project-select">Select a Project</Label>
                          <Select value={selectedProject)} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a project..." />
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
                        <Label>Available Variables</Label>
                        <div className="border rounded-lg p-4 bg-muted/50 mt-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getAvailableVariables().map((field) => (
                              <Button
                                key={`${field.table}-${field.field}`}
                                variant="outline"
                                size="sm"
                                className="h-auto p-2 text-left justify-start"
                                onClick={() => copyToClipboard(`{${field.field)}}`)}
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
                        disabled={ isGenerating || (selectedFunction.requiresBookContext && !selectedBook) || (selectedFunction.requiresProjectContext && !selectedProject)}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Generating...' : 'Generate Content'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="custom-prompt">Custom Prompt</Label>
                        <Textarea
                          id="custom-prompt"
                          value={customPrompt}
                          onChange={ (e) => setCustomPrompt(e.target.value )}
                          rows={6}
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="custom-model">AI Model</Label>
                          <Input
                            id="custom-model"
                            value={customModel}
                            onChange={ (e) => setCustomModel(e.target.value )}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="custom-temperature">Temperature</Label>
                          <Input
                            id="custom-temperature"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={customTemperature}
                            onChange={ (e) => setCustomTemperature(e.target.value )}
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
                        <CardTitle>Generated Content</CardTitle>
                        { generatedContent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generatedContent ))}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {generatedContent ? (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm">
                            {generatedContent)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-12">
                          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No content generated yet</p>
                          <p className="text-sm">Use the Configuration tab to generate content</p>
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
                  <h3 className="text-lg font-semibold mb-2">Select a Function</h3>
                  <p className="text-muted-foreground">
                    Choose an AI function from the left panel to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
    </Layout>
  );
}