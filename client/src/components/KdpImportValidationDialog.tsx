import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Database, Layers, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ImportPreview {
  totalBooks: number;
  existingBooks: number;
  newBooks: number;
  booksWithoutId: number; // Books without ASIN/ISBN
  totalSalesData: number;
  duplicateSalesData: number;
  missingAuthorData: number;
}

interface KdpImportValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ImportOptions) => void;
  importData: any;
  preview: ImportPreview | null;
  isLoading: boolean;
}

export interface ImportOptions {
  importType: 'books_only' | 'sales_only' | 'both';
  updateExistingBooks: boolean;
  updateExistingSalesData: boolean;
}

export function KdpImportValidationDialog({
  isOpen,
  onClose,
  onConfirm,
  importData,
  preview,
  isLoading
}: KdpImportValidationDialogProps) {
  const [importType, setImportType] = useState<ImportOptions['importType']>('both');
  const [updateExistingBooks, setUpdateExistingBooks] = useState(false);
  const [updateExistingSalesData, setUpdateExistingSalesData] = useState(true);

  // Safe preview with defaults
  const safePreview: ImportPreview = preview || {
    totalBooks: 0,
    existingBooks: 0,
    newBooks: 0,
    booksWithoutId: 0,
    totalSalesData: 0,
    duplicateSalesData: 0,
    missingAuthorData: 0
  };

  const handleConfirm = () => {
    onConfirm({
      importType,
      updateExistingBooks,
      updateExistingSalesData
    });
  };

  const getImportTypeDescription = (type: ImportOptions['importType']) => {
    switch (type) {
      case 'books_only':
        return 'Importer uniquement les livres (créer/mettre à jour les livres sans toucher aux données de vente)';
      case 'sales_only':
        return 'Importer uniquement les données de vente (pas de création/modification de livres)';
      case 'both':
        return 'Importer les livres ET les données de vente (recommandé pour un import complet)';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 animate-spin" />
              Analyse du fichier...
            </DialogTitle>
            <DialogDescription>
              Analyse des données en cours pour préparer l'aperçu d'import...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Validation d'import KDP
          </DialogTitle>
          <DialogDescription>
            Configurez les options d'import pour vos données KDP. Sélectionnez ce que vous souhaitez importer et comment traiter les données existantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Aperçu des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">📚 Livres détectés</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total des livres :</span>
                      <Badge variant="secondary">{safePreview.totalBooks}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Livres existants :</span>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">{safePreview.existingBooks}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Nouveaux livres :</span>
                      <Badge className="bg-green-50 text-green-700 border-green-200">{safePreview.newBooks}</Badge>
                    </div>
                    {safePreview.booksWithoutId > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600">Sans ASIN/ISBN :</span>
                        <Badge className="bg-orange-50 text-orange-700 border-orange-200">{safePreview.booksWithoutId}</Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">💰 Données de vente</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total des entrées :</span>
                      <Badge variant="secondary">{safePreview.totalSalesData}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Doublons détectés :</span>
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">{safePreview.duplicateSalesData}</Badge>
                    </div>
                    {safePreview.missingAuthorData > 0 && (
                      <div className="flex justify-between">
                        <span className="text-orange-600">Auteurs manquants :</span>
                        <Badge className="bg-orange-50 text-orange-700 border-orange-200">{safePreview.missingAuthorData}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {safePreview.booksWithoutId > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <strong>Attention :</strong> {safePreview.booksWithoutId} livre(s) n'ont ni ASIN ni ISBN. 
                      Ces livres ne seront pas créés/mis à jour car l'identifiant unique est requis.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Type d'import</CardTitle>
              <CardDescription>
                Choisissez ce que vous souhaitez importer depuis ce fichier KDP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={importType} onValueChange={setImportType as any}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="books_only" id="books_only" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="books_only" className="font-medium cursor-pointer">
                        📚 Importer les livres uniquement
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {getImportTypeDescription('books_only')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="sales_only" id="sales_only" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="sales_only" className="font-medium cursor-pointer">
                        💰 Importer les données de vente uniquement
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {getImportTypeDescription('sales_only')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 bg-blue-50 border-blue-200">
                    <RadioGroupItem value="both" id="both" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="both" className="font-medium cursor-pointer">
                        🔄 Importer les livres ET les données de vente
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {getImportTypeDescription('both')}
                      </p>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-2">Recommandé</Badge>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Update Options */}
          {(importType === 'books_only' || importType === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options de mise à jour des livres</CardTitle>
                <CardDescription>
                  Comment traiter les livres qui existent déjà dans votre bibliothèque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox 
                    id="updateExistingBooks" 
                    checked={updateExistingBooks}
                    onCheckedChange={(checked) => setUpdateExistingBooks(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="updateExistingBooks" className="font-medium cursor-pointer">
                      Mettre à jour les données des livres existants
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Si coché, les informations des livres existants seront mises à jour avec les nouvelles données (titre, auteur, etc.).
                      Si non coché, seuls les nouveaux livres seront créés.
                    </p>
                    {safePreview.existingBooks > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        Affectera {safePreview.existingBooks} livre(s) existant(s)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(importType === 'sales_only' || importType === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options de mise à jour des ventes</CardTitle>
                <CardDescription>
                  Comment traiter les données de vente existantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox 
                    id="updateExistingSalesData" 
                    checked={updateExistingSalesData}
                    onCheckedChange={(checked) => setUpdateExistingSalesData(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="updateExistingSalesData" className="font-medium cursor-pointer">
                      Mettre à jour les données de vente existantes
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Si coché, les données de vente en doublon seront mises à jour.
                      Si non coché, les doublons seront ignorés.
                    </p>
                    {safePreview.duplicateSalesData > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        Affectera {safePreview.duplicateSalesData} entrée(s) en doublon
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <div className="flex-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Les données seront traitées selon vos paramètres ci-dessus</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
              Confirmer l'import
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}