import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  BarChart3,
  Calendar,
  Globe,
  Star,
  Download
} from "lucide-react";

interface AnalyticsOverview {
  totalImports: number;
  totalRecords: number;
  royaltiesByCurrency: Array<{
    currency: string;
    amount: number;
    transactions: number;
  }>;
  uniqueBooks: number;
}

interface SalesTrend {
  date: string;
  sales: number;
  royalty: number;
  units: number;
}

interface TopPerformer {
  title: string;
  asin: string;
  currency: string;
  marketplace: string;
  totalSales: number;
  totalRoyalty: number;
  totalUnits: number;
  avgRoyaltyRate: number;
}

interface MarketplaceData {
  marketplace: string;
  currency: string;
  totalSales: number;
  totalRoyalty: number;
  totalUnits: number;
  uniqueBooks: number;
}

const MARKETPLACE_COLORS = {
  'Amazon.com': '#38b6ff',
  'Amazon.fr': '#ff9900',
  'Amazon.de': '#146eb4',
  'Amazon.ca': '#ffb347',
  'Amazon.co.uk': '#4285f4',
  'Amazon.it': '#34a853'
};

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Analytics data queries
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['/api/analytics/overview'],
    enabled: isAuthenticated,
  });

  const { data: salesTrends, isLoading: trendsLoading } = useQuery<SalesTrend[]>({
    queryKey: ['/api/analytics/sales-trends', selectedPeriod],
    enabled: isAuthenticated,
  });

  const { data: topPerformers, isLoading: performersLoading } = useQuery<TopPerformer[]>({
    queryKey: ['/api/analytics/top-performers'],
    enabled: isAuthenticated,
  });

  const { data: marketplaceData, isLoading: marketplaceLoading } = useQuery<MarketplaceData[]>({
    queryKey: ['/api/analytics/marketplace-breakdown'],
    enabled: isAuthenticated,
  });

  // Exchange rates data and management
  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["/api/exchange-rates"],
    enabled: isAuthenticated,
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    // Handle invalid or unknown currencies
    const validCurrency = ['EUR', 'USD', 'JPY', 'GBP', 'CAD', 'INR', 'AUD', 'BRL', 'MXN'].includes(currency) 
      ? currency 
      : 'EUR';
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: validCurrency === 'JPY' ? 0 : 2,
      }).format(amount);
    } catch (error) {
      // Fallback for any formatting errors
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  // Format currency converted to EUR for unified display  
  const formatConvertedCurrency = (amount: number): string => {
    return formatCurrency(amount, 'EUR');
  };

  // Function to update exchange rates manually
  const updateExchangeRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        toast({
          title: "Taux de change mis à jour",
          description: "Les taux de change ont été actualisés avec succès.",
        });
        // Refetch exchange rates data
        queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      } else {
        throw new Error('Failed to update exchange rates');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les taux de change.",
        variant: "destructive",
      });
    }
  };

  // Get main revenue info for display
  const royaltiesByCurrency = overview?.royaltiesByCurrency || [];
  const totalCurrencies = royaltiesByCurrency.length;
  const mainCurrency = royaltiesByCurrency.length > 0 ? royaltiesByCurrency[0] : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600 mt-1">Analyse détaillée de vos performances KDP basée sur vos données réelles.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="365">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overviewLoading ? (
                <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                overview?.totalImports || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Fichiers KDP importés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overviewLoading ? (
                <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                overview?.totalRecords?.toLocaleString('fr-FR') || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions importées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Principaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {overviewLoading ? (
                <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                mainCurrency ? formatCurrency(mainCurrency.amount, mainCurrency.currency) : '0 €'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCurrencies > 1 ? `${totalCurrencies} devises différentes` : 'Royautés cumulées'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livres Uniques</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overviewLoading ? (
                <div className="w-12 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                overview?.uniqueBooks || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ASINs différents
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="currencies">Devises</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplaces</TabsTrigger>
          <TabsTrigger value="books">Top Livres</TabsTrigger>
          <TabsTrigger value="exchange">Taux de Change</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution des Ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(label) => formatDate(label)}
                      formatter={(value, name) => [
                        name === 'royalty' ? formatCurrency(Number(value)) : value,
                        name === 'royalty' ? 'Royautés' : 
                        name === 'units' ? 'Unités' : 'Ventes'
                      ]}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="royalty" 
                      stroke="#38b6ff" 
                      strokeWidth={3}
                      dot={{ fill: '#38b6ff', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="units" 
                      stroke="#ff9900" 
                      strokeWidth={2}
                      dot={{ fill: '#ff9900', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenus par Devise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-16 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {royaltiesByCurrency?.map((currency) => (
                    <div key={currency.currency} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-lg">{currency.currency}</h4>
                        <Badge variant="secondary">
                          {currency.transactions} transactions
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-secondary">
                          {formatCurrency(currency.amount, currency.currency)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Moyenne: {formatCurrency(currency.amount / currency.transactions, currency.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {royaltiesByCurrency.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Aucune donnée de revenus disponible
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Livres les Plus Performants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded" />
                        <div className="w-1/2 h-3 bg-gray-200 animate-pulse rounded" />
                      </div>
                      <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {topPerformers?.slice(0, 10).map((book, index) => (
                    <div key={book.asin} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 h-8 flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 line-clamp-2 max-w-md">
                            {book.title}
                          </h4>
                          <p className="text-sm text-gray-500">ASIN: {book.asin}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>{book.marketplace || 'N/A'}</span>
                            <span>{book.totalSales} transactions</span>
                            <span>{book.currency}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-secondary">
                          {formatCurrency(book.totalRoyalty, book.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Répartition par Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketplaceLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={marketplaceData}
                        dataKey="totalRoyalty"
                        nameKey="marketplace"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ marketplace, percent }) => 
                          `${marketplace} (${(percent * 100).toFixed(1)}%)`
                        }
                      >
                        {marketplaceData?.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={MARKETPLACE_COLORS[entry.marketplace as keyof typeof MARKETPLACE_COLORS] || '#8884d8'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Royautés']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails par Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                {marketplaceLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-full h-16 bg-gray-200 animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {marketplaceData?.map((marketplace) => (
                      <div key={`${marketplace.marketplace}-${marketplace.currency}`} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{marketplace.marketplace}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{marketplace.currency}</Badge>
                            <Badge style={{ backgroundColor: MARKETPLACE_COLORS[marketplace.marketplace as keyof typeof MARKETPLACE_COLORS] || '#8884d8' }}>
                              {marketplace.uniqueBooks} livres
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Revenus:</span>
                            <div className="font-medium text-secondary">
                              {formatCurrency(marketplace.totalRoyalty, marketplace.currency)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Transactions:</span>
                            <div className="font-medium">
                              {marketplace.totalSales.toLocaleString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="books" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Détaillée des Livres</CardTitle>
            </CardHeader>
            <CardContent>
              {performersLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topPerformers?.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="title" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      fontSize={10}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'totalRoyalty' ? formatCurrency(Number(value)) : value,
                        name === 'totalRoyalty' ? 'Royautés' : 'Unités'
                      ]}
                      labelFormatter={(label) => `Livre: ${label}`}
                    />
                    <Bar dataKey="totalRoyalty" fill="#38b6ff" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exchange Rates Tab */}
        <TabsContent value="exchange" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Taux de Change
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestion des taux de conversion monétaire pour les analytics unifiés
                </p>
              </div>
              <Button 
                onClick={updateExchangeRates}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chargement des taux de change...</p>
                  </div>
                ) : exchangeRates && exchangeRates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exchangeRates.map((rate: any) => (
                      <Card key={rate.currency} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{rate.currency}</p>
                            <p className="text-sm text-muted-foreground">
                              Dernière mise à jour: {new Date(rate.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {parseFloat(rate.rate).toFixed(4)}
                            </p>
                            <p className="text-xs text-muted-foreground">EUR → {rate.currency}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Aucun taux de change disponible. Cliquez sur "Actualiser" pour charger les données.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Currency Converter Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Convertisseur de Devises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium">Montant</label>
                  <input 
                    type="number" 
                    placeholder="100.00"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    id="convert-amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">De</label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="EUR" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchangeRates?.map((rate: any) => (
                        <SelectItem key={rate.currency} value={rate.currency}>
                          {rate.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Vers</label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchangeRates?.map((rate: any) => (
                        <SelectItem key={rate.currency} value={rate.currency}>
                          {rate.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  Convertir
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Résultat de la conversion s'affichera ici
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
