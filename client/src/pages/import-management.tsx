import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import type { KdpImport } from "@shared/schema";

export default function ImportManagementPage() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch import history
  const { data: imports = [], isLoading: importsLoading } = useQuery({
    queryKey: ["/api/imports"],
    queryFn: () => apiRequest("/api/imports", { method: "GET" }),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch("/api/imports/upload", {
        method: "POST",
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      setSelectedFile(null);
    },
  });

  // Delete import mutation
  const deleteMutation = useMutation({
    mutationFn: (importId: string) => 
      apiRequest(`/api/imports/${importId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith('.csv')) {
      setSelectedFile(file);
    } else {
      alert("Please select an Excel (.xlsx, .xls) or CSV file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "processing": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    return <FileSpreadsheet className="w-4 h-4" />;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Import Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Import and manage your Amazon KDP data files
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" style={{ color: 'var(--kdp-primary-blue)' }} />
              Upload KDP File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" 
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={ () => setIsDragging(false }
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    { (selectedFile.size / 1024 / 1024).toFixed(2 } MB
                  </p>
                  <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop your KDP file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports Excel (.xlsx, .xls) and CSV files
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    })}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </div>
              )}
            </div>

            {/* Supported File Types */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Supported KDP Files:</strong> Payments, Prior Month Royalties, KENP Read, 
                Dashboard, Royalties Estimator, Orders. The system will automatically detect 
                file type and map data to appropriate fields.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
          </CardHeader>
          <CardContent>
            {importsLoading ? (
              <div className="text-center py-8">Loading import history...</div>
            ) : imports.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No imports yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Upload your first KDP file to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {imports.map((importRecord: KdpImport) => (
                  <div 
                    key={importRecord.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center space-x-4">
                      { getFileTypeIcon(importRecord.fileType }
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{importRecord.fileName}</h4>
                          <Badge className={ getStatusColor(importRecord.status }>
                            { getStatusIcon(importRecord.status }
                            <span className="ml-1 capitalize">{importRecord.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-x-4">
                          <span>Type: {importRecord.detectedType || "Unknown"}</span>
                          <span>Records: {importRecord.totalRecords}</span>
                          <span>
                            { new Date(importRecord.createdAt).toLocaleDateString( }
                          </span>
                        </div>
                        {importRecord.status === "processing" && (
                          <Progress 
                            value={importRecord.progress || 0} 
                            className="w-48 mt-2" 
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/imports/${importRecord.id)}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {importRecord.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/api/imports/${importRecord.id)}/export`, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={ () => deleteMutation.mutate(importRecord.id )}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
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