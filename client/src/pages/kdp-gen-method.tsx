import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Lightbulb,
  Zap,
  Award,
  BarChart3,
  FileText,
  Star
} from "lucide-react";

const KdpGenMethodPage = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [bookConcept, setBookConcept] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [marketingGoals, setMarketingGoals] = useState("");
  const [generatedStrategy, setGeneratedStrategy] = useState("");

  const handleGenerateStrategy = async () => {
    if (!selectedNiche || !bookConcept || !targetAudience) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulation d'appel API - à remplacer par un vrai appel
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setGeneratedStrategy(`
**Stratégie KDP Gen Method Pro pour "${bookConcept}"**

🎯 **Analyse de Niche: ${selectedNiche}**
- Potentiel de marché: Élevé
- Concurrence: Modérée
- Opportunités identifiées: 5 sous-niches prometteuses

📚 **Optimisation du Concept**
Votre concept "${bookConcept}" présente un excellent potentiel pour le marché ${selectedNiche}. 

🎭 **Ciblage Audience**
Audience principale: ${targetAudience}
- Démographie clé identifiée
- Points de douleur spécifiques
- Canaux de distribution optimaux

💰 **Stratégie de Prix**
- Prix de lancement recommandé: $4.99-$7.99
- Stratégie de promotion progressive
- Optimisation pour Kindle Unlimited

📈 **Plan de Lancement en 30 jours**
- Semaine 1-2: Préparation et optimisation
- Semaine 3: Lancement soft avec promotion
- Semaine 4: Amplification et collecte d'avis

🚀 **Actions Prioritaires**
1. Optimiser le titre et sous-titre
2. Créer une couverture impactante
3. Structurer la description pour conversion
4. Planifier la campagne de lancement
5. Identifier les mots-clés stratégiques
      `);
      
      toast({
        title: "Stratégie générée avec succès",
        description: "Votre plan KDP Gen Method Pro est prêt",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Erreur lors de la génération",
        description: "Impossible de générer la stratégie. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const niches = [
    "Développement personnel",
    "Romance",
    "Thriller/Suspense", 
    "Fantasy",
    "Science-fiction",
    "Non-fiction business",
    "Cuisine et recettes",
    "Santé et bien-être",
    "Guides pratiques",
    "Livres pour enfants"
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KDP Gen Method Pro Assist</h1>
            <p className="text-gray-600 mt-2">
              Votre assistant IA pour développer des stratégies de publication KDP gagnantes
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Bot className="w-4 h-4 mr-1" />
            Pro AI Assistant
          </Badge>
        </div>

        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="strategy">Stratégie</TabsTrigger>
            <TabsTrigger value="market">Analyse Marché</TabsTrigger>
            <TabsTrigger value="optimization">Optimisation</TabsTrigger>
            <TabsTrigger value="launch">Lancement</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Générateur de Stratégie
                  </CardTitle>
                  <CardDescription>
                    Créez une stratégie personnalisée pour votre projet KDP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="niche">Niche principale *</Label>
                    <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre niche" />
                      </SelectTrigger>
                      <SelectContent>
                        {niches.map((niche) => (
                          <SelectItem key={niche} value={niche}>
                            {niche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="concept">Concept du livre *</Label>
                    <Input
                      id="concept"
                      value={bookConcept}
                      onChange={(e) => setBookConcept(e.target.value)}
                      placeholder="Ex: Guide pratique pour débuter en meditation"
                    />
                  </div>

                  <div>
                    <Label htmlFor="audience">Public cible *</Label>
                    <Input
                      id="audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Ex: Adultes 25-45 ans stressés par leur travail"
                    />
                  </div>

                  <div>
                    <Label htmlFor="goals">Objectifs marketing</Label>
                    <Textarea
                      id="goals"
                      value={marketingGoals}
                      onChange={(e) => setMarketingGoals(e.target.value)}
                      placeholder="Décrivez vos objectifs de vente et de marketing"
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerateStrategy}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Bot className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Générer ma stratégie Pro
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Stratégie Générée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedStrategy ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {generatedStrategy}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Votre stratégie personnalisée apparaîtra ici</p>
                      <p className="text-sm">Remplissez le formulaire et cliquez sur "Générer"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Target className="w-5 h-5 mr-2 text-red-500" />
                    Analyse de Niche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Demande</span>
                      <Badge variant="outline" className="text-green-600">Élevée</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Concurrence</span>
                      <Badge variant="outline" className="text-orange-600">Modérée</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Potentiel</span>
                      <Badge variant="outline" className="text-blue-600">Excellent</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Tendances Marché
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Croissance: </span>
                      <span className="text-green-600">+15% ce mois</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Pic saisonnier: </span>
                      <span>Janvier-Mars</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Mots-clés hot: </span>
                      <span>5 identifiés</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="w-5 h-5 mr-2 text-purple-500" />
                    Audience Cible
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Âge principal: </span>
                      <span>25-45 ans</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Genre: </span>
                      <span>65% Femmes</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Budget moyen: </span>
                      <span>$5-15/livre</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Outils d'Optimisation
                </CardTitle>
                <CardDescription>
                  Optimisez vos éléments clés pour maximiser vos ventes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Optimiseur de Titre</h4>
                    <Input placeholder="Titre actuel de votre livre" />
                    <Button variant="outline" className="w-full">
                      <Zap className="w-4 h-4 mr-2" />
                      Générer des variantes
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Mots-clés Stratégiques</h4>
                    <Input placeholder="Niche ou sujet principal" />
                    <Button variant="outline" className="w-full">
                      <Target className="w-4 h-4 mr-2" />
                      Rechercher mots-clés
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="launch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-500" />
                  Plan de Lancement 30 Jours
                </CardTitle>
                <CardDescription>
                  Votre roadmap complète pour un lancement réussi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Semaine 1-2: Préparation
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li>• Finaliser le manuscrit et la mise en page</li>
                      <li>• Créer la couverture optimisée</li>
                      <li>• Rédiger la description vendeuse</li>
                      <li>• Configurer les mots-clés et catégories</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Semaine 3: Lancement
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li>• Publication sur KDP</li>
                      <li>• Lancement de la promotion initiale</li>
                      <li>• Activation des réseaux sociaux</li>
                      <li>• Collecte des premiers avis</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Semaine 4: Optimisation
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li>• Analyse des performances</li>
                      <li>• Ajustement des stratégies</li>
                      <li>• Amplification des campagnes</li>
                      <li>• Planification long terme</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default KdpGenMethodPage;