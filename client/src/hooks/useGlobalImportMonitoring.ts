import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useGlobalImportMonitoring(isAuthenticated: boolean) {
  const { toast } = useToast();
  const lastCheckedImports = useRef<Set<string>>(new Set());

  // Query imports every 2 seconds when authenticated
  const { data: imports } = useQuery({
    queryKey: ['/api/kdp-imports'],
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 2000 : false,
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });

  useEffect(() => {
    if (!imports || !Array.isArray(imports)) return;

    imports.forEach((importItem: any) => {
      const importId = importItem.id;
      const wasProcessing = lastCheckedImports.current.has(`${importId}-processing`);
      const wasCompleted = lastCheckedImports.current.has(`${importId}-completed`);

      // Track processing state
      if (importItem.status === 'processing' && !wasProcessing) {
        lastCheckedImports.current.add(`${importId}-processing`);
      }

      // Show success toast when import completes
      if (importItem.status === 'completed' && wasProcessing && !wasCompleted) {
        console.log('[GLOBAL] Import completed, showing success toast:', importId);
        
        toast({
          title: "Import completed successfully",
          description: `Your KDP data has been processed and integrated into the system.`,
          variant: "success",
        });

        // Mark as completed to avoid duplicate toasts
        lastCheckedImports.current.add(`${importId}-completed`);
        lastCheckedImports.current.delete(`${importId}-processing`);
      }

      // Clean up old entries for failed imports
      if (importItem.status === 'failed' && wasProcessing) {
        lastCheckedImports.current.delete(`${importId}-processing`);
      }
    });
  }, [imports, toast]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Keep the tracking state to avoid duplicate toasts if component remounts
    };
  }, []);
}