import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, FileText, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TestResult {
  success: boolean;
  detectedType: string;
  totalProcessed: number;
  errors: number;
  importId: string;
  detectedSheets: string[];
  filteredRecords: number;
  sampleRecords: any[];
}

export default function RoyaltiesEstimatorTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-royalties-estimator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Test KDP Royalties Estimator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testez le nouveau système de traitement des fichiers KDP_Royalties_Estimator avec reconnaissance automatique et filtrage des transactions cibles.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test du Processeur
            </CardTitle>
            <CardDescription>
              Testera la détection automatique et le traitement du fichier KDP_Royalties_Estimator avec filtrage pour "Free - Promotion" et "Expanded Distribution Channels".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTest} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Test en cours...' : 'Lancer le Test'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-6">
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Résultat du Test</AlertTitle>
              <AlertDescription>
                {testResult.success 
                  ? 'Test réussi - Le nouveau système fonctionne correctement'
                  : 'Test échoué - Vérifiez les logs pour plus de détails'
                }
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Type Détecté</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={testResult.detectedType === 'royalties_estimator' ? 'default' : 'secondary'}>
                    {testResult.detectedType}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Enregistrements Traités</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{testResult.totalProcessed}</div>
                  <p className="text-xs text-gray-500 mt-1">Erreurs: {testResult.errors}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Enregistrements Filtrés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{testResult.filteredRecords}</div>
                  <p className="text-xs text-gray-500 mt-1">Transactions cibles</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Onglets Détectés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{testResult.detectedSheets?.length || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Feuilles Excel</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Onglets du Fichier</CardTitle>
                <CardDescription>
                  Feuilles Excel détectées dans le fichier KDP_Royalties_Estimator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {testResult.detectedSheets?.map((sheet, index) => (
                    <Badge key={index} variant="outline">
                      {sheet}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {testResult.sampleRecords && testResult.sampleRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Exemples d'Enregistrements Filtrés</CardTitle>
                  <CardDescription>
                    Premiers enregistrements correspondant aux transactions "Free - Promotion" et "Expanded Distribution Channels"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResult.sampleRecords.map((record, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Titre: </span>
                            {record.title || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Type: </span>
                            <Badge variant="secondary" className="text-xs">
                              {record.transactionType || 'N/A'}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Royalty: </span>
                            {record.royalty || '0'} {record.currency || ''}
                          </div>
                          <div>
                            <span className="font-medium">ASIN: </span>
                            {record.asinIsbn || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Marketplace: </span>
                            {record.marketplace || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Onglet: </span>
                            {record.sheetName || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informations Techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">ID Import: </span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {testResult.importId}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Critères de Filtrage: </span>
                    <Badge variant="outline" className="ml-2">Free - Promotion</Badge>
                    <Badge variant="outline" className="ml-2">Expanded Distribution Channels</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}