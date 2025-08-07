import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronUp, ChevronDown, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportItem {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  processedRecords?: number;
  totalRecords?: number;
  progress?: number; // Add progress field from the import record
  createdAt: string;
}

interface ImportProgress {
  status: string;
  processedRecords: number;
  totalRecords: number;
  progress: number;
  errorLog?: string[];
}

export function ImportProgressWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch all imports to check for active ones
  const { data: imports } = useQuery<ImportItem[]>({
    queryKey: ['/api/kdp-imports'],
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  // Get active imports (pending or processing)
  const activeImports = imports?.filter(imp => 
    imp.status === 'pending' || imp.status === 'processing'
  ) || [];

  // Fetch progress for all active imports using a single query per import ID
  const progressQueries = useQuery<{ [key: string]: ImportProgress }>({
    queryKey: ['/api/kdp-imports', 'all-progress', activeImports.map(imp => imp.id).join(',')],
    queryFn: async () => {
      const progressData: { [key: string]: ImportProgress } = {};
      
      // Fetch progress for each active import
      await Promise.all(
        activeImports.map(async (imp) => {
          try {
            console.log(`[WIDGET] Fetching progress for import ${imp.id}`);
            const response = await fetch(`/api/kdp-imports/${imp.id}/progress`);
            if (response.ok) {
              const data = await response.json();
              progressData[imp.id] = data;
              console.log(`[WIDGET] Progress for ${imp.id}:`, data);
            } else {
              console.log(`[WIDGET] Failed response for ${imp.id}:`, response.status);
            }
          } catch (error) {
            console.error(`[WIDGET] Failed to fetch progress for ${imp.id}:`, error);
          }
        })
      );
      
      return progressData;
    },
    enabled: activeImports.length > 0,
    refetchInterval: 1000, // Check more frequently
    staleTime: 0, // Always fetch fresh data
  });

  const activeImportsWithProgress = activeImports.map(imp => ({
    import: imp,
    progress: progressQueries.data?.[imp.id]
  }));

  // Don't show widget if no active imports or manually hidden
  if (!isVisible || activeImports.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'pending':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressValue = (item: { import: ImportItem; progress?: ImportProgress }) => {
    // If we have progress data from the API, use it
    if (item.progress?.progress !== undefined) {
      return item.progress.progress;
    }
    
    // If we have processed/total records from the import record itself, calculate percentage
    if (item.import.processedRecords !== undefined && item.import.totalRecords) {
      return Math.round((item.import.processedRecords / item.import.totalRecords) * 100);
    }
    
    // Default values based on status
    switch (item.import.status) {
      case 'pending':
        return 0;
      case 'processing':
        return 5; // Show small progress for processing state
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border rounded-lg shadow-lg max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              Imports in Progress ({activeImports.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {activeImportsWithProgress.map(({ import: imp, progress }) => (
              <div key={imp.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {imp.fileName}
                    </p>
                    <p className={cn("text-xs", getStatusColor(imp.status))}>
                      {imp.status === 'processing' ? 'Processing...' : 'Pending...'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={getProgressValue({ import: imp, progress })} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {progress?.processedRecords || imp.processedRecords || 0} / {progress?.totalRecords || imp.totalRecords || '?'} records
                    </span>
                    <span>{Math.round(getProgressValue({ import: imp, progress }))}%</span>
                  </div>
                </div>
              </div>
            ))}
            
            {activeImports.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No imports currently in progress
              </div>
            )}
          </div>
        )}

        {/* Collapsed state - show summary */}
        {!isExpanded && activeImports.length > 0 && (
          <div className="p-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {activeImports.filter(imp => imp.status === 'processing').length} processing, {' '}
                {activeImports.filter(imp => imp.status === 'pending').length} pending
              </span>
              <span className="text-xs text-gray-500">Click to expand</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}