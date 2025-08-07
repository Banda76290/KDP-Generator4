import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { KdpImportValidationDialog, type ImportOptions } from '@/components/KdpImportValidationDialog';

interface GlobalKdpImportContextType {
  uploadFile: (file: File) => void;
  isUploading: boolean;
}

const GlobalKdpImportContext = createContext<GlobalKdpImportContextType | null>(null);

export function useGlobalKdpImport() {
  const context = useContext(GlobalKdpImportContext);
  if (!context) {
    throw new Error('useGlobalKdpImport must be used within GlobalKdpImportProvider');
  }
  return context;
}

interface GlobalKdpImportProviderProps {
  children: ReactNode;
}

function getDetectedTypeDescription(type: string): string {
  switch (type) {
    case 'royalties_estimator':
      return 'KDP Royalties Estimator';
    case 'payments':
      return 'KDP Payment Report';
    case 'sales_dashboard':
      return 'KDP Sales Dashboard Report';
    default:
      return 'Unknown KDP File Type';
  }
}

export function GlobalKdpImportProvider({ children }: GlobalKdpImportProviderProps) {
  const { toast } = useToast();
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [selectedImportForValidation, setSelectedImportForValidation] = useState<string | null>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/api/kdp-imports/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: async (data) => {
      toast({
        title: "File uploaded successfully",
        description: `Detected: ${getDetectedTypeDescription(data.parsedData.detectedType)}`,
        variant: "success",
      });
      
      const importId = data.import?.id;
      if (importId) {
        // If it's a royalties_estimator file, open validation dialog immediately
        if (data.parsedData.detectedType === 'royalties_estimator') {
          // Create a basic preview from upload response data
          const basicPreview = {
            totalBooks: data.parsedData.summary?.estimatedRecords || 0,
            existingBooks: 0, // Will be calculated during processing
            newBooks: data.parsedData.summary?.estimatedRecords || 0,
            booksWithoutId: 0,
            totalSalesData: data.parsedData.summary?.estimatedRecords || 0,
            duplicateSalesData: 0,
            missingAuthorData: 0
          };
          
          // Open validation dialog immediately - GLOBALLY
          setImportPreview(basicPreview);
          setSelectedImportForValidation(importId);
          setValidationDialogOpen(true);
          
          return; // Don't start any automatic processing
        }
        
        // For other file types, refresh imports if we're on import management page
        queryClient.invalidateQueries({ queryKey: ['/api/kdp-imports'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Process books mutation for the global dialog
  const processBooksMutation = useMutation({
    mutationFn: async ({ importId, options }: { importId: string; options: ImportOptions }) => {
      // Check if this is a new import (pending status) that needs to start processing
      const imports = await queryClient.fetchQuery({
        queryKey: ['/api/kdp-imports'],
        queryFn: () => apiRequest('/api/kdp-imports', { method: 'GET' })
      });
      
      const importRecord = imports.find((imp: any) => imp.id === importId);
      
      if (importRecord?.status === 'pending') {
        // Use start-processing endpoint for new imports
        return apiRequest(`/api/kdp-imports/${importId}/start-processing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            importType: options.importType,
            updateExistingBooks: options.updateExistingBooks,
            updateExistingSalesData: options.updateExistingSalesData,
          }),
        });
      } else {
        // Use existing process-books endpoint for completed imports
        return apiRequest(`/api/kdp-imports/${importId}/process-books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            importType: options.importType,
            updateExistingBooks: options.updateExistingBooks,
            updateExistingSalesData: options.updateExistingSalesData,
          }),
        });
      }
    },
    onSuccess: (data, variables) => {
      const { importId } = variables;
      
      toast({
        title: "Processing started successfully",
        description: data.message || "Your import is being processed with your chosen settings",
        variant: "success",
      });
      
      // Close the global validation dialog
      setValidationDialogOpen(false);
      setSelectedImportForValidation(null);
      setImportPreview(null);
      
      // Refresh imports
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kdp-imports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process books",
        variant: "destructive",
      });
    },
  });

  const contextValue: GlobalKdpImportContextType = {
    uploadFile: (file: File) => uploadMutation.mutate(file),
    isUploading: uploadMutation.isPending,
  };

  return (
    <GlobalKdpImportContext.Provider value={contextValue}>
      {children}
      
      {/* Global KDP Import Validation Dialog */}
      <KdpImportValidationDialog
        isOpen={validationDialogOpen}
        onClose={() => {
          setValidationDialogOpen(false);
          setSelectedImportForValidation(null);
          setImportPreview(null);
        }}
        onConfirm={(options) => {
          if (selectedImportForValidation) {
            processBooksMutation.mutate({
              importId: selectedImportForValidation,
              options
            });
          }
        }}
        importData={selectedImportForValidation}
        preview={importPreview}
        isLoading={processBooksMutation.isPending}
      />
    </GlobalKdpImportContext.Provider>
  );
}