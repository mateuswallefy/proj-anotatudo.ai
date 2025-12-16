import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Logs detalhados apenas em desenvolvimento
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.error("🔥🔥🔥 [FRONTEND API ERROR] 🔥🔥🔥");
      console.error(`🔥 [FRONTEND] Status code BRUTO da response:`, res.status);
      console.error(`🔥 [FRONTEND] Status text:`, res.statusText);
      console.error(`🔥 [FRONTEND] URL:`, res.url);
      console.error(`🔥 [FRONTEND] Response text:`, text);
      console.error(`🔥 [FRONTEND] Response headers:`, Object.fromEntries(res.headers.entries()));
      console.error(`🔥 [FRONTEND] Response ok:`, res.ok);
      console.error(`🔥 [FRONTEND] Response type:`, res.type);
      console.error(`🔥 [FRONTEND] Response redirected:`, res.redirected);
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Logs apenas em desenvolvimento
  const isDev = import.meta.env.DEV;
  if (isDev) {
    console.log("🔥🔥🔥 [FRONTEND] apiRequest chamado 🔥🔥🔥");
    console.log("🔥 [FRONTEND] Method:", method);
    console.log("🔥 [FRONTEND] URL:", url);
    console.log("🔥 [FRONTEND] Has data:", !!data);
    console.log("🔥 [FRONTEND] Credentials: include");
  }
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Logs de debug apenas em desenvolvimento
  if (isDev) {
    console.log("🔥🔥🔥 [FRONTEND] Fetch retornou 🔥🔥🔥");
    console.log("🔥 [FRONTEND] Status code BRUTO:", res.status);
    console.log("🔥 [FRONTEND] Status text:", res.statusText);
    console.log("🔥 [FRONTEND] Response ok:", res.ok);
    console.log("🔥 [FRONTEND] Response URL:", res.url);
    console.log("🔥 [FRONTEND] Response headers:", Object.fromEntries(res.headers.entries()));
    
    // Validação de proxy APENAS em desenvolvimento
    // Em produção, confiamos apenas em response.ok
    const serverHeader = res.headers.get('server') || '';
    if (serverHeader && !serverHeader.toLowerCase().includes('express') && !serverHeader.toLowerCase().includes('node')) {
      console.warn("⚠️ [DEV] Server header não é Express/Node:", serverHeader);
      console.warn("⚠️ [DEV] Tentando fallback para localhost:5050...");
      
      // FALLBACK DEV: Se estiver em desenvolvimento, reenviar diretamente para o backend
      if (url.startsWith('/api')) {
        const backendUrl = `http://localhost:5050${url}`;
        const fallbackRes = await fetch(backendUrl, {
          method,
          headers: data ? { "Content-Type": "application/json" } : {},
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        
        console.log("✅ [DEV] Fallback response:", fallbackRes.status);
        await throwIfResNotOk(fallbackRes);
        return fallbackRes;
      }
    }
  }

  // Em produção: confiar apenas em response.ok
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

    // Validação de proxy APENAS em desenvolvimento
    // Em produção, confiamos apenas em response.ok
    const isDev = import.meta.env.DEV;
    if (isDev) {
      const serverHeader = res.headers.get('server') || '';
      if (serverHeader && !serverHeader.toLowerCase().includes('express') && !serverHeader.toLowerCase().includes('node')) {
        console.warn("⚠️ [DEV] Server header não é Express/Node:", serverHeader);
        console.warn("⚠️ [DEV] Tentando fallback para localhost:5050...");
        
        // FALLBACK DEV: Reenviar diretamente para o backend
        if (url.startsWith('/api')) {
          const backendUrl = `http://localhost:5050${url}`;
          const fallbackRes = await fetch(backendUrl, {
            credentials: "include",
          });
          
          console.log("✅ [DEV] Fallback funcionou!");
          // Continuar com o processamento normal usando fallbackRes
          if (isAuthUserEndpoint) {
            if (fallbackRes.status === 401 || fallbackRes.status === 403) {
              return null as T;
            }
            if (!fallbackRes.ok) {
              const text = await fallbackRes.text();
              throw new Error(`${fallbackRes.status}: ${text}`);
            }
            return await fallbackRes.json();
          }
          if (unauthorizedBehavior === "returnNull" && fallbackRes.status === 401) {
            return null as T;
          }
          await throwIfResNotOk(fallbackRes);
          return await fallbackRes.json();
        }
      }
    }

    // Special handling for auth user endpoint - don't redirect on 401/403
    // This is expected when user is not authenticated
    if (isAuthUserEndpoint) {
      if (isDev) {
        console.log('[getQueryFn] /api/auth/user endpoint called');
        console.log('[getQueryFn] Response status:', res.status);
        console.log('[getQueryFn] Cookies:', document.cookie || 'no cookies');
      }
      
      if (res.status === 401 || res.status === 403) {
        if (isDev) {
          console.log('[getQueryFn] Auth user endpoint returned', res.status, '- user not authenticated (expected)');
        }
        return null as T;
      }
      if (!res.ok) {
        const text = await res.text();
        if (isDev) {
          console.error('[getQueryFn] Error from /api/auth/user:', text);
        }
        throw new Error(`${res.status}: ${text}`);
      }
      const userData = await res.json();
      if (isDev) {
        console.log('[getQueryFn] User data received:', userData);
      }
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
