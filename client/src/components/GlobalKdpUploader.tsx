import React, { useRef } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalKdpImport } from '@/hooks/useGlobalKdpImport';
import { KdpImportValidationDialog } from '@/components/KdpImportValidationDialog';

interface GlobalKdpUploaderProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function GlobalKdpUploader({ 
  children, 
  className = "",
  variant = "default",
  size = "default"
}: GlobalKdpUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    uploadFile, 
    isUploading, 
    validationDialogOpen, 
    setValidationDialogOpen,
    selectedImportForValidation,
    importPreview,
    handleValidationConfirm
  } = useGlobalKdpImport();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
      // Reset input so same file can be selected again if needed
      event.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      
      <Button
        onClick={handleClick}
        disabled={isUploading}
        className={className}
        variant={variant}
        size={size}
      >
        {isUploading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {children || "Upload KDP Report"}
          </>
        )}
      </Button>

      {/* Global Validation Dialog - IDENTICAL to ImportManagement.tsx */}
      {validationDialogOpen && selectedImportForValidation && importPreview && (
        <KdpImportValidationDialog
          isOpen={validationDialogOpen}
          onClose={() => setValidationDialogOpen(false)}
          onConfirm={handleValidationConfirm}
          importData={selectedImportForValidation}
          preview={importPreview}
          isLoading={false}
        />
      )}
    </>
  );
}