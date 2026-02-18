/**
 * Fonctions utilitaires de calcul pour le simulateur immobilier
 * Toutes les fonctions sont pures et testables
 */

import type {
  Loan,
  LoanState,
  SimulationParams,
  SimulationDataPoint,
  SimulationResult,
  CustomExpense,
} from "../types";
import { MAX_SIMULATION_MONTHS, MONTHS_PER_YEAR } from "../constants";

/**
 * Calcule la mensualité d'un prêt
 * @param amount - Montant emprunté
 * @param rate - Taux annuel en pourcentage
 * @param duration - Durée en mois
 * @returns Mensualité calculée
 */
export const calculateMonthlyPayment = (
  amount: number,
  rate: number,
  duration: number
): number => {
  // Prêt à taux zéro : remboursement linéaire
  if (rate === 0) {
    return amount / duration;
  }

  const monthlyRate = rate / 100 / MONTHS_PER_YEAR;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration));
};

/**
 * Calcule les frais de notaire en fonction du prix et du pourcentage
 * @param propertyPrice - Prix du bien
 * @param notaryFeesPercent - Pourcentage des frais
 * @returns Montant des frais de notaire
 */
export const calculateNotaryFees = (
  propertyPrice: number,
  notaryFeesPercent: number
): number => {
  return Math.round(propertyPrice * (notaryFeesPercent / 100));
};

/**
 * Calcule le montant du prêt standard nécessaire
 * @param price - Prix du bien
 * @param apport - Apport personnel
 * @param ptzAmount - Montant du PTZ
 * @param boostAmount - Montant du prêt Boost
 * @returns Montant du prêt standard
 */
export const calculateStandardLoanAmount = (
  price: number,
  apport: number,
  ptzAmount: number,
  boostAmount: number
): number => {
  const amount = price - apport - ptzAmount - boostAmount;
  return Math.max(0, amount);
};

/**
 * Calcule le taux d'appréciation annuel basé sur le prix futur
 * @param currentPrice - Prix actuel
 * @param futurePrice - Prix futur souhaité
 * @param years - Nombre d'années
 * @returns Taux d'appréciation annuel en pourcentage
 */
export const calculateAppreciationRate = (
  currentPrice: number,
  futurePrice: number,
  years: number
): number => {
  if (years <= 0 || currentPrice <= 0) {
    return 0;
  }

  const ratio = futurePrice / currentPrice;
  return (Math.pow(ratio, 1 / years) - 1) * 100;
};

/**
 * Calcule le prix futur basé sur l'appréciation annuelle
 * @param currentPrice - Prix actuel
 * @param appreciationRate - Taux d'appréciation annuel
 * @param years - Nombre d'années
 * @returns Prix futur estimé
 */
export const calculateFuturePrice = (
  currentPrice: number,
  appreciationRate: number,
  years: number
): number => {
  return Math.round(currentPrice * Math.pow(1 + appreciationRate / 100, years));
};

/**
 * Initialise l'état des prêts pour la simulation
 * @param loans - Liste des prêts
 * @returns Liste des états de prêts initialisés
 */
export const initializeLoansState = (loans: Loan[]): LoanState[] => {
  return loans.map((loan) => ({
    ...loan,
    remainingCapital: loan.amount,
    monthlyPayment: calculateMonthlyPayment(
      loan.amount,
      loan.rate,
      loan.durationMonths - loan.deferredMonths
    ),
  }));
};

/**
 * Calcule le total des dépenses initiales
 * @param renovationCost - Coût des travaux
 * @param customExpenses - Dépenses personnalisées
 * @returns Total des dépenses initiales
 */
export const calculateTotalInitialExpenses = (
  renovationCost: number,
  customExpenses: CustomExpense[]
): number => {
  const customInitial = customExpenses
    .filter((e) => e.type === "initial")
    .reduce((sum, e) => sum + e.amount, 0);

  return renovationCost + customInitial;
};

