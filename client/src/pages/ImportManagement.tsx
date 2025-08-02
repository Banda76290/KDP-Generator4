import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Trash2, Eye, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import type { KdpImportWithRelations } from '@shared/schema';

interface ImportProgress {
  status: string;
  progress: number;
  processedRecords: number;
  totalRecords: number;
  errorRecords: number;
  duplicateRecords: number;
  errorLog: string[];
  summary: any;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case 'processing':
      return <Badge className="bg-primary/10 dark:bg-primary/20 text-primary border-primary/20"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
    case 'failed':
      return <Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    case 'pending':
      return <Badge className="bg-secondary/10 dark:bg-secondary/20 text-secondary border-secondary/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getDetectedTypeDescription = (detectedType: string) => {
  switch (detectedType) {
    case 'orders':
      return 'KDP Orders Report - Book sales and transactions';
    case 'payments':
      return 'KDP Payments Report - Royalty payments received';
    case 'royalties_estimator':
      return 'KDP Royalties Estimator - Revenue projections';
    case 'prior_month_royalties':
      return 'KDP Prior Month Royalties - Previous month earnings';
    case 'kenp_read':
      return 'KDP KENP Read Report - Kindle Edition Normalized Pages read';
    case 'dashboard':
      return 'KDP Dashboard Export - General performance data';
    default:
      return `KDP Report (${detectedType})`;
  }
};

export default function ImportManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedImport, setExpandedImport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user imports
  const { data: imports = [], isLoading } = useQuery<KdpImportWithRelations[]>({
    queryKey: ['/api/kdp-imports'],
  });

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
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kdp-imports'] });
      setSelectedFile(null);
      
      // Auto-expand and monitor the newly uploaded import
      const importId = data.import?.id;
      if (importId) {
        setExpandedImport(importId);
        // Wait a moment for the UI to update, then start monitoring
        setTimeout(() => monitorImportProgress(importId), 500);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setSelectedFile(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (importId: string) => {
      return apiRequest(`/api/kdp-imports/${importId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Import deleted",
        description: "Import and all associated data have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kdp-imports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete import",
        variant: "destructive",
      });
    },
  });

  // Fetch import progress (no polling - only manual refresh)
  const { data: importProgress, refetch: refetchProgress } = useQuery<ImportProgress>({
    queryKey: ['/api/kdp-imports', expandedImport, 'progress'],
    enabled: !!expandedImport,
    refetchInterval: false, // Disable polling completely
  });

  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = (importId: string) => {
    if (confirm('Are you sure you want to delete this import? This action cannot be undone.')) {
      deleteMutation.mutate(importId);
    }
  };

  const toggleExpandImport = async (importId: string) => {
    const newExpandedImport = expandedImport === importId ? null : importId;
    setExpandedImport(newExpandedImport);
    
    // If expanding an import, start monitoring its progress
    if (newExpandedImport) {
      await monitorImportProgress(newExpandedImport);
    }
  };

  // Monitor import progress with intelligent refresh
  const monitorImportProgress = async (importId: string) => {
    const checkProgress = async () => {
      try {
        // Refresh progress data
        const result = await refetchProgress();
        const progress = result.data;
        
        // If still processing, schedule next check
        if (progress && progress.status === 'processing') {
          // Wait 3 seconds before next check
          setTimeout(checkProgress, 3000);
        } else if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
          // Import finished, refresh the import list to show final status
          queryClient.invalidateQueries({ queryKey: ['/api/kdp-imports'] });
          
          // Show completion notification
          if (progress.status === 'completed') {
            toast({
              title: "Import completed",
              description: `Successfully processed ${progress.processedRecords} records`,
            });
          } else if (progress.status === 'failed') {
            toast({
              title: "Import failed",
              description: "Check the error log for details",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error checking import progress:', error);
      }
    };

    // Start monitoring only if the import is still expanded
    if (expandedImport === importId) {
      await checkProgress();
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          KDP Import Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload and manage your Amazon KDP reports for analysis and data integration.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload KDP Report
          </CardTitle>
          <CardDescription>
            Select or drag & drop your KDP export files (.xlsx, .xls, .csv)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}  
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedFile(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Drop your KDP files here
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Or click to browse and select files
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            View and manage your previously uploaded KDP reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading imports...</p>
            </div>
          ) : imports.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No imports yet
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Upload your first KDP report to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {imports.map((importRecord) => (
                <div key={importRecord.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {importRecord.fileName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getDetectedTypeDescription(importRecord.detectedType)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(importRecord.fileSize)}</span>
                        <span>
                          {format(new Date(importRecord.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {importRecord.totalRecords > 0 && (
                          <span>{importRecord.totalRecords} records</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(importRecord.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpandImport(importRecord.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(importRecord.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedImport === importRecord.id && importProgress && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Progress Bar */}
                      {importProgress.status === 'processing' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Processing...</span>
                            <span>{importProgress.progress}%</span>
                          </div>
                          <Progress value={importProgress.progress} className="w-full" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {importProgress.processedRecords} of {importProgress.totalRecords} records processed
                          </p>
                        </div>
                      )}

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
                          <div className="text-2xl font-bold text-primary">
                            {importProgress.processedRecords || 0}
                          </div>
                          <div className="text-sm text-primary/70 font-medium">Processed</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                            {importProgress.totalRecords || 0}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {importProgress.errorRecords || 0}
                          </div>
                          <div className="text-sm text-red-600/70 dark:text-red-400/70 font-medium">Errors</div>
                        </div>
                        <div className="text-center p-4 bg-secondary/10 dark:bg-secondary/20 rounded-lg border border-secondary/20">
                          <div className="text-2xl font-bold text-secondary dark:text-secondary">
                            {importProgress.duplicateRecords || 0}
                          </div>
                          <div className="text-sm text-secondary/70 font-medium">Duplicates</div>
                        </div>
                      </div>

                      {/* Error Log */}
                      {importProgress.errorLog && importProgress.errorLog.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-600">Error Log</h4>
                          <div className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm max-h-40 overflow-y-auto">
                            {importProgress.errorLog.map((error, index) => (
                              <div key={index} className="mb-1 text-red-700 dark:text-red-300">
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}