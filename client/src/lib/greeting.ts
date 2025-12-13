/**
 * Retorna a saudação apropriada baseada na hora do dia
 * @returns Objeto com greeting (texto) e emoji
 */
export function getGreetingMessage() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { greeting: "Bom dia", emoji: "☀️" };
  }
  
  if (hour >= 12 && hour < 18) {
    return { greeting: "Boa tarde", emoji: "🌤️" };
  }
  
  return { greeting: "Boa noite", emoji: "🌙" };
}

/**
 * Retorna a saudação formatada completa
 * @param userName Nome do usuário
 * @returns String formatada: "Bom dia, {nome}! ☀️"
 */
export function getFormattedGreeting(userName: string = "Usuário"): string {
  const { greeting, emoji } = getGreetingMessage();
  return `${greeting}, ${userName}! ${emoji}`;
}

