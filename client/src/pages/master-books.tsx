import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  TrendingUp, 
  BookOpen, 
  DollarSign, 
  BarChart3,
  Calendar,
  Globe,
  Users,
  Filter
} from 'lucide-react';

interface MasterBook {
  id: string;
  asin: string;
  isbn: string | null;
  title: string;
  authorName: string | null;
  format: string | null;
  firstSaleDate: string | null;
  lastSaleDate: string | null;
  totalUnitsSold: number;
  totalUnitsRefunded: number;
  netUnitsSold: number;
  totalKenpRead: number;
  totalRoyaltiesOriginal: Record<string, number>;
  totalRoyaltiesUSD: string;
  marketplaceBreakdown: Record<string, any>;
  salesBreakdown: Record<string, any>;
  currentListPrice: string | null;
  currentOfferPrice: string | null;
  currentCurrency: string | null;
  lastImportDate: string | null;
  sourceImportIds: string[];
  createdAt: string;
  updatedAt: string;
}

const MasterBooksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'sales' | 'recent'>('revenue');

  const { data: masterBooks, isLoading, error } = useQuery<MasterBook[]>({
    queryKey: ['/api/master-books'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredAndSortedBooks = React.useMemo(() => {
    if (!masterBooks) return [];
    
    let filtered = masterBooks.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.authorName && book.authorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedFormat !== 'all') {
      filtered = filtered.filter(book => book.format === selectedFormat);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return parseFloat(b.totalRoyaltiesUSD) - parseFloat(a.totalRoyaltiesUSD);
        case 'sales':
          return b.netUnitsSold - a.netUnitsSold;
        case 'recent':
          return new Date(b.lastSaleDate || 0).getTime() - new Date(a.lastSaleDate || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [masterBooks, searchTerm, selectedFormat, sortBy]);

  const aggregateStats = React.useMemo(() => {
    if (!masterBooks) return null;
    
    const totalBooks = masterBooks.length;
    const totalRevenue = masterBooks.reduce((sum, book) => sum + parseFloat(book.totalRoyaltiesUSD), 0);
    const totalSales = masterBooks.reduce((sum, book) => sum + book.netUnitsSold, 0);
    const totalKenp = masterBooks.reduce((sum, book) => sum + book.totalKenpRead, 0);
    
    // Marketplace breakdown
    const marketplaces = new Set<string>();
    const formats = new Set<string>();
    
    masterBooks.forEach(book => {
      if (book.format) formats.add(book.format);
      Object.keys(book.marketplaceBreakdown || {}).forEach(mp => marketplaces.add(mp));
    });

    return {
      totalBooks,
      totalRevenue,
      totalSales,
      totalKenp,
      averageRevenuePerBook: totalRevenue / totalBooks,
      marketplaces: Array.from(marketplaces),
      formats: Array.from(formats)
    };
  }, [masterBooks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Impossible de charger les données des livres maîtres.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Livres Maîtres - Vue d'ensemble ASIN
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyse consolidée de tous vos livres par ASIN avec données de ventes et paiements
          </p>
        </div>

        {/* Stats Cards */}
        {aggregateStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Livres totaux
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {aggregateStats.totalBooks}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Revenus totaux (USD)
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${aggregateStats.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ventes totales
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {aggregateStats.totalSales.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pages KENP lues
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {aggregateStats.totalKenp.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par titre, ASIN ou auteur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={selectedFormat} 
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="all">Tous formats</option>
                  {aggregateStats?.formats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="revenue">Trier par revenus</option>
                  <option value="sales">Trier par ventes</option>
                  <option value="recent">Trier par récent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Books List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredAndSortedBooks.map((book) => (
            <Card key={book.asin} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Book Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {book.title}
                        </h3>
                        {book.authorName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            par {book.authorName}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            ASIN: {book.asin}
                          </Badge>
                          {book.format && (
                            <Badge variant="secondary" className="text-xs">
                              {book.format}
                            </Badge>
                          )}
                          {book.isbn && (
                            <Badge variant="outline" className="text-xs">
                              ISBN: {book.isbn}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sales Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {book.netUnitsSold}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Ventes nettes</p>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${parseFloat(book.totalRoyaltiesUSD).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Revenus USD</p>
                      </div>

                      {book.totalKenpRead > 0 && (
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {book.totalKenpRead.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Pages KENP</p>
                        </div>
                      )}

                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {Object.keys(book.marketplaceBreakdown || {}).length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Marketplaces</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {book.firstSaleDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Première vente: {new Date(book.firstSaleDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {book.lastSaleDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Dernière vente: {new Date(book.lastSaleDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Original Currencies */}
                  {book.totalRoyaltiesOriginal && Object.keys(book.totalRoyaltiesOriginal).length > 0 && (
                    <div className="min-w-[200px]">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Revenus par devise
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(book.totalRoyaltiesOriginal).map(([currency, amount]) => (
                          <div key={currency} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{currency}:</span>
                            <span className="font-medium">{amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedBooks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun livre trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? `Aucun livre ne correspond à "${searchTerm}"`
                  : "Aucun livre master trouvé. Importez des données KDP pour commencer."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MasterBooksPage;