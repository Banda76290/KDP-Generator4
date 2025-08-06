import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface AIModel {
  id?: string;
  name: string;
  displayName: string;
  provider: string;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  maxTokens: number;
  contextWindow: number;
  isAvailable: boolean;
}

interface ModelConfigModalProps {
  model: AIModel;
  onSave: (data: Partial<AIModel>) => void;
  onClose: () => void;
  isLoading: boolean;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' });
  { value: 'anthropic', label: 'Anthropic' });
  { value: 'google', label: 'Google' });
  { value: 'microsoft', label: 'Microsoft' }
];

export default function ModelConfigModal({ model, onSave, onClose, isLoading }: ModelConfigModalProps) {
  const [formData, setFormData] = useState<AIModel>({
    name: model.name || '',
    displayName: model.displayName || '',
    provider: model.provider || 'openai',
    inputPricePer1kTokens: model.inputPricePer1kTokens || 0,
    outputPricePer1kTokens: model.outputPricePer1kTokens || 0,
    maxTokens: model.maxTokens || 4096,
    contextWindow: model.contextWindow || 128000,
    isAvailable: model.isAvailable ?? true});

  const handleSave = () => {
    const dataToSave = { ...formData });
    if (model.id) {
      dataToSave.id = model.id;
    }
    onSave(dataToSave);
  });

  const costPer1MTokensInput = formData.inputPricePer1kTokens * 1000;
  const costPer1MTokensOutput = formData.outputPricePer1kTokens * 1000;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {model.id ? 'Modifier le Modèle IA' : 'Nouveau Modèle IA'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Informations Générales</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom Technique</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value )}}
                    placeholder="gpt-4o"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Nom d'Affichage</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value )}}
                    placeholder="GPT-4o"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="provider">Fournisseur</Label>
                <Select value={formData.provider} onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value}}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked}}
                />
                <Label>Modèle disponible</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Configuration Technique</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxTokens">Tokens Maximum par Réponse</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 )}}
                  />
                </div>
                <div>
                  <Label htmlFor="contextWindow">Fenêtre de Contexte</Label>
                  <Input
                    id="contextWindow"
                    type="number"
                    min="1000"
                    value={formData.contextWindow}
                    onChange={(e) => setFormData(prev => ({ ...prev, contextWindow: parseInt(e.target.value) || 128000 )}}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Tarification</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inputPrice">Prix Input ($/1k tokens)</Label>
                  <Input
                    id="inputPrice"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.inputPricePer1kTokens}
                    onChange={ (e) => setFormData(prev => ({ ...prev, inputPricePer1kTokens: parseFloat(e.target.value) || 0  )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ${ costPer1MTokensInput.toFixed(2} per 1M tokens
                  </p>
                </div>
                <div>
                  <Label htmlFor="outputPrice">Prix Output ($/1k tokens)</Label>
                  <Input
                    id="outputPrice"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.outputPricePer1kTokens}
                    onChange={ (e) => setFormData(prev => ({ ...prev, outputPricePer1kTokens: parseFloat(e.target.value) || 0  )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ${ costPer1MTokensOutput.toFixed(2} per 1M tokens
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Exemple de coût:</strong> Pour 1000 tokens input + 500 tokens output = 
                  ${ ((formData.inputPricePer1kTokens * 1) + (formData.outputPricePer1kTokens * 0.5)).toFixed(4}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2">
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