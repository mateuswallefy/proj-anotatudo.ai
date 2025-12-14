import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Não lançar erro se retornar 401 - isso é esperado quando não está autenticado
    throwOnError: false,
  });

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