/**
 * Calcule le total des dépenses mensuelles
 * @param monthlyExtraCosts - Charges mensuelles de base
 * @param customExpenses - Dépenses personnalisées
 * @returns Total des dépenses mensuelles
 */
export const calculateTotalMonthlyExpenses = (
  monthlyExtraCosts: number,
  customExpenses: CustomExpense[]
): number => {
  const customMonthly = customExpenses
    .filter((e) => e.type === "monthly")
    .reduce((sum, e) => sum + e.amount, 0);

  return monthlyExtraCosts + customMonthly;
};

/**
 * Calcule le total des dépenses annuelles
 * @param yearlyExtraCosts - Charges annuelles de base
 * @param customExpenses - Dépenses personnalisées
 * @returns Total des dépenses annuelles
 */
export const calculateTotalYearlyExpenses = (
  yearlyExtraCosts: number,
  customExpenses: CustomExpense[]
): number => {
  const customYearly = customExpenses
    .filter((e) => e.type === "yearly")
    .reduce((sum, e) => sum + e.amount, 0);

  return yearlyExtraCosts + customYearly;
};

/**
 * Calcule le total des charges annualisées
 * @param condoFees - Charges de copropriété mensuelles
 * @param totalMonthlyExpenses - Total mensuel
 * @param propertyTax - Taxe foncière annuelle
 * @param totalYearlyExpenses - Total annuel
 * @returns Total annualisé
 */
export const calculateTotalAnnualizedCharges = (
  condoFees: number,
  totalMonthlyExpenses: number,
  propertyTax: number,
  totalYearlyExpenses: number
): number => {
  return (
    (condoFees + totalMonthlyExpenses) * MONTHS_PER_YEAR +
    (propertyTax + totalYearlyExpenses)
  );
};

/**
 * Interface pour les paramètres de simulation internes
 */
interface SimulationInternalParams {
  params: SimulationParams;
  totalInitialExpenses: number;
  totalMonthlyExpenses: number;
  totalYearlyExpenses: number;
}

/**
 * Exécute la simulation complète sur la durée maximale
 * @param internalParams - Paramètres internes de simulation
 * @returns Résultat de la simulation
 */
