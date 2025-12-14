import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // 🔥 AUDITORIA: Log detalhado do erro
    console.error("🔥🔥🔥 [FRONTEND API ERROR] 🔥🔥🔥");
    console.error(`🔥 [FRONTEND] Status code BRUTO da response:`, res.status);
    console.error(`🔥 [FRONTEND] Status text:`, res.statusText);
    console.error(`🔥 [FRONTEND] URL:`, res.url);
    console.error(`🔥 [FRONTEND] Response text:`, text);
    console.error(`🔥 [FRONTEND] Response headers:`, Object.fromEntries(res.headers.entries()));
    console.error(`🔥 [FRONTEND] Response ok:`, res.ok);
    console.error(`🔥 [FRONTEND] Response type:`, res.type);
    console.error(`🔥 [FRONTEND] Response redirected:`, res.redirected);
    
    // CRÍTICO: Verificar se status é realmente 403 ou se foi convertido
    if (res.status === 403) {
      console.error("🔥🔥🔥 [FRONTEND] ⚠️ ATENÇÃO: Status 403 detectado!");
      console.error("🔥 [FRONTEND] Se o backend não retornou 403, o problema está no proxy ou browser");
    }
    
    // TEMPORARIAMENTE DESABILITADO: Redirecionamento automático
    // Isso permite ver o erro real sem redirecionar
    // Se for erro 401 (Unauthorized) ou 403 (Forbidden), redirecionar para /auth
    // Mas NÃO redirecionar se já estiver na página de login/auth para evitar loop
    /*
    if ((res.status === 401 || res.status === 403)) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/auth');
      
      if (!isAuthPage) {
        console.log(`[API ERROR] Redirecting to /auth due to ${res.status}`);
        window.location.href = '/auth';
      }
    }
    */
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // 🔥 AUDITORIA: Log antes de fazer fetch
  console.log("🔥🔥🔥 [FRONTEND] apiRequest chamado 🔥🔥🔥");
  console.log("🔥 [FRONTEND] Method:", method);
  console.log("🔥 [FRONTEND] URL:", url);
  console.log("🔥 [FRONTEND] Has data:", !!data);
  console.log("🔥 [FRONTEND] Credentials: include");
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // 🔥 AUDITORIA: Log imediatamente após fetch (antes de processar)
  console.log("🔥🔥🔥 [FRONTEND] Fetch retornou 🔥🔥🔥");
  console.log("🔥 [FRONTEND] Status code BRUTO:", res.status);
  console.log("🔥 [FRONTEND] Status text:", res.statusText);
  console.log("🔥 [FRONTEND] Response ok:", res.ok);
  console.log("🔥 [FRONTEND] Response URL:", res.url);
  console.log("🔥 [FRONTEND] Response headers:", Object.fromEntries(res.headers.entries()));
  
  // CRÍTICO: Verificar se a resposta veio do backend Express ou de outro servidor
  const serverHeader = res.headers.get('server') || '';
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  
  if (serverHeader && !serverHeader.toLowerCase().includes('express') && !serverHeader.toLowerCase().includes('node')) {
    console.error("🔥🔥🔥 [FRONTEND] ⚠️ ERRO CRÍTICO: Request não passou pelo backend!");
    console.error("🔥 [FRONTEND] Server header:", serverHeader);
    console.error("🔥 [FRONTEND] Proxy não aplicado corretamente!");
    console.error("🔥 [FRONTEND] A requisição foi resolvida localmente (AirTunes?)");
    console.error("🔥 [FRONTEND] URL da requisição:", url);
    
    // FALLBACK DEV: Se estiver em desenvolvimento, reenviar diretamente para o backend
    if (isDev && url.startsWith('/api')) {
      console.log("🔥🔥🔥 [FRONTEND] FALLBACK DEV: Reenviando diretamente para http://localhost:5050");
      const backendUrl = `http://localhost:5050${url}`;
      console.log("🔥 [FRONTEND] Backend URL:", backendUrl);
      
      // Reenviar a requisição diretamente para o backend
      const fallbackRes = await fetch(backendUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      console.log("🔥🔥🔥 [FRONTEND] Fallback response:", fallbackRes.status);
      const fallbackServerHeader = fallbackRes.headers.get('server') || '';
      console.log("🔥 [FRONTEND] Fallback Server header:", fallbackServerHeader);
      
      if (fallbackServerHeader && (fallbackServerHeader.toLowerCase().includes('express') || fallbackServerHeader.toLowerCase().includes('node'))) {
        console.log("✅ [FRONTEND] Fallback funcionou! Resposta veio do backend Express");
        await throwIfResNotOk(fallbackRes);
        return fallbackRes;
      } else {
        throw new Error(`Fallback também falhou. Server: ${fallbackServerHeader}. Backend pode estar offline.`);
      }
    }
    
    throw new Error(`Request não passou pelo backend. Server: ${serverHeader}. Proxy não aplicado.`);
  }

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

    // CRÍTICO: Verificar se a resposta veio do backend Express (fallback DEV)
    const serverHeader = res.headers.get('server') || '';
    const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    
    if (serverHeader && !serverHeader.toLowerCase().includes('express') && !serverHeader.toLowerCase().includes('node')) {
      console.error("🔥🔥🔥 [getQueryFn] ⚠️ ERRO: Request não passou pelo backend!");
      console.error("🔥 [getQueryFn] Server header:", serverHeader);
      
      // FALLBACK DEV: Reenviar diretamente para o backend
      if (isDev && url.startsWith('/api')) {
        console.log("🔥🔥🔥 [getQueryFn] FALLBACK DEV: Reenviando para http://localhost:5050");
        const backendUrl = `http://localhost:5050${url}`;
        const fallbackRes = await fetch(backendUrl, {
          credentials: "include",
        });
        
        const fallbackServerHeader = fallbackRes.headers.get('server') || '';
        if (fallbackServerHeader && (fallbackServerHeader.toLowerCase().includes('express') || fallbackServerHeader.toLowerCase().includes('node'))) {
          console.log("✅ [getQueryFn] Fallback funcionou!");
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
      
      throw new Error(`Request não passou pelo backend. Server: ${serverHeader}`);
    }

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
