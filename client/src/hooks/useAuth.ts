import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  console.log('[useAuth] Hook called');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:5',message:'useAuth hook called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // Usar a queryFn padrão do queryClient que já tem tratamento especial para /api/auth/user
  // Remover queryFn explícita para usar a padrão
  const { data: user, isLoading, error, refetch, status } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Não lançar erro se retornar 401 - isso é esperado quando não está autenticado
    throwOnError: false,
    // Usar a queryFn padrão do queryClient - ela já trata /api/auth/user corretamente
    // queryFn será herdada de defaultOptions do queryClient
  });

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.ts:70',message:'useAuth state',data:{isLoading,status,hasError:!!error,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  console.log('[useAuth] State:', { isLoading, status, hasError: !!error, hasUser: !!user });

  // Log para debug
  if (error) {
    console.log('[useAuth] Error (expected if not authenticated):', error);
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetchUser: refetch,
  };
}
