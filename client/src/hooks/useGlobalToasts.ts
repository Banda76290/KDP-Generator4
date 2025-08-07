import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useGlobalToasts() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const lastSeenImports = useRef<Set<string>>(new Set());

  // Monitor imports every 3 seconds only when authenticated
  const { data: imports } = useQuery({
    queryKey: ['/api/kdp-imports'],
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 3000 : false,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!imports || !Array.isArray(imports)) return;

    imports.forEach((importItem: any) => {
      const importId = importItem.id;
      const statusKey = `${importId}-${importItem.status}`;

      // Skip if we've already seen this import in this status
      if (lastSeenImports.current.has(statusKey)) return;

      // Only show toasts for completed imports that we haven't seen before
      if (importItem.status === 'completed') {
        // Check if we've seen this import in processing state before
        const processingKey = `${importId}-processing`;
        const pendingKey = `${importId}-pending`;
        
        if (lastSeenImports.current.has(processingKey) || lastSeenImports.current.has(pendingKey)) {
          console.log('[GLOBAL TOAST] Showing completion notification for:', importId);
          
          const newRecords = importItem.processedRecords || 0;
          const duplicates = importItem.duplicateRecords || 0;
          
          toast({
            title: "Import completed successfully ✓",
            description: `${importItem.fileName || 'KDP data'} has been processed${newRecords > 0 ? ` - ${newRecords} new records added` : ''}`,
            variant: "success",
          });
        }
      }

      // Track this import status
      lastSeenImports.current.add(statusKey);

      // Clean up old entries to prevent memory bloat (keep last 50)
      if (lastSeenImports.current.size > 50) {
        const entries = Array.from(lastSeenImports.current);
        entries.slice(0, 10).forEach(entry => {
          lastSeenImports.current.delete(entry);
        });
      }
    });
  }, [imports, toast]);
}