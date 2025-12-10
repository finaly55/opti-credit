/**
 * Constantes et valeurs par défaut du simulateur
 */

import type { Loan, SimulationParams } from "../types";

/** Clé de stockage localStorage */
export const STORAGE_KEY = "immo_sim_v23_data" as const;

/** Durée maximale de simulation en mois */
export const MAX_SIMULATION_MONTHS = 300 as const;

/** Intervalle de monitoring pour les graphiques mensuels */
export const MONTHS_PER_YEAR = 12 as const;

/** Prêt PTZ par défaut */
export const DEFAULT_PTZ_LOAN: Loan = {
  id: "ptz",
  name: "PTZ (État)",
  amount: 75600,
  rate: 0,
  durationMonths: 240,
  insuranceRate: 0.36,
  deferredMonths: 60,
} as const;

/** Prêt Boost par défaut */
export const DEFAULT_BOOST_LOAN: Loan = {
  id: "boost",
  name: "Prêt Boost",
  amount: 15000,
  rate: 0,
  durationMonths: 240,
  insuranceRate: 0.36,
  deferredMonths: 0,
} as const;

/** Prêt Standard par défaut */
export const DEFAULT_STANDARD_LOAN: Loan = {
  id: "standard",
  name: "Prêt Standard",
  amount: 169950,
  rate: 1.18,
  durationMonths: 300,
  insuranceRate: 0.36,
  deferredMonths: 0,
} as const;

/** Paramètres par défaut de la simulation */
export const DEFAULT_PARAMS: SimulationParams = {
  purchaseDate: new Date().toISOString().split("T")[0], // Date du jour par défaut
  propertyPrice: 286000,
  propertyType: "ancien",
  notaryFees: 21450,
  notaryFeesPercent: 7.5,
  renovationCost: 8000,
  propertyAppreciation: 0,
  agencyFeesPercent: 5,
  saleDiagnostics: 400,
  apportPersonnel: 25000,
  loans: [DEFAULT_PTZ_LOAN, DEFAULT_BOOST_LOAN, DEFAULT_STANDARD_LOAN],
  propertyTax: 1200,
  condoFees: 180,
  maintenanceCost: 0,
  monthlyExtraCosts: 0,
  yearlyExtraCosts: 0,
  monthlyRent: 902,
  savingsRate: 3.0,
  rentInflation: 1.5,
} as const;

/** Pourcentage de frais de notaire pour l'ancien */
export const NOTARY_FEES_PERCENT_OLD = 7.5 as const;

/** Pourcentage de frais de notaire pour le neuf */
export const NOTARY_FEES_PERCENT_NEW = 2.5 as const;

/** Plage de prix minimum pour le slider */
export const PRICE_RANGE_MIN = 100000 as const;

/** Plage de prix maximum pour le slider */
export const PRICE_RANGE_MAX = 500000 as const;

/** Taux d'intérêt maximum pour le slider */
export const RATE_MAX = 10 as const;

/** Durée minimum de détention en années */
export const MIN_HOLDING_YEARS = 1 as const;

/** Durée maximum de détention en années */
export const MAX_HOLDING_YEARS = 25 as const;

/** Année cible par défaut */
export const DEFAULT_TARGET_YEAR = 4 as const;

/** Coefficient minimum pour le prix de vente (70% du prix d'achat) */
export const SALE_PRICE_MIN_COEFFICIENT = 0.7 as const;

/** Coefficient maximum pour le prix de vente (160% du prix d'achat) */
export const SALE_PRICE_MAX_COEFFICIENT = 1.6 as const;
