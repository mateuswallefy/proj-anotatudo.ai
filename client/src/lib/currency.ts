/**
 * Currency formatting utilities for Brazilian Real (BRL)
 */

/**
 * Formats a number as Brazilian Real currency string
 * @param value - Number value (in units, not cents)
 * @returns Formatted string like "R$ 1.234,56"
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Parses a Brazilian Real currency string to a number
 * Handles formats like "R$ 1.234,56", "1234,56", "1234.56"
 * @param value - Currency string
 * @returns Number value (in units, not cents)
 */
export function parseCurrencyBRL(value: string): number {
  // Remove currency symbols and spaces
  const cleaned = value
    .replace(/R\$\s*/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!cleaned) return 0;

  // Handle Brazilian format (1.234,56) or US format (1234.56)
  // If contains comma, assume Brazilian format
  if (cleaned.includes(",")) {
    // Remove dots (thousands separator) and replace comma with dot
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized) || 0;
  }

  // If contains dot, check if it's decimal separator
  if (cleaned.includes(".")) {
    // If there's only one dot and it's near the end, it's likely decimal
    const parts = cleaned.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator
      return parseFloat(cleaned) || 0;
    }
    // Otherwise, assume thousands separator and remove dots
    return parseFloat(cleaned.replace(/\./g, "")) || 0;
  }

  // No separators, just parse as integer
  return parseFloat(cleaned) || 0;
}

/**
 * Formats input value as user types (for currency input)
 * Converts raw digits to formatted string like "1.234,56"
 * @param rawValue - Raw input string (digits only)
 * @returns Formatted string
 */
export function formatCurrencyInput(rawValue: string): string {
  // Remove all non-digits
  const digits = rawValue.replace(/\D/g, "");

  if (!digits) return "";

  // Convert to number (in cents) then format
  const valueInCents = Number(digits);
  const value = valueInCents / 100;

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converts formatted currency string back to raw digits
 * @param formattedValue - Formatted string like "1.234,56"
 * @returns Raw digits string
 */
export function parseCurrencyInput(formattedValue: string): string {
  return formattedValue.replace(/\D/g, "");
}

