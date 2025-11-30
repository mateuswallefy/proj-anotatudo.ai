// emoji.ts — Sistema de Emojis Inteligentes para Transações

export const Emoji = {
  entrada: ["💰", "📈", "🤑", "💵", "🎉", "🙌", "✨"],
  saida: ["💳", "📉", "💸", "🧾", "😅", "💼"],
  transporte: ["🚗", "🚕", "🚙", "🚦", "🛣️", "🚘"],
  alimentacao: ["🍽️", "🍔", "🍕", "🍱", "🍜", "🥗", "🍣", "🍛"],
  mercado: ["🛒", "🥫", "🍞", "🧀", "🍎", "🛍️"],
  lazer: ["🎉", "🎬", "🎧", "🎮", "🎢", "🍿"],
  saude: ["💊", "🏥", "🩺", "❤️‍🩹", "💉"],
  moradia: ["🏠", "🛋️", "💡", "🚿", "🪑"],
  investimentos: ["📈", "💹", "💰", "🏦", "💵"],
  assinaturas: ["📦", "🔁", "💳", "💡"],
  outros: ["🧾", "📌", "✨", "⭐"],
};

/**
 * Normaliza o nome da categoria para usar como chave
 */
function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().trim();
  
  // Mapeamento de categorias para chaves do Emoji
  if (normalized.includes("transporte") || normalized.includes("uber") || normalized.includes("taxi")) {
    return "transporte";
  }
  if (normalized.includes("alimenta") || normalized.includes("comida") || normalized.includes("restaurante")) {
    return "alimentacao";
  }
  if (normalized.includes("mercado") || normalized.includes("super") || normalized.includes("compras")) {
    return "mercado";
  }
  if (normalized.includes("lazer") || normalized.includes("entretenimento") || normalized.includes("cinema")) {
    return "lazer";
  }
  if (normalized.includes("saúde") || normalized.includes("saude") || normalized.includes("farmacia") || normalized.includes("médico") || normalized.includes("medico")) {
    return "saude";
  }
  if (normalized.includes("moradia") || normalized.includes("casa") || normalized.includes("aluguel")) {
    return "moradia";
  }
  if (normalized.includes("investimento") || normalized.includes("investimentos")) {
    return "investimentos";
  }
  if (normalized.includes("assinatura") || normalized.includes("assinaturas")) {
    return "assinaturas";
  }
  
  return "outros";
}

/**
 * Retorna 1 ou 2 emojis únicos conforme categoria
 */
export function pickEmoji(category: string, tipo?: "entrada" | "saida"): string {
  // Se for entrada ou saída, priorizar emojis de tipo
  if (tipo === "entrada") {
    const list = Emoji.entrada;
    const qty = Math.floor(Math.random() * 2) + 1; // 1 ou 2
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, qty).join(" ");
  }
  
  if (tipo === "saida") {
    // Combinar emojis de saída com emojis da categoria
    const categoryKey = normalizeCategory(category);
    const categoryList = Emoji[categoryKey as keyof typeof Emoji] || Emoji.outros;
    const saidaList = Emoji.saida;
    
    // Escolher 1 da categoria e 1 de saída, ou 2 da categoria
    const qty = Math.floor(Math.random() * 2) + 1;
    if (qty === 1) {
      const list = [...categoryList].sort(() => 0.5 - Math.random());
      return list[0];
    } else {
      // 2 emojis: 1 da categoria e 1 de saída
      const shuffledCategory = [...categoryList].sort(() => 0.5 - Math.random());
      const shuffledSaida = [...saidaList].sort(() => 0.5 - Math.random());
      return `${shuffledCategory[0]} ${shuffledSaida[0]}`;
    }
  }
  
  // Sem tipo específico, usar apenas categoria
  const categoryKey = normalizeCategory(category);
  const list = Emoji[categoryKey as keyof typeof Emoji] || Emoji.outros;
  const qty = Math.floor(Math.random() * 2) + 1; // 1 ou 2
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, qty).join(" ");
}

