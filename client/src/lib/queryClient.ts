import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    console.error(`[API ERROR] ${res.status}: ${text}`);
    console.error(`[API ERROR] URL: ${res.url}`);
    
    // Se for erro 401 (Unauthorized) ou 403 (Forbidden), redirecionar para /auth
    // Mas NÃO redirecionar se já estiver na página de login/auth para evitar loop
    if ((res.status === 401 || res.status === 403)) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/auth');
      
      if (!isAuthPage) {
        console.log(`[API ERROR] Redirecting to /auth due to ${res.status}`);
        window.location.href = '/auth';
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // First element is the URL, second might be query params object
    let url = queryKey[0] as string;
    
    // Check if this is the auth user endpoint - special handling
    const isAuthUserEndpoint = url === "/api/auth/user";
    
    // If there's a second element and it's an object with query params
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = queryKey[1] as Record<string, any>;
      const searchParams = new URLSearchParams();
      
      // Add each param to the URL
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    // Special handling for auth user endpoint - don't redirect on 401/403
    // This is expected when user is not authenticated
    if (isAuthUserEndpoint) {
      console.log('[getQueryFn] /api/auth/user endpoint called');
      console.log('[getQueryFn] Response status:', res.status);
      console.log('[getQueryFn] Cookies:', document.cookie || 'no cookies');
      
      if (res.status === 401 || res.status === 403) {
        console.log('[getQueryFn] Auth user endpoint returned', res.status, '- user not authenticated (expected)');
        return null as T;
      }
      if (!res.ok) {
        const text = await res.text();
        console.error('[getQueryFn] Error from /api/auth/user:', text);
        throw new Error(`${res.status}: ${text}`);
      }
      const userData = await res.json();
      console.log('[getQueryFn] User data received:', userData);
      return userData;
    }

    // For other endpoints, use standard error handling
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
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
