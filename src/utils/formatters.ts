/**
 * Fonctions utilitaires pour le formatage et l'affichage
 */

/**
 * Formate un nombre en euros avec séparateur de milliers
 * @param value - Valeur numérique
 * @returns Chaîne formatée
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString("fr-FR");
};

/**
 * Formate une valeur pour l'axe Y du graphique (k pour milliers)
 * @param value - Valeur numérique
 * @returns Chaîne formatée
 */
export const formatAxisValue = (value: number): string => {
  if (value > 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

/**
 * Formate un pourcentage avec signe
 * @param value - Valeur en pourcentage
 * @param decimals - Nombre de décimales
 * @returns Chaîne formatée
 */
export const formatPercentWithSign = (
  value: number,
  decimals: number = 2
): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Génère un identifiant unique basé sur le timestamp
 * @returns Identifiant unique
 */
export const generateUniqueId = (): string => {
  return Date.now().toString();
};

/**
 * Formate un nombre pour affichage dans un input avec séparateur de milliers (espace)
 * @param value - Valeur numérique
 * @returns Chaîne formatée avec espaces
 */
export const formatNumberInput = (value: number): string => {
  return value.toLocaleString("fr-FR");
};

/**
 * Parse une chaîne formatée en nombre (retire les espaces)
 * @param value - Chaîne formatée
 * @returns Nombre parsé
 */
export const parseNumberInput = (value: string): number => {
  const cleaned = value.replace(/\s/g, "");
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
