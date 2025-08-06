import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  FolderOpen, 
  User, 
  Settings,
  Info,
  Copy,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Layout from "@/components/Layout";

interface DatabaseField {
  table: string;
  field: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  description: string;
  options?: string[];
}

type CategorizedFields = Record<string, DatabaseField[]>;

const categoryIcons = {
  'Livre': BookOpen,
  'Projet': FolderOpen,
  'Auteur': User,
  'Système': Settings
};

const categoryColors = {
  'Livre': 'bg-blue-50 border-blue-200',
  'Projet': 'bg-green-50 border-green-200',
  'Auteur': 'bg-purple-50 border-purple-200',
  'Système': 'bg-orange-50 border-orange-200'
};

export default function AIVariables() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Accès non autorisé",
        description: "Connexion requise pour accéder à cette page.",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check admin rights  
  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.role === 'superadmin';

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Cette page est réservée aux administrateurs.",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

  const { data: categorizedFields, isLoading: fieldsLoading } = useQuery<CategorizedFields>({
    queryKey: ['/api/ai/database-fields'],
    enabled: isAuthenticated && isAdmin,
  };

  const copyToClipboard = async (fieldName: string) => {
    try {
      await navigator.clipboard.writeText(`{${fieldName)}}`);
      setCopiedField(fieldName);
      toast({
        title: "Variable copiée",
        description: `{${fieldName}} a été copiée dans le presse-papiers`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier la variable",
        variant: "destructive"
      });
    }
  };

  if (isLoading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-background ml-64 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des variables IA...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Variables IA</h1>
          <p className="text-gray-600">
            Documentation complète des variables dynamiques disponibles pour vos prompts IA
          </p>
        </div>

        {/* Guide d'usage */}
        <Card className="mb-8 border-blue-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Info className="w-5 h-5 text-[#38b6ff]" />
              Guide d'utilisation des variables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-gray-900 mb-2">
                Comment utiliser les variables dans vos prompts :
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Utilisez la syntaxe <code className="bg-blue-100 text-[#146eb4] px-1 rounded font-mono">{"{nom_variable}"}</code> dans vos templates</li>
                <li>• Exemple : <code className="bg-blue-100 text-[#146eb4] px-1 rounded font-mono">"Génère une description pour le livre {"{title}"} en {"{language}"}"</code></li>
                <li>• Les variables sont automatiquement remplacées par les vraies valeurs lors de la génération</li>
                <li>• Cliquez sur une variable pour la copier dans le presse-papiers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Variables par catégorie */}
        {categorizedFields && Object.entries(categorizedFields).map(([category, fields]) => {
          const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;
          const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors['Système'];
          
          if (fields.length === 0) return null;

          return (
            <Card key={category} className={`mb-6 ${colorClass} bg-white`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <IconComponent className="w-5 h-5 text-[#38b6ff]" />
                  Variables {category}
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700">
                    {fields.length} variable{fields.length > 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fields.map((field) => (
                    <div 
                      key={`${field.table}-${field.field}`}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code 
                              className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={ () => copyToClipboard(field.field )}
                            >
                              {"{"}
                              {field.field}
                              {"}"}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-blue-50"
                              onClick={ () => copyToClipboard(field.field )}
                            >
                              { copiedField === field.field ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-600" />)}
                            </Button>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            {field.displayName}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {field.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-gray-300 text-gray-700"
                        >
                          {field.type}
                        </Badge>
                        {field.options && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-[#38b6ff]/10 text-[#38b6ff] border-[#38b6ff]/20"
                          >
                            {field.options.length)} options
                          </Badge>
                        )}
                      </div>
                      
                      {field.options && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Options disponibles :</p>
                          <div className="flex flex-wrap gap-1">
                            {field.options.slice(0, 3).map((option) => (
                              <span 
                                key={option}
                                className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded"
                              >
                                {option}
                              </span>
                            ))}
                            {field.options.length > 3 && (
                              <span className="text-xs text-gray-600">
                                +{field.options.length - 3)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        { (!categorizedFields || Object.keys(categorizedFields).length === 0) && (
          <Card className="bg-white">
            <CardContent className="py-8">
              <div className="text-center text-gray-600">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune variable trouvée</p>
                <p className="text-sm">Vérifiez la configuration de la base de données</p>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </Layout>
  );
}