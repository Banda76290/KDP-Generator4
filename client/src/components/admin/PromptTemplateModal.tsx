import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Info, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Variable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface PromptTemplate {
  id?: string;
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

interface PromptTemplateModalProps {
  template: PromptTemplate;
  onSave: (data: Partial<PromptTemplate>) => void;
  onClose: () => void;
  isLoading: boolean;
}

const AI_FUNCTIONS = [
  { value: 'structure', label: 'Structure de Livre', description: 'Génère la structure et plan du livre' },
  { value: 'description', label: 'Description de Livre', description: 'Crée des descriptions marketing attractives' },
  { value: 'marketing', label: 'Contenu Marketing', description: 'Génère du contenu promotionnel' },
  { value: 'chapters', label: 'Contenu de Chapitres', description: 'Développe le contenu des chapitres' },
  { value: 'title', label: 'Titre de Livre', description: 'Propose des titres accrocheurs' },
  { value: 'keywords', label: 'Mots-clés', description: 'Génère des mots-clés pour le référencement' },
  { value: 'synopsis', label: 'Synopsis', description: 'Crée un résumé professionnel' },
  { value: 'blurb', label: 'Quatrième de Couverture', description: 'Texte pour la couverture arrière' }
];

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', maxTokens: 4096 },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', maxTokens: 4096 },
  { value: 'gpt-4', label: 'GPT-4', maxTokens: 8192 },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', maxTokens: 4096 }
];

