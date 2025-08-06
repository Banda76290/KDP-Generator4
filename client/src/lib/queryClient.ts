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
export const getQueryFn = <T,>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  const unauthorizedBehavior = options.on401;
  return async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
  };

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
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
  };
