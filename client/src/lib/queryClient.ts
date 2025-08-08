import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const { method = 'GET', body, headers = {}, ...restOptions } = options;
  
  // Don't set Content-Type for FormData (multipart uploads)
  const finalHeaders = body instanceof FormData 
    ? headers 
    : { "Content-Type": "application/json", ...headers };

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    credentials: "include",
    ...restOptions,
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Robust protection against all undefined/invalid queryKey scenarios
    if (!queryKey) {
      throw new Error('QueryKey is required');
    }
    
    // Ensure queryKey is always a valid array
    const normalizedQueryKey = Array.isArray(queryKey) 
      ? queryKey.filter(key => key !== undefined && key !== null) 
      : [queryKey].filter(key => key !== undefined && key !== null);
    
    if (normalizedQueryKey.length === 0) {
      throw new Error('QueryKey cannot be empty after normalization');
    }
    
    // Convert to URL path with enhanced safety
    const url = normalizedQueryKey.map(key => 
      typeof key === 'string' ? key : JSON.stringify(key)
    ).join("/");
    
    if (!url || url === '/' || url.includes('undefined')) {
      console.error('Invalid queryKey detected:', queryKey, 'normalized:', normalizedQueryKey);
      throw new Error(`Invalid query key: ${JSON.stringify(queryKey)}`);
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
