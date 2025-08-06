import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AIUsageLimit {
  id?: string;
  subscriptionTier: string;
  monthlyTokenLimit: number | null;
  dailyRequestLimit: number | null;
  maxTokensPerRequest: number;
  allowedModels: string[];
}

interface UsageLimitModalProps {
  limit: AIUsageLimit;
  onSave: (data: Partial<AIUsageLimit>) => void;
  onClose: () => void;
  isLoading: boolean;
}

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Gratuit', color: 'bg-gray-500' },
  { value: 'basic', label: 'Basic', color: 'bg-blue-500' },
  { value: 'premium', label: 'Premium', color: 'bg-purple-500' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-orange-500' }
];

const AVAILABLE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini', 
  'gpt-4',
  'claude-3-sonnet',
  'claude-3-haiku'
];

export default function UsageLimitModal({ limit, onSave, onClose, isLoading }: UsageLimitModalProps) {
  const [formData, setFormData] = useState<AIUsageLimit>({
    subscriptionTier: limit.subscriptionTier || 'free',
    monthlyTokenLimit: limit.monthlyTokenLimit,
    dailyRequestLimit: limit.dailyRequestLimit,
    maxTokensPerRequest: limit.maxTokensPerRequest || 1000,
    allowedModels: limit.allowedModels || [])};

  const [unlimitedTokens, setUnlimitedTokens] = useState(limit.monthlyTokenLimit === null);
  const [unlimitedRequests, setUnlimitedRequests] = useState(limit.dailyRequestLimit === null);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      monthlyTokenLimit: unlimitedTokens ? null : formData.monthlyTokenLimit,
      dailyRequestLimit: unlimitedRequests ? null : formData.dailyRequestLimit
    };
    
    if (limit.id) {
      dataToSave.id = limit.id;
    }
    onSave(dataToSave);
  };

  const toggleModel = (modelName: string) => {
    setFormData(prev => ({
      ...prev,
      allowedModels: prev.allowedModels.includes(modelName)
        ? prev.allowedModels.filter(m => m !== modelName)
        : [...prev.allowedModels, modelName])});
  };

  const selectedTier = SUBSCRIPTION_TIERS.find(tier => tier.value === formData.subscriptionTier);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {limit.id ? 'Modifier les Limites d\'Usage' : 'Nouvelles Limites d\'Usage'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Niveau d'Abonnement</h3>
              
              <div>
                <Label htmlFor="tier">Niveau</Label>
                <Select 
                  value={formData.subscriptionTier} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionTier: value)}}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TIERS.map(tier => (
                      <SelectItem key={tier.value} value={tier.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                          {tier.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Limites d'Usage</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="monthlyTokens">Tokens Mensuels</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={unlimitedTokens}
                        onCheckedChange={setUnlimitedTokens}
                      />
                      <Label className="text-sm">Illimité</Label>
                    </div>
                  </div>
                  <Input
                    id="monthlyTokens"
                    type="number"
                    min="0"
                    disabled={unlimitedTokens}
                    value={unlimitedTokens ? '' : formData.monthlyTokenLimit || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      monthlyTokenLimit: parseInt(e.target.value) || 0 
                    ))}}
                    placeholder="Ex: 50000"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="dailyRequests">Requêtes Quotidiennes</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={unlimitedRequests}
                        onCheckedChange={setUnlimitedRequests}
                      />
                      <Label className="text-sm">Illimité</Label>
                    </div>
                  </div>
                  <Input
                    id="dailyRequests"
                    type="number"
                    min="0"
                    disabled={unlimitedRequests}
                    value={unlimitedRequests ? '' : formData.dailyRequestLimit || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dailyRequestLimit: parseInt(e.target.value) || 0 
                    ))}}
                    placeholder="Ex: 100"
                  />
                </div>

                <div>
                  <Label htmlFor="maxTokensPerRequest">Tokens Maximum par Requête</Label>
                  <Input
                    id="maxTokensPerRequest"
                    type="number"
                    min="100"
                    max="8000"
                    value={formData.maxTokensPerRequest}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxTokensPerRequest: parseInt(e.target.value) || 1000 
                    ))}}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Modèles Autorisés</h3>
              
              <div className="space-y-3">
                {AVAILABLE_MODELS.map(model => (
                  <div key={model} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{model}</span>
                      <p className="text-sm text-muted-foreground">
                        {model.includes('gpt-4o') ? 'OpenAI GPT-4o' :
                         model.includes('gpt-4') ? 'OpenAI GPT-4' :
                         model.includes('claude') ? 'Anthropic Claude' : 
                         'Modèle IA'}
                      </p>
                    </div>
                    <Switch
                      checked={ formData.allowedModels.includes(model)}
                      onCheckedChange={ () => toggleModel(model)}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium">Modèles sélectionnés:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allowedModels.map(model => (
                    <Badge key={model} variant="secondary" className="flex items-center gap-1">
                      {model}
                      <button
                        onClick={ () => toggleModel(model )}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Résumé de la Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Niveau:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${selectedTier?.color}`} />
                    {selectedTier?.label}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Tokens/mois:</span>
                  <p className="mt-1">{ unlimitedTokens ? 'Illimité' : (formData.monthlyTokenLimit?.toLocaleString() || '0')}</p>
                </div>
                <div>
                  <span className="font-medium">Requêtes/jour:</span>
                  <p className="mt-1">{ unlimitedRequests ? 'Illimité' : (formData.dailyRequestLimit?.toLocaleString() || '0')}</p>
                </div>
                <div>
                  <span className="font-medium">Modèles:</span>
                  <p className="mt-1">{formData.allowedModels.length} autorisé(s)</p>
                </div>
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