const COMMON_VARIABLES: Variable[] = [
  { name: 'title', description: 'Titre du livre', type: 'text', required: true },
  { name: 'genre', description: 'Genre du livre', type: 'select', options: ['Fiction', 'Non-fiction', 'Romance', 'Thriller', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-help'], required: false },
  { name: 'target_audience', description: 'Public cible', type: 'text', required: false },
  { name: 'language', description: 'Langue du livre', type: 'select', options: ['Français', 'English', 'Español', 'Deutsch'], required: false },
  { name: 'author', description: 'Nom de l\'auteur', type: 'text', required: false },
  { name: 'pages', description: 'Nombre de pages', type: 'number', required: false },
  { name: 'description', description: 'Description courte', type: 'text', required: false }
];

export default function PromptTemplateModal({ template, onSave, onClose, isLoading }: PromptTemplateModalProps) {
  const [formData, setFormData] = useState<PromptTemplate>({
    name: template.name || '',
    type: template.type || '',
    systemPrompt: template.systemPrompt || '',
    userPromptTemplate: template.userPromptTemplate || '',
    model: template.model || 'gpt-4o',
    maxTokens: template.maxTokens || 2000,
    temperature: template.temperature || 0.7,
    isActive: template.isActive ?? true,
    isDefault: template.isDefault ?? false,
    variables: template.variables || []
  });

  const [previewPrompt, setPreviewPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('config');

  // Generate preview with sample data
  useEffect(() => {
    let preview = formData.userPromptTemplate;
    formData.variables?.forEach(variable => {
      const sampleValue = variable.type === 'number' ? '300' : 
                         variable.options ? variable.options[0] : 
                         `[${variable.name}]`;
      preview = preview.replace(new RegExp(`{${variable.name}}`, 'g'), sampleValue);
    });
    setPreviewPrompt(preview);
  }, [formData.userPromptTemplate, formData.variables]);

  const addVariable = (commonVar?: Variable) => {
    const newVariable: Variable = commonVar || {
      name: '',
      description: '',
      type: 'text',
      required: false
    };
    
    setFormData(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  };

  const updateVariable = (index: number, field: keyof Variable, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      ) || []
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || []
    }));
  };

  const insertVariableInPrompt = (variableName: string, isSystemPrompt: boolean = false) => {
    const variable = `{${variableName}}`;
    if (isSystemPrompt) {
      setFormData(prev => ({
        ...prev,
        systemPrompt: prev.systemPrompt + variable
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        userPromptTemplate: prev.userPromptTemplate + variable
      }));
    }
  };

  const handleSave = () => {
    const dataToSave = { ...formData };
    if (template.id) {
      dataToSave.id = template.id;
    }
    onSave(dataToSave);
  };

  const selectedModel = AI_MODELS.find(m => m.value === formData.model);
  const maxTokensLimit = selectedModel?.maxTokens || 4096;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template.id ? 'Modifier la Fonctionnalité IA' : 'Nouvelle Fonctionnalité IA'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de la Fonctionnalité</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Générateur de Description"
                />
              </div>
              <div>
                <Label htmlFor="type">Type de Fonction</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_FUNCTIONS.map(func => (
                      <SelectItem key={func.value} value={func.value}>
                        <div>
                          <div className="font-medium">{func.label}</div>
                          <div className="text-xs text-muted-foreground">{func.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="model">Modèle IA</Label>
                <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label} (max {model.maxTokens} tokens)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max={maxTokensLimit}
                  value={formData.maxTokens}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2000 }))}
                />
              </div>
              <div>
                <Label htmlFor="temperature">Température</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Actif</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                />
                <Label>Par défaut</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <div>
              <Label htmlFor="systemPrompt">Prompt Système</Label>
              <div className="flex gap-2 mb-2">
                {formData.variables?.map(variable => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariableInPrompt(variable.name, true)}
                  >
                    {variable.name}
                  </Button>
                ))}
              </div>
              <Textarea
                id="systemPrompt"
                rows={4}
                value={formData.systemPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Instructions pour l'IA concernant son rôle et comportement..."
              />
            </div>

            <div>
              <Label htmlFor="userPrompt">Template de Prompt Utilisateur</Label>
              <div className="flex gap-2 mb-2">
                {formData.variables?.map(variable => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariableInPrompt(variable.name, false)}
                  >
                    {variable.name}
                  </Button>
                ))}
              </div>
              <Textarea
                id="userPrompt"
                rows={6}
                value={formData.userPromptTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, userPromptTemplate: e.target.value }))}
                placeholder="Template avec variables: Créez une description pour le livre '{title}' dans le genre {genre}..."
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Variables Disponibles</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.variables?.map(variable => (
                  <Badge key={variable.name} variant="secondary" className="text-xs">
                    {'{' + variable.name + '}'}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variables" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Variables Personnalisées</h3>
              <Button onClick={() => addVariable()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Variable
              </Button>
            </div>

            <div className="space-y-3">
              {formData.variables?.map((variable, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-3">
                        <Label className="text-xs">Nom</Label>
                        <Input
                          value={variable.name}
                          onChange={(e) => updateVariable(index, 'name', e.target.value)}
                          placeholder="nom_variable"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={variable.description}
                          onChange={(e) => updateVariable(index, 'description', e.target.value)}
                          placeholder="Description de la variable"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Type</Label>
                        <Select 
                          value={variable.type} 
                          onValueChange={(value: 'text' | 'number' | 'select') => updateVariable(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texte</SelectItem>
                            <SelectItem value="number">Nombre</SelectItem>
                            <SelectItem value="select">Liste</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={variable.required}
                            onCheckedChange={(checked) => updateVariable(index, 'required', checked)}
                          />
                          <Label className="text-xs">Obligatoire</Label>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariable(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {variable.type === 'select' && (
                      <div className="mt-3">
                        <Label className="text-xs">Options (séparées par des virgules)</Label>
                        <Input
                          value={variable.options?.join(', ') || ''}
                          onChange={(e) => updateVariable(index, 'options', e.target.value.split(', ').filter(Boolean))}
                          placeholder="Option1, Option2, Option3"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Variables Prédéfinies</h4>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_VARIABLES.map(variable => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addVariable(variable)}
                    disabled={formData.variables?.some(v => v.name === variable.name)}
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    {variable.description}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Aperçu de la Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Prompt Système:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {formData.systemPrompt || "Aucun prompt système défini"}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Prompt Utilisateur (avec exemples):</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {previewPrompt || "Aucun template défini"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Modèle:</span> {formData.model}
                  </div>
                  <div>
                    <span className="font-medium">Max Tokens:</span> {formData.maxTokens}
                  </div>
                  <div>
                    <span className="font-medium">Température:</span> {formData.temperature}
                  </div>
                  <div>
                    <span className="font-medium">Variables:</span> {formData.variables?.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}