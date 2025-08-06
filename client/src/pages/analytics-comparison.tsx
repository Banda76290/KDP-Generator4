import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, DollarSign, Globe, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LegacyOverview {
  totalImports: string;
  totalRecords: string;
  totalRevenueUSD: string;
  averageRoyaltyUSD: string;
  uniqueBooks: string;
  uniqueMarketplaces: string;
}

interface NormalizedCurrency {
  currency: string;
  originalAmount: string;
  originalCurrency: string;
  transactions: string;
}

interface NormalizedOverview {
  totalRecords: string;
  totalRoyalties: string;
  uniqueBooks: string;
  uniqueMarketplaces: string;
  royaltiesByCurrency: NormalizedCurrency[];
}

export default function AnalyticsComparison() {
  const { data: legacyData, isLoading: legacyLoading, refetch: refetchLegacy } = useQuery<LegacyOverview>({
    queryKey: ['/api/analytics/overview'],
  };

  const { data: normalizedData, isLoading: normalizedLoading, refetch: refetchNormalized } = useQuery<NormalizedOverview>({
    queryKey: ['/api/analytics/overview-normalized'],
  };

  const migrateMutation = async () => {
    try {
      const response = await fetch('/api/analytics/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json')}
      });
      const result = await response.json();
      
      toast({
        title: "Migration terminée",
        description: `${result.migratedCount} enregistrements migrés, ${result.skippedCount} ignorés`,
      });
      
      // Refresh both datasets
      refetchLegacy();
      refetchNormalized();
    } catch (error) {
      toast({
        title: "Erreur de migration",
        description: "Impossible de migrer les données",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    ).format(num);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comparaison Analytics</h1>
          <p className="text-muted-foreground">
            Comparaison entre l'ancien système (avec conversion) et le nouveau (montants originaux préservés)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={migrateMutation}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Migrer les données
          </Button>
        </div>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparaison</TabsTrigger>
          <TabsTrigger value="legacy">Ancien Système</TabsTrigger>
          <TabsTrigger value="normalized">Nouveau Système</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Legacy System Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Ancien Système (USD Converti)
                </CardTitle>
                <CardDescription>
                  Système actuel avec conversion automatique en USD
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {legacyLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : legacyData ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Records:</span>
                      <Badge variant="outline">{legacyData.totalRecords)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue (USD):</span>
                      <Badge className="bg-green-100 text-green-800">${legacyData.totalRevenueUSD}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Livres uniques:</span>
                      <Badge variant="secondary">{legacyData.uniqueBooks}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Marchés:</span>
                      <Badge variant="secondary">{legacyData.uniqueMarketplaces}</Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-xs text-red-600">
                        ⚠️ Inclut les données de paiements cumulatives
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-red-500">Erreur de chargement</p>
                )}
              </CardContent>
            </Card>

            {/* Normalized System Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Nouveau Système (Devises Originales)
                </CardTitle>
                <CardDescription>
                  Structure normalisée avec montants originaux préservés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {normalizedLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : normalizedData ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Records:</span>
                      <Badge variant="outline">{normalizedData.totalRecords)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Livres uniques:</span>
                      <Badge variant="secondary">{normalizedData.uniqueBooks}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Marchés:</span>
                      <Badge variant="secondary">{normalizedData.uniqueMarketplaces}</Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-xs text-green-600">
                        ✅ Exclut les données de paiements cumulatives
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-red-500">Erreur de chargement</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Currency Breakdown */}
          {normalizedData?.royaltiesByCurrency && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Répartition par Devise (Montants Originaux)
                </CardTitle>
                <CardDescription>
                  Revenus par devise dans leur monnaie d'origine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {normalizedData.royaltiesByCurrency.map((curr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {curr.currency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({curr.transactions} trans.)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          { formatCurrency(curr.originalAmount, curr.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Système Actuel (Avec Conversion USD)</CardTitle>
              <CardDescription>
                Vue détaillée du système de données historiques avec conversion automatique
              </CardDescription>
            </CardHeader>
            <CardContent>
              {legacyData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Métriques Principales</h4>
                    <div className="text-2xl font-bold text-green-600">
                      ${legacyData.totalRevenueUSD)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Revenue total en USD (après conversion)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Données Importées</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Imports:</span>
                        <span>{legacyData.totalImports}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Records:</span>
                        <span>{legacyData.totalRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Royalty moyenne:</span>
                        <span>${legacyData.averageRoyaltyUSD}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Chargement des données héritées...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="normalized" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Système (Montants Originaux)</CardTitle>
              <CardDescription>
                Structure normalisée avec préservation des devises originales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {normalizedData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{normalizedData.totalRecords)}</div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{normalizedData.uniqueBooks}</div>
                      <p className="text-sm text-muted-foreground">Livres</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{normalizedData.uniqueMarketplaces}</div>
                      <p className="text-sm text-muted-foreground">Marchés</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Revenus par Devise</h4>
                    <div className="space-y-2">
                      {normalizedData.royaltiesByCurrency.map((curr, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge className="font-mono">{curr.currency}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {curr.transactions} transactions
                            </span>
                          </div>
                          <div className="font-medium">
                            { formatCurrency(curr.originalAmount, curr.currency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>Chargement des données normalisées...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}