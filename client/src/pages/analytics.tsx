import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Globe, BookOpen, Users, Calendar, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface DetailedCurrency {
  currency: string;
  totalRoyalty: number;
  transactionCount: number;
  formatsCount: number;
  booksCount: number;
  formats: string[];
}

interface DetailedConversion {
  currency: string;
  originalAmount: number;
  exchangeRate: number;
  amountInEUR: number;
  transactionCount: number;
  formatsCount: number;
  booksCount: number;
}

interface DetailedAnalytics {
  method: string;
  description: string;
  totalRecords: number;
  uniqueBooks: number;
  uniqueMarketplaces: number;
  uniqueFormats: number;
  royaltiesByCurrency: DetailedCurrency[];
  totalInEUR: number;
  conversions: DetailedConversion[];
  totalCurrencies: number;
  totalTransactions: number;
}

interface LegacyOverview {
  totalImports: string;
  totalRecords: string;
  totalRevenueUSD: string;
  averageRoyaltyUSD: string;
  uniqueBooks: string;
  uniqueMarketplaces: string;
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

interface SalesTrend {
  date: string;
  sales: number;
  royalty: number;
  units: number;
}

const COLORS = ['#38b6ff', '#ff9900', '#146eb4', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Main detailed analytics (expert method)
  const { data: detailedData, isLoading: detailedLoading, refetch: refetchDetailed } = useQuery<DetailedAnalytics>({
    queryKey: ['/api/analytics/detailed'],
  };

  // Legacy data for comparison
  const { data: legacyData, isLoading: legacyLoading } = useQuery<LegacyOverview>({
    queryKey: ['/api/analytics/overview'],
  };

  // Supporting data
  const { data: topPerformers, isLoading: topPerformersLoading } = useQuery<TopPerformer[]>({
    queryKey: ['/api/analytics/top-performers'],
  };

  const { data: marketplaceData, isLoading: marketplaceLoading } = useQuery<MarketplaceData[]>({
    queryKey: ['/api/analytics/marketplace-breakdown'],
  };

  const { data: salesTrends, isLoading: trendsLoading } = useQuery<SalesTrend[]>({
    queryKey: [`/api/analytics/sales-trends/${selectedPeriod}`],
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const refreshAllData = () => {
    refetchDetailed();
    toast({
      title: "Données actualisées",
      description: "Les analytics ont été mises à jour"
  };
  };

  const isLoading = detailedLoading || legacyLoading || topPerformersLoading || marketplaceLoading || trendsLoading;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              Analytics KDP
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyse complète de vos revenus avec la méthode experte
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Méthode experte validée
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Montants originaux préservés
              </Badge>
            </div>
          </div>
          
          <Button onClick={refreshAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              )))}
            </div>
          </div>
        ) : (
          <>
            {/* Main Overview Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Total Revenus EUR</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {detailedData ? formatCurrency(detailedData.totalInEUR, 'EUR') : '€0.00'}
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Taux BCE - Méthode experte
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {detailedData?.totalRecords.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    De {detailedData?.totalCurrencies || 0} devises
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Livres Uniques</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {detailedData?.uniqueBooks || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sur {detailedData?.uniqueMarketplaces || 0} marchés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Formats</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {detailedData?.uniqueFormats || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    eBook, Paperback, Hardcover
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="currencies">Devises</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="comparison">Comparaison</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Currency Distribution Chart */}
                {detailedData?.royaltiesByCurrency && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition des Revenus par Devise</CardTitle>
                      <CardDescription>Montants originaux sans conversion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={detailedData.royaltiesByCurrency}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="currency" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [value.toLocaleString(), 'Montant']} />
                          <Bar dataKey="totalRoyalty" fill="#38b6ff" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}

                {/* EUR Conversion Pie Chart */}
                {detailedData?.conversions && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition en EUR (Conversion BCE)</CardTitle>
                      <CardDescription>Distribution des revenus convertis en euros</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={detailedData.conversions}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="amountInEUR"
                            label={({ currency, amountInEUR }) => `${currency}: ${amountInEUR.toFixed(0))}€`}
                          >
                            {detailedData.conversions.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            )))}
                          </Pie>
                          <Tooltip formatter={ (value) => [`${Number(value).toFixed(2))}€`, 'Montant EUR']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )))}
              </TabsContent>

              <TabsContent value="currencies" className="space-y-6">
                {/* Currency Details */}
                {detailedData?.royaltiesByCurrency && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Détail par Devise</CardTitle>
                      <CardDescription>Montants originaux et conversions EUR</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {detailedData.royaltiesByCurrency.map((curr, index) => {
                          const conversion = detailedData.conversions.find(c => c.currency === curr.currency);
                          return (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono text-lg">
                                  {curr.currency}
                                </Badge>
                                <div>
                                  <div className="font-bold text-lg">
                                    { formatCurrency(curr.totalRoyalty, curr.currency))}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {curr.transactionCount} transactions • {curr.formatsCount} formats
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                { conversion && (
                                  <>
                                    <div className="font-bold text-green-700">
                                      {formatCurrency(conversion.amountInEUR, 'EUR'))}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Taux: 1 EUR = { conversion.exchangeRate.toFixed(4))} {curr.currency}
                                    </div>
                                  </>
                                )))}
                              </div>
                            </div>
                          );
                        })))}
                      </div>
                    </CardContent>
                  </Card>
                )))}
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {/* Top Performers */}
                {topPerformers && topPerformers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Livres Performants</CardTitle>
                      <CardDescription>Livres générant le plus de revenus</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topPerformers.slice(0, 5).map((book, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">#{index + 1}</Badge>
                              <div>
                                <div className="font-medium line-clamp-2">{book.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {book.marketplace} • ASIN: {book.asin}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{ book.totalRoyalty.toFixed(2))} {book.currency}</div>
                              <div className="text-sm text-muted-foreground">
                                {book.totalUnits} unités
                              </div>
                            </div>
                          </div>
                        )))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Sales Trends */}
                {salesTrends && salesTrends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tendances des Ventes</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2">
                          <span>Évolution sur {selectedPeriod} jours</span>
                          <select 
                            value={selectedPeriod}
                            onChange={ (e) => setSelectedPeriod(e.target.value }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="7">7 jours</option>
                            <option value="30">30 jours</option>
                            <option value="90">90 jours</option>
                          </select>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="royalty" stroke="#38b6ff" name="Royalties" />
                          <Line type="monotone" dataKey="units" stroke="#ff9900" name="Unités" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )))}
              </TabsContent>

              <TabsContent value="comparison" className="space-y-6">
                {/* Method Comparison */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Nouvelle Méthode (Experte)
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        Extraction des onglets détaillés uniquement
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-green-800">
                      { detailedData && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Total EUR:</span>
                            <Badge className="bg-green-200 text-green-900">
                              {formatCurrency(detailedData.totalInEUR, 'EUR'))}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Transactions:</span>
                            <Badge variant="outline">{detailedData.totalRecords}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Devises:</span>
                            <Badge variant="outline">{detailedData.totalCurrencies}</Badge>
                          </div>
                          <div className="text-xs space-y-1 pt-2 border-t border-green-300">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Onglets détaillés seulement</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pas de doublons</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Montants originaux</span>
                            </div>
                          </div>
                        </div>
                      )))}
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Ancienne Méthode (Legacy)
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        Système avec conversions et doublons
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-orange-800">
                      {legacyData && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Total USD:</span>
                            <Badge className="bg-orange-200 text-orange-900">
                              ${legacyData.totalRevenueUSD}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Records:</span>
                            <Badge variant="outline">{legacyData.totalRecords}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Imports:</span>
                            <Badge variant="outline">{legacyData.totalImports}</Badge>
                          </div>
                          <div className="text-xs space-y-1 pt-2 border-t border-orange-300">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Inclut données "Combined Sales"</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Conversions automatiques</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Doublons potentiels</span>
                            </div>
                          </div>
                        </div>
                      )))}
                    </CardContent>
                  </Card>
                </div>

                {/* Method Explanation */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pourquoi la Nouvelle Méthode est Plus Précise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="p-4 bg-green-50 border border-green-200 rounded">
                        <h4 className="font-medium text-green-900 mb-2">✅ Méthode Experte</h4>
                        <ul className="space-y-1 text-green-800">
                          <li>• Extraction directe des onglets "eBook Royalty" + "Paperback Royalty" + "Hardcover Royalty"</li>
                          <li>• Exclusion des données "Combined Sales" qui créent des doublons</li>
                          <li>• Préservation des montants originaux par devise</li>
                          <li>• Conversion EUR avec taux BCE officiels</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                        <h4 className="font-medium text-orange-900 mb-2">⚠️ Problèmes de l'Ancienne Méthode</h4>
                        <ul className="space-y-1 text-orange-800">
                          <li>• Inclut les données "Combined Sales" (doublons avec les détails)</li>
                          <li>• Inclut les données "Payments" (historiques cumulatives)</li>
                          <li>• Conversions automatiques approximatives</li>
                          <li>• Perte des montants originaux</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )))}
      </div>
    </Layout>
  );
}