import {
  Utensils,
  Car,
  Home,
  Heart,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  Receipt,
  Banknote,
  TrendingUp,
  Package,
  Plane,
  Smartphone,
  Shirt,
  Coffee,
  Gift,
  Baby,
  Dog,
  Dumbbell,
  Scissors,
  type LucideIcon,
} from "lucide-react";

// Mapa de cores por categoria - cores vibrantes e distintas
export const CATEGORY_COLORS: Record<string, { main: string; light: string; bg: string }> = {
  'Alimentação': { main: '#f97316', light: '#fb923c', bg: 'rgba(249, 115, 22, 0.1)' },
  'Transporte': { main: '#3b82f6', light: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
  'Moradia': { main: '#8b5cf6', light: '#a78bfa', bg: 'rgba(139, 92, 246, 0.1)' },
  'Saúde': { main: '#ef4444', light: '#f87171', bg: 'rgba(239, 68, 68, 0.1)' },
  'Educação': { main: '#06b6d4', light: '#22d3ee', bg: 'rgba(6, 182, 212, 0.1)' },
  'Lazer': { main: '#ec4899', light: '#f472b6', bg: 'rgba(236, 72, 153, 0.1)' },
  'Compras': { main: '#a855f7', light: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)' },
  'Contas': { main: '#64748b', light: '#94a3b8', bg: 'rgba(100, 116, 139, 0.1)' },
  'Salário': { main: '#10b981', light: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
  'Investimentos': { main: '#14b8a6', light: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.1)' },
  'Viagem': { main: '#0ea5e9', light: '#38bdf8', bg: 'rgba(14, 165, 233, 0.1)' },
  'Tecnologia': { main: '#6366f1', light: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
  'Vestuário': { main: '#d946ef', light: '#e879f9', bg: 'rgba(217, 70, 239, 0.1)' },
  'Café': { main: '#78350f', light: '#a16207', bg: 'rgba(120, 53, 15, 0.1)' },
  'Presentes': { main: '#e11d48', light: '#fb7185', bg: 'rgba(225, 29, 72, 0.1)' },
  'Filhos': { main: '#f59e0b', light: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
  'Pets': { main: '#84cc16', light: '#a3e635', bg: 'rgba(132, 204, 22, 0.1)' },
  'Academia': { main: '#22c55e', light: '#4ade80', bg: 'rgba(34, 197, 94, 0.1)' },
  'Beleza': { main: '#f43f5e', light: '#fb7185', bg: 'rgba(244, 63, 94, 0.1)' },
  'Outros': { main: '#71717a', light: '#a1a1aa', bg: 'rgba(113, 113, 122, 0.1)' },
};

// Ícones por categoria
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Alimentação': Utensils,
  'Transporte': Car,
  'Moradia': Home,
  'Saúde': Heart,
  'Educação': BookOpen,
  'Lazer': Gamepad2,
  'Compras': ShoppingBag,
  'Contas': Receipt,
  'Salário': Banknote,
  'Investimentos': TrendingUp,
  'Viagem': Plane,
  'Tecnologia': Smartphone,
  'Vestuário': Shirt,
  'Café': Coffee,
  'Presentes': Gift,
  'Filhos': Baby,
  'Pets': Dog,
  'Academia': Dumbbell,
  'Beleza': Scissors,
  'Outros': Package,
};

// Fallback colors para categorias não mapeadas
const FALLBACK_COLORS = [
  { main: '#f97316', light: '#fb923c', bg: 'rgba(249, 115, 22, 0.1)' },
  { main: '#3b82f6', light: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
  { main: '#8b5cf6', light: '#a78bfa', bg: 'rgba(139, 92, 246, 0.1)' },
  { main: '#ef4444', light: '#f87171', bg: 'rgba(239, 68, 68, 0.1)' },
  { main: '#06b6d4', light: '#22d3ee', bg: 'rgba(6, 182, 212, 0.1)' },
  { main: '#ec4899', light: '#f472b6', bg: 'rgba(236, 72, 153, 0.1)' },
  { main: '#14b8a6', light: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.1)' },
  { main: '#f59e0b', light: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
];

// Função para obter cor de uma categoria
export function getCategoryColor(categoria: string, index?: number): { main: string; light: string; bg: string } {
  // Primeiro verifica se é uma categoria conhecida
  if (CATEGORY_COLORS[categoria]) {
    return CATEGORY_COLORS[categoria];
  }

  // Se não, usa uma cor baseada no índice ou hash do nome
  if (index !== undefined) {
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  }

  // Gera um índice baseado no hash do nome
  let hash = 0;
  for (let i = 0; i < categoria.length; i++) {
    hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[colorIndex];
}

// Função para obter ícone de uma categoria
export function getCategoryIcon(categoria: string): LucideIcon {
  return CATEGORY_ICONS[categoria] || Package;
}

// Função para criar gradiente SVG ID único
export function getCategoryGradientId(categoria: string): string {
  return `gradient-${categoria.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}
