import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Globe, RefreshCw, Download, TrendingUp, Clock } from "lucide-react";

export default function ExchangeRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch exchange rates
  const { data: exchangeRates, isLoading, error } = useQuery({
    queryKey: ["/api/exchange-rates"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Function to update exchange rates manually
  const updateExchangeRates = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/exchange-rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        toast({
          title: "Exchange Rates Updated",
          description: "Exchange rates have been successfully updated.",
        });
        // Refetch exchange rates data
        queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      } else {
        throw new Error('Failed to update exchange rates');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update exchange rates.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Group currencies by major/minor for better organization
  const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'CAD', 'AUD'];
  const rates = Array.isArray(exchangeRates) ? exchangeRates : [];
  // Add USD with rate 1.0 since it's our base currency and filter out duplicate
  const usdRate = { currency: 'USD', rate: '1.00000000', updatedAt: new Date().toISOString() };
  const filteredRates = rates.filter((rate: any) => rate.currency !== 'USD').map((rate: any) => ({
    ...rate,
    updatedAt: rate.updatedAt || new Date().toISOString() // Add current timestamp if missing
  }));
  const allRates = [usdRate, ...filteredRates];
  const majorRates = allRates.filter((rate: any) => majorCurrencies.includes(rate.currency));
  const otherRates = filteredRates.filter((rate: any) => !majorCurrencies.includes(rate.currency));

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Exchange Rates</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load exchange rate data. Please try again.
            </p>
            <Button onClick={updateExchangeRates} disabled={isUpdating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Exchange Rates</h1>
            <p className="text-muted-foreground">
              Real-time currency exchange rates with USD as base currency
            </p>
          </div>
          <Button 
            onClick={updateExchangeRates}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Update Rates'}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rates.length > 0 ? (
          <div className="space-y-8">
            {/* Major Currencies */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Major Currencies</h2>
                <Badge variant="secondary">{majorRates.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {majorRates.map((rate: any) => (
                  <Card key={rate.currency} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary text-sm">
                              {rate.currency}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{rate.currency}</p>
                            <p className="text-sm text-muted-foreground">
                              1 USD = {parseFloat(rate.rate).toFixed(4)} {rate.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rate:</span>
                          <span className="font-mono font-bold">
                            {parseFloat(rate.rate).toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated:
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(rate.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Other Currencies */}
            {otherRates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Other Currencies</h2>
                  <Badge variant="secondary">{otherRates.length}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {otherRates.map((rate: any) => (
                    <Card key={rate.currency} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{rate.currency}</span>
                          <Badge variant="outline" className="text-xs">
                            {parseFloat(rate.rate).toFixed(4)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(rate.updatedAt).toLocaleDateString('en-US')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exchange Rate Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {rates.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Currencies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {majorRates.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Major Currencies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {rates.length > 0 && rates[0]?.updatedAt
                        ? new Date(rates[0].updatedAt).toLocaleDateString('en-US')
                        : 'N/A'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Exchange Rates Available</h2>
            <p className="text-muted-foreground mb-4">
              Click "Update Rates" to load the latest exchange rate data.
            </p>
            <Button onClick={updateExchangeRates} disabled={isUpdating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              Update Rates
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}