/**
 * Types et interfaces pour le simulateur immobilier
 * Définitions strictes pour garantir la cohérence des données
 */

/** Identifiants des types de prêts disponibles */
export type LoanId = "ptz" | "boost" | "standard";

/** Type de bien immobilier */
export type PropertyType = "ancien" | "neuf";

/** Type de dépense personnalisée */
export type ExpenseType = "initial" | "monthly" | "yearly";

/** Onglet actif de l'interface */
export type ActiveTab = "wealth" | "monthly";

/** Échelle du graphique */
export type GraphScale = "years" | "months";

/**
 * Interface représentant un prêt immobilier
 */
export interface Loan {
  /** Identifiant unique du prêt */
  readonly id: LoanId;
  /** Nom affiché du prêt */
  name: string;
  /** Montant emprunté en euros */
  amount: number;
  /** Taux d'intérêt annuel en pourcentage */
  rate: number;
  /** Durée totale en mois */
  durationMonths: number;
  /** Taux d'assurance annuel en pourcentage */
  insuranceRate: number;
  /** Nombre de mois de différé */
  deferredMonths: number;
}

/**
 * Interface représentant une dépense personnalisée
 */
export interface CustomExpense {
  /** Identifiant unique généré */
  readonly id: string;
  /** Nom descriptif de la dépense */
  name: string;
  /** Montant en euros */
  amount: number;
  /** Type de récurrence */
  type: ExpenseType;
}

/**
 * Paramètres complets de la simulation
 */
export interface SimulationParams {
  /** Date d'achat du bien (format ISO string) */
  purchaseDate: string;
  /** Prix d'achat du bien en euros */
  propertyPrice: number;
  /** Type de bien (ancien ou neuf) */
  propertyType: PropertyType;
  /** Montant des frais de notaire en euros */
  notaryFees: number;
  /** Pourcentage des frais de notaire */
  notaryFeesPercent: number;
  /** Coût des travaux/rénovation en euros */
  renovationCost: number;
  /** Taux d'appréciation annuel du bien en pourcentage */
  propertyAppreciation: number;
  /** Pourcentage des frais d'agence à la vente */
  agencyFeesPercent: number;
  /** Coût des diagnostics de vente en euros */
  saleDiagnostics: number;
  /** Apport personnel en euros */
  apportPersonnel: number;
  /** Liste des prêts immobiliers */
  loans: Loan[];
  /** Taxe foncière annuelle en euros */
  propertyTax: number;
  /** Charges de copropriété mensuelles en euros */
  condoFees: number;
  /** Coût d'entretien mensuel en euros */
  maintenanceCost: number;
  /** Charges mensuelles supplémentaires en euros */
  monthlyExtraCosts: number;
  /** Charges annuelles supplémentaires en euros */
  yearlyExtraCosts: number;
  /** Loyer mensuel évité en euros */
  monthlyRent: number;
  /** Taux d'épargne annuel en pourcentage */
  savingsRate: number;
  /** Inflation annuelle des loyers en pourcentage */
  rentInflation: number;
}

/**
 * État interne d'un prêt pendant la simulation
 */
export interface LoanState extends Loan {
  /** Capital restant dû */
  remainingCapital: number;
  /** Mensualité calculée */
  monthlyPayment: number;
}

/**
 * Point de données pour un mois de simulation
 */
export interface SimulationDataPoint {
  /** Numéro du mois */
  month: number;
  /** Année correspondante (décimale) */
  year: number;
  /** Patrimoine net du propriétaire en euros */
  ownerWealth: number;
  /** Patrimoine du locataire en euros */
  tenantWealth: number;
  /** Coût mensuel moyen propriétaire en euros */
  monthlyCostOwner: number;
  /** Coût mensuel moyen locataire en euros */
  monthlyCostTenant: number;
  /** Intérêts mensuels moyens gagnés en euros */
  monthlyInterestsEarned: number;
  /** Valeur du bien en euros */
  propertyValue: number;
  /** Prix de vente net en euros */
  netSalePrice: number;
  /** Frais de vente en euros */
  sellingCosts: number;
  /** Dette restante en euros */
  debtRemaining: number;
  /** Coûts irrécupérables cumulés en euros */
  sunkCosts: number;
}

/**
 * Résultat complet de la simulation
 */
export interface SimulationResult {
  /** Données mensuelles */
  monthlyData: SimulationDataPoint[];
  /** Données annuelles (agrégées) */
  yearlyData: SimulationDataPoint[];
}

/**
 * Données sauvegardées dans le localStorage
 */
export interface StoredData {
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Dépenses personnalisées */
  customExpenses: CustomExpense[];
  /** Année cible sélectionnée */
  targetYear: number;
  /** Échelle du graphique */
  graphScale: GraphScale;
  /** Mode courbe lissée */
  isLogScale: boolean;
}