export const runSimulation = ({
  params,
  totalInitialExpenses,
  totalMonthlyExpenses,
  totalYearlyExpenses,
}: SimulationInternalParams): SimulationResult => {
  const monthlyData: SimulationDataPoint[] = [];
  const yearlyData: SimulationDataPoint[] = [];

  let currentPropertyVal = params.propertyPrice;
  let currentRent = params.monthlyRent;
  let currentPropertyTax = params.propertyTax;
  let currentCondoFees = params.condoFees;
  let currentMaintenanceCost = params.maintenanceCost;
  let currentTenantCharges = params.tenantMonthlyCharges;

  // Le locataire place l'apport + frais de notaire + travaux dès le départ
  const tenantInitialCapital =
    params.apportPersonnel + params.notaryFees + totalInitialExpenses;
  let tenantSavings = tenantInitialCapital;
  let accumulatedTenantInterests = 0;
  let accumulatedOwnerCosts = params.notaryFees + totalInitialExpenses;
  let accumulatedRunningCosts = 0;
  let accumulatedRent = 0;

  // Coût initial du propriétaire (dépensé immédiatement)
  const ownerInitialCost =
    params.apportPersonnel + params.notaryFees + totalInitialExpenses;

  // Initialisation de l'état des prêts
  const loansState = initializeLoansState(params.loans);

  // Taux net d'épargne après fiscalité (flat tax)
  const netSavingsRate =
    params.savingsRate * (1 - params.savingsTaxRate / 100);

  for (let m = 0; m <= MAX_SIMULATION_MONTHS; m++) {
    // Mois 0 : état initial, pas de calcul
    if (m === 0) {
      continue;
    }

    // Appréciation mensuelle du bien
    const monthlyAppreciationRate =
      Math.pow(1 + params.propertyAppreciation / 100, 1 / MONTHS_PER_YEAR) - 1;
    currentPropertyVal = currentPropertyVal * (1 + monthlyAppreciationRate);

    // Inflation annuelle (sauf première année)
    if (m > 1 && (m - 1) % MONTHS_PER_YEAR === 0) {
      currentRent = currentRent * (1 + params.rentInflation / 100);
      currentTenantCharges =
        currentTenantCharges * (1 + params.rentInflation / 100);
      // Inflation des coûts propriétaire
      currentPropertyTax =
        currentPropertyTax * (1 + params.ownerCostInflation / 100);
      currentCondoFees =
        currentCondoFees * (1 + params.ownerCostInflation / 100);
      currentMaintenanceCost =
        currentMaintenanceCost * (1 + params.ownerCostInflation / 100);
    }
    accumulatedRent += currentRent + currentTenantCharges;

    // Calcul des remboursements mensuels
    let currentMonthCapitalRepaid = 0;
    let currentMonthInterest = 0;
    let currentMonthInsurance = 0;

    loansState.forEach((loan) => {
      // Assurance mensuelle : selon le mode (capital initial ou restant dû)
      const insuranceBase =
        loan.insuranceMode === "remaining"
          ? loan.remainingCapital
          : loan.amount;
      const monthlyIns =
        (insuranceBase * (loan.insuranceRate / 100)) / MONTHS_PER_YEAR;

      if (m <= loan.durationMonths) {
        currentMonthInsurance += monthlyIns;

        if (m <= loan.deferredMonths) {
          // Période de différé : seuls les intérêts intercalaires
          if (loan.rate > 0 && loan.deferredMonths > 0) {
            const interest =
              loan.remainingCapital * (loan.rate / 100 / MONTHS_PER_YEAR);
            currentMonthInterest += interest;
          }
        } else {
          // Période d'amortissement
          const interest =
            loan.remainingCapital * (loan.rate / 100 / MONTHS_PER_YEAR);
          const principal = loan.monthlyPayment - interest;

          if (loan.remainingCapital > 0) {
            loan.remainingCapital -= principal;
            if (loan.remainingCapital < 0) {
              loan.remainingCapital = 0;
            }
            currentMonthInterest += interest;
            currentMonthCapitalRepaid += principal;
          }
        }
      }
    });

    // Dette restante totale
    const debtRemaining = loansState.reduce(
      (acc, loan) => acc + Math.max(0, loan.remainingCapital),
      0
    );

    // IRA (Indemnités de Remboursement Anticipé) : 6 mois d'intérêts, plafondées à 3% du CRD
    const earlyRepaymentFees = calculateEarlyRepaymentFees(loansState, m);

    // Coûts "à fonds perdus" du mois (avec maintenanceCost et inflation)
    const currentMonthSunkCosts =
      currentMonthInterest +
      currentMonthInsurance +
      currentPropertyTax / MONTHS_PER_YEAR +
      currentCondoFees +
      currentMaintenanceCost +
      totalMonthlyExpenses +
      totalYearlyExpenses / MONTHS_PER_YEAR;

    accumulatedRunningCosts += currentMonthSunkCosts;
    accumulatedOwnerCosts += currentMonthSunkCosts;

    // Sortie de trésorerie mensuelle du propriétaire
    const ownerMonthlyCashOut =
      currentMonthCapitalRepaid +
      currentMonthInterest +
      currentMonthInsurance +
      currentPropertyTax / MONTHS_PER_YEAR +
      currentCondoFees +
      currentMaintenanceCost +
      totalMonthlyExpenses +
      totalYearlyExpenses / MONTHS_PER_YEAR;

    // Sortie de trésorerie mensuelle du locataire (loyer + charges locataire)
    const tenantMonthlyCashOut = currentRent + currentTenantCharges;
    const cashFlowDifference = ownerMonthlyCashOut - tenantMonthlyCashOut;

    // Intérêts sur l'épargne du locataire (taux net après flat tax)
    const monthlyInterestRate = netSavingsRate / 100 / MONTHS_PER_YEAR;
    const interestEarnedThisMonth =
      tenantSavings > 0 ? tenantSavings * monthlyInterestRate : 0;

    if (tenantSavings > 0) {
      accumulatedTenantInterests += interestEarnedThisMonth;
      tenantSavings += interestEarnedThisMonth;
    }
    tenantSavings += cashFlowDifference;

    // Calcul du patrimoine net du propriétaire
    const sellingCosts =
      (currentPropertyVal * params.agencyFeesPercent) / 100 +
      params.saleDiagnostics;
    const ownerNetWealth =
      currentPropertyVal -
      sellingCosts -
      earlyRepaymentFees -
      debtRemaining -
      ownerInitialCost;

    // Calcul du coût mensuel moyen
    const totalAcquisition =
      params.propertyPrice + params.notaryFees + totalInitialExpenses;
    const totalCostAbsolute =
      totalAcquisition +
      accumulatedRunningCosts +
      sellingCosts +
      earlyRepaymentFees -
      currentPropertyVal;

    const monthlyCostOwner = totalCostAbsolute / m;
    const monthlyCostTenant = accumulatedRent / m;
    const monthlyInterestsEarned = accumulatedTenantInterests / m;

    const dataPoint: SimulationDataPoint = {
      month: m,
      year: parseFloat((m / MONTHS_PER_YEAR).toFixed(1)),
      ownerWealth: Math.round(ownerNetWealth),
      tenantWealth: Math.round(tenantSavings),
      monthlyCostOwner: Math.round(monthlyCostOwner),
      monthlyCostTenant: Math.round(monthlyCostTenant),
      monthlyInterestsEarned: Math.round(monthlyInterestsEarned),
      propertyValue: Math.round(currentPropertyVal),
      netSalePrice: Math.round(currentPropertyVal - sellingCosts),
      sellingCosts: Math.round(sellingCosts),
      earlyRepaymentFees: Math.round(earlyRepaymentFees),
      debtRemaining: Math.round(debtRemaining),
      sunkCosts: Math.round(accumulatedOwnerCosts),
    };

    monthlyData.push(dataPoint);

    // Agrégation annuelle
    if (m % MONTHS_PER_YEAR === 0) {
      yearlyData.push({ ...dataPoint, year: m / MONTHS_PER_YEAR });
    }
  }

  return { monthlyData, yearlyData };
};

