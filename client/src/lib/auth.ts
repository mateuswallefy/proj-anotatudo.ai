import { queryClient } from "./queryClient";
import { apiRequest } from "./queryClient";

/**
 * Função global de logout
 * Remove cookies/session, tokens salvos, chama o endpoint de logout e redireciona para /login
 */
export async function logout(): Promise<void> {
  try {
    // Limpar localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Chamar endpoint de logout no backend
    try {
      await apiRequest("POST", "/api/logout", {});
    } catch (error) {
      // Ignorar erros de rede, mas continuar com o logout local
      console.warn("Erro ao chamar endpoint de logout:", error);
    }

    // Limpar todas as queries do React Query
    queryClient.clear();

    // Redirecionar para /login
    window.location.href = "/login";
  } catch (error) {
    console.error("Erro durante logout:", error);
    // Mesmo com erro, redirecionar para login
    window.location.href = "/login";
  }
}

