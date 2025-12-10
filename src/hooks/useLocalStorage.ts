/**
 * Hook personnalisé pour la persistance dans le localStorage
 * Gère la sérialisation/désérialisation avec typage strict
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Hook générique pour le localStorage avec support TypeScript
 * @param key - Clé de stockage
 * @param initialValue - Valeur initiale
 * @returns Tuple [valeur, setter, reset]
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] => {
  // État local initialisé à partir du localStorage ou de la valeur par défaut
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Vérification côté serveur (SSR)
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Erreur lecture localStorage [${key}]:`, error);
      return initialValue;
    }
  });

  // Synchronisation avec le localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Erreur écriture localStorage [${key}]:`, error);
    }
  }, [key, storedValue]);

  // Fonction de reset
  const reset = useCallback(() => {
    setStoredValue(initialValue);
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur suppression localStorage [${key}]:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, reset];
};
