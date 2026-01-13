import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Detecta se um erro de resposta é típico de falha no proxy do Vite
 */
function isProxyError(res: Response, text: string): boolean {
  // Verificar status codes típicos de erro de proxy
  if (res.status === 500 || res.status === 502 || res.status === 504) {
    const contentType = res.headers.get('content-type') || '';
    
    // Se for text/plain, provavelmente é erro do proxy
    if (contentType.includes('text/plain')) {
      return true;
    }
    
    // Se a mensagem contém indicadores de erro de proxy
    const lowerText = text.toLowerCase();
    if (lowerText.includes('proxy error') || 
        lowerText.includes('gateway timeout') ||
        lowerText.includes('bad gateway') ||
        lowerText.includes('econnrefused') ||
        lowerText.includes('connection refused')) {
      return true;
    }
  }
  
  return false;
}

async function throwIfResNotOk(res: Response, text?: string) {
  if (!res.ok) {
    const errorText = text || (await res.text()) || res.statusText;
    
    // Logs detalhados apenas em desenvolvimento
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.error("🔥🔥🔥 [FRONTEND API ERROR] 🔥🔥🔥");
      console.error(`🔥 [FRONTEND] Status code:`, res.status);
      console.error(`🔥 [FRONTEND] Status text:`, res.statusText);
      console.error(`🔥 [FRONTEND] URL:`, res.url);
      console.error(`🔥 [FRONTEND] Content-Type:`, res.headers.get('content-type'));
      console.error(`🔥 [FRONTEND] Response text:`, errorText.substring(0, 200)); // Limitar tamanho
      console.error(`🔥 [FRONTEND] Response ok:`, res.ok);
      console.error(`🔥 [FRONTEND] É erro de proxy?`, isProxyError(res, errorText));
    }
    
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isDev = import.meta.env.DEV;
  
  // Em produção, sempre usar proxy (URL relativa)
  // Em DEV, tentar proxy primeiro, com fallback automático se falhar
  const apiBase = isDev ? '' : ''; // Sempre relativo (usa proxy ou mesma origem)
  
  if (isDev) {
    console.log("🔥🔥🔥 [FRONTEND] apiRequest chamado 🔥🔥🔥");
    console.log("🔥 [FRONTEND] Method:", method);
    console.log("🔥 [FRONTEND] URL:", url);
    console.log("🔥 [FRONTEND] Has data:", !!data);
  }
  
  // Primeira tentativa: via proxy (URL relativa)
  const fullUrl = `${apiBase}${url}`;
  console.log('[apiRequest] Starting fetch for:', fullUrl);
  let res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  console.log('[apiRequest] Fetch completed, status:', res.status, res.ok);

  // Clonar response para ler o texto sem consumir o stream
  let responseText = '';
  try {
    const resClone = res.clone();
    responseText = await resClone.text();
    console.log('[apiRequest] Response text read, length:', responseText.length);
  } catch (e) {
    console.error('[apiRequest] Error reading response text:', e);
    // Ignorar erro ao ler texto
  }

  // FALLBACK DEV: Detectar erro de proxy e tentar direto no backend
  if (isDev && !res.ok && url.startsWith('/api') && isProxyError(res, responseText)) {
    console.warn("⚠️ [DEV] Erro de proxy detectado!");
    console.warn(`⚠️ [DEV] Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    console.warn(`⚠️ [DEV] Tentando fallback direto para http://127.0.0.1:5050${url}...`);
    
    try {
      const backendUrl = `http://127.0.0.1:5050${url}`;
      const fallbackRes = await fetch(backendUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      if (fallbackRes.ok) {
        console.log(`✅ [DEV] Fallback funcionou! Status: ${fallbackRes.status}`);
        return fallbackRes;
      } else {
        console.warn(`⚠️ [DEV] Fallback também retornou erro: ${fallbackRes.status}`);
        // Tentar ler o texto do fallback para diagnóstico
        try {
          const fallbackText = await fallbackRes.clone().text();
          console.warn(`⚠️ [DEV] Fallback error text:`, fallbackText.substring(0, 200));
        } catch (e) {
          // Ignorar
        }
        // Continuar com a resposta original (será tratada pelo throwIfResNotOk)
      }
    } catch (fallbackError) {
      console.error("❌ [DEV] Erro no fallback:", fallbackError);
      // Continuar com a resposta original
    }
  }

  // Em produção ou se não for erro de proxy: tratar normalmente
  console.log('[apiRequest] Before throwIfResNotOk, status:', res.status);
  await throwIfResNotOk(res, responseText);
  console.log('[apiRequest] After throwIfResNotOk, returning response');
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
    
    const isDev = import.meta.env.DEV;
    
    // Para /api/auth/user, adicionar timeout de 10 segundos
    const controller = isAuthUserEndpoint ? new AbortController() : null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (controller && isAuthUserEndpoint) {
      timeoutId = setTimeout(() => {
        console.error('[getQueryFn] /api/auth/user timeout after 10s - aborting');
        controller.abort();
      }, 10000);
    }
    
    // Primeira tentativa: via proxy (URL relativa)
    let res: Response;
    try {
      res = await fetch(url, {
        credentials: "include",
        signal: controller?.signal,
      });
      
      if (timeoutId) clearTimeout(timeoutId);
    } catch (fetchError) {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Se for timeout/abort do /api/auth/user, retornar null
      if (isAuthUserEndpoint && fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[getQueryFn] /api/auth/user fetch aborted (timeout) - returning null');
        return null as T;
      }
      throw fetchError;
    }

    // Clonar response para ler o texto sem consumir o stream
    const resClone = res.clone();
    let responseText = '';
    try {
      responseText = await resClone.text();
    } catch (e) {
      // Ignorar erro ao ler texto
    }

    // FALLBACK DEV: Detectar erro de proxy e tentar direto no backend
    if (isDev && !res.ok && url.startsWith('/api') && isProxyError(res, responseText)) {
      console.warn("⚠️ [DEV] Erro de proxy detectado no getQueryFn!");
      console.warn(`⚠️ [DEV] Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
      console.warn(`⚠️ [DEV] Tentando fallback direto para http://127.0.0.1:5050${url}...`);
      
      try {
        const backendUrl = `http://127.0.0.1:5050${url}`;
        const fallbackRes = await fetch(backendUrl, {
          credentials: "include",
          signal: controller?.signal,
        });
        
        if (fallbackRes.ok) {
          console.log(`✅ [DEV] Fallback funcionou! Status: ${fallbackRes.status}`);
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
        } else {
          console.warn(`⚠️ [DEV] Fallback também retornou erro: ${fallbackRes.status}`);
          // Usar a resposta original do fallback para tratamento de erro
          res = fallbackRes;
        }
      } catch (fallbackError) {
        console.error("❌ [DEV] Erro no fallback:", fallbackError);
        // Continuar com a resposta original
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

    // Para ler o texto apenas se necessário (não consumir o stream prematuramente)
    const finalResClone = res.clone();
    let finalResponseText = '';
    try {
      finalResponseText = await finalResClone.text();
    } catch (e) {
      // Ignorar
    }
    await throwIfResNotOk(res, finalResponseText);
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
      // Adicionar gcTime para evitar cache infinito que pode causar problemas
      gcTime: 5 * 60 * 1000, // 5 minutos
    },
    mutations: {
      retry: false,
    },
  },
});