/**
 * Calcule les IRA (Indemnités de Remboursement Anticipé)
 * Règle légale : minimum entre 6 mois d'intérêts et 3% du capital restant dû
 * @param loansState - État actuel des prêts
 * @param currentMonth - Mois courant de la simulation
 * @returns Montant total des IRA
 */
export const calculateEarlyRepaymentFees = (
  loansState: LoanState[],
  currentMonth: number
): number => {
  let totalIRA = 0;

  loansState.forEach((loan) => {
    // Pas d'IRA si le prêt est terminé ou à taux zéro
    if (
      currentMonth >= loan.durationMonths ||
      loan.remainingCapital <= 0 ||
      loan.rate === 0
    ) {
      return;
    }

    const sixMonthsInterest =
      loan.remainingCapital * (loan.rate / 100 / MONTHS_PER_YEAR) * 6;
    const threePercentCapital = loan.remainingCapital * 0.03;
    totalIRA += Math.min(sixMonthsInterest, threePercentCapital);
  });

  return totalIRA;
};

/**
 * Trouve le point de rentabilité patrimoine
 * @param data - Données de simulation
 * @returns Point de rentabilité ou undefined
 */
export const findBreakEvenWealth = (
  data: SimulationDataPoint[]
): SimulationDataPoint | undefined => {
  return data.find((d) => d.month > 0 && d.ownerWealth >= d.tenantWealth);
};

/**
 * Trouve le point de rentabilité coût mensuel
 * @param data - Données de simulation
 * @returns Point de rentabilité ou undefined
 */
export const findBreakEvenMonthly = (
  data: SimulationDataPoint[]
): SimulationDataPoint | undefined => {
  return data.find(
    (d) => d.month > 0 && d.monthlyCostOwner <= d.monthlyCostTenant
  );
};
