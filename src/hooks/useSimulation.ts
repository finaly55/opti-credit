/**
 * Hook personnalisé pour la simulation immobilière
 * Encapsule toute la logique de calcul et de gestion d'état
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  SimulationParams,
  CustomExpense,
  SimulationResult,
  SimulationDataPoint,
  GraphScale,
  PropertyType,
  ExpenseType,
  StoredData,
} from "../types";
import {
  DEFAULT_PARAMS,
  DEFAULT_TARGET_YEAR,
  STORAGE_KEY,
  NOTARY_FEES_PERCENT_NEW,
  NOTARY_FEES_PERCENT_OLD,
  MONTHS_PER_YEAR,
} from "../constants";
import {
  calculateNotaryFees,
  calculateStandardLoanAmount,
  calculateAppreciationRate,
  calculateFuturePrice,
  calculateTotalInitialExpenses,
  calculateTotalMonthlyExpenses,
  calculateTotalYearlyExpenses,
  calculateTotalAnnualizedCharges,
  runSimulation,
  findBreakEvenWealth,
  findBreakEvenMonthly,
} from "../utils/calculations";
import { generateUniqueId } from "../utils/formatters";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Interface pour l'état du simulateur
 */
interface SimulatorState {
  params: SimulationParams;
  customExpenses: CustomExpense[];
  targetYear: number;
  graphScale: GraphScale;
  isLogScale: boolean;
}

/**
 * Interface pour les valeurs calculées
 */
interface CalculatedValues {
  totalInitialExpenses: number;
  totalMonthlyExpenses: number;
  totalYearlyExpenses: number;
  totalAnnualizedCharges: number;
  simulationData: SimulationResult;
  targetData: SimulationDataPoint;
  isWinnerWealth: boolean;
  isWinnerMonthly: boolean;
  breakEvenWealth: SimulationDataPoint | undefined;
  breakEvenMonthly: SimulationDataPoint | undefined;
  manualTargetPrice: number;
}

/**
 * Interface pour les handlers du simulateur
 */
interface SimulatorHandlers {
  setParams: (
    params: SimulationParams | ((prev: SimulationParams) => SimulationParams)
  ) => void;
  setTargetYear: (year: number) => void;
  setGraphScale: (scale: GraphScale) => void;
  setIsLogScale: (value: boolean) => void;
  handleReset: () => void;
  handlePropertyPriceChange: (price: number) => void;
  handleApportChange: (apport: number) => void;
  handlePropertyTypeChange: (type: PropertyType) => void;
  handleNotaryAmountChange: (amount: number) => void;
  handleNotaryPercentChange: (percent: number) => void;
  handleStandardRateChange: (rate: number) => void;
  handlePurchaseDateChange: (date: string) => void;
  handleYearChange: (year: number) => void;
  handleTargetPriceChange: (price: number) => void;
  addCustomExpense: (name: string, amount: number, type: ExpenseType) => void;
  removeCustomExpense: (id: string) => void;
}

/**
 * Interface pour le retour du hook
 */
export interface UseSimulationReturn {
  state: SimulatorState;
  calculated: CalculatedValues;
  handlers: SimulatorHandlers;
  isLoaded: boolean;
}

/**
 * Hook principal du simulateur immobilier
 * @returns État, valeurs calculées et handlers
 */
export const useSimulation = (): UseSimulationReturn => {
  const [isLoaded, setIsLoaded] = useState(false);

  // État principal avec persistance localStorage
  const [storedData, setStoredData, resetStorage] = useLocalStorage<StoredData>(
    STORAGE_KEY,
    {
      params: DEFAULT_PARAMS,
      customExpenses: [],
      targetYear: DEFAULT_TARGET_YEAR,
      graphScale: "years",
      isLogScale: false,
    }
  );

  // Extraction des valeurs pour faciliter l'accès
  const params = storedData.params;
  const customExpenses = storedData.customExpenses;
  const targetYear = storedData.targetYear;
  const graphScale = storedData.graphScale;
  const isLogScale = storedData.isLogScale;

  // Prix de vente manuel (calculé à partir de l'appréciation)
  const [manualTargetPrice, setManualTargetPrice] = useState<number>(
    calculateFuturePrice(
      params.propertyPrice,
      params.propertyAppreciation,
      targetYear
    )
  );

  // Marqueur de chargement initial
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Synchronisation du prix cible avec les paramètres
  useEffect(() => {
    const futureValue = calculateFuturePrice(
      params.propertyPrice,
      params.propertyAppreciation,
      targetYear
    );
    setManualTargetPrice(futureValue);
  }, [targetYear, params.propertyPrice, params.propertyAppreciation]);

  // Setters partiels pour mise à jour de l'état
  const setParams = useCallback(
    (
      value: SimulationParams | ((prev: SimulationParams) => SimulationParams)
    ) => {
      setStoredData((prev) => ({
        ...prev,
        params: typeof value === "function" ? value(prev.params) : value,
      }));
    },
    [setStoredData]
  );

  const setCustomExpenses = useCallback(
    (value: CustomExpense[] | ((prev: CustomExpense[]) => CustomExpense[])) => {
      setStoredData((prev) => ({
        ...prev,
        customExpenses:
          typeof value === "function" ? value(prev.customExpenses) : value,
      }));
    },
    [setStoredData]
  );

  const setTargetYear = useCallback(
    (year: number) => {
      setStoredData((prev) => ({ ...prev, targetYear: year }));
    },
    [setStoredData]
  );

  const setGraphScale = useCallback(
    (scale: GraphScale) => {
      setStoredData((prev) => ({ ...prev, graphScale: scale }));
    },
    [setStoredData]
  );

  const setIsLogScale = useCallback(
    (value: boolean) => {
      setStoredData((prev) => ({ ...prev, isLogScale: value }));
    },
    [setStoredData]
  );

  // Calculs mémoïsés des totaux
  const totalInitialExpenses = useMemo(
    () => calculateTotalInitialExpenses(params.renovationCost, customExpenses),
    [params.renovationCost, customExpenses]
  );

  const totalMonthlyExpenses = useMemo(
    () =>
      calculateTotalMonthlyExpenses(params.monthlyExtraCosts, customExpenses),
    [params.monthlyExtraCosts, customExpenses]
  );

  const totalYearlyExpenses = useMemo(
    () => calculateTotalYearlyExpenses(params.yearlyExtraCosts, customExpenses),
    [params.yearlyExtraCosts, customExpenses]
  );

  const totalAnnualizedCharges = useMemo(
    () =>
      calculateTotalAnnualizedCharges(
        params.condoFees,
        totalMonthlyExpenses,
        params.propertyTax,
        totalYearlyExpenses
      ),
    [
      params.condoFees,
      totalMonthlyExpenses,
      params.propertyTax,
      totalYearlyExpenses,
    ]
  );

  // Simulation complète mémoïsée
  const simulationData = useMemo(
    () =>
      runSimulation({
        params,
        totalInitialExpenses,
        totalMonthlyExpenses,
        totalYearlyExpenses,
      }),
    [params, totalInitialExpenses, totalMonthlyExpenses, totalYearlyExpenses]
  );

  // Données à l'année cible
  const targetDataIndex = targetYear * MONTHS_PER_YEAR - 1;
  const targetData =
    simulationData.monthlyData[targetDataIndex] ||
    simulationData.monthlyData[simulationData.monthlyData.length - 1];

  // Indicateurs de rentabilité
  const isWinnerWealth = targetData.ownerWealth > targetData.tenantWealth;
  const isWinnerMonthly =
    targetData.monthlyCostOwner < targetData.monthlyCostTenant;
  const breakEvenWealth = findBreakEvenWealth(simulationData.monthlyData);
  const breakEvenMonthly = findBreakEvenMonthly(simulationData.monthlyData);

  // Handlers pour les modifications
  const handleReset = useCallback(() => {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données ?")) {
      resetStorage();
    }
  }, [resetStorage]);

  const handlePropertyPriceChange = useCallback(
    (price: number) => {
      const newNotaryFees = calculateNotaryFees(
        price,
        params.notaryFeesPercent
      );
      const ptzAmount = params.loans.find((l) => l.id === "ptz")?.amount ?? 0;
      const boostAmount =
        params.loans.find((l) => l.id === "boost")?.amount ?? 0;
      const newStandardAmount = calculateStandardLoanAmount(
        price,
        params.apportPersonnel,
        ptzAmount,
        boostAmount
      );

      setParams((prev) => ({
        ...prev,
        propertyPrice: price,
        notaryFees: newNotaryFees,
        loans: prev.loans.map((loan) =>
          loan.id === "standard" ? { ...loan, amount: newStandardAmount } : loan
        ),
      }));
    },
    [params.notaryFeesPercent, params.apportPersonnel, params.loans, setParams]
  );

  const handleApportChange = useCallback(
    (apport: number) => {
      const ptzAmount = params.loans.find((l) => l.id === "ptz")?.amount ?? 0;
      const boostAmount =
        params.loans.find((l) => l.id === "boost")?.amount ?? 0;
      const newStandardAmount = calculateStandardLoanAmount(
        params.propertyPrice,
        apport,
        ptzAmount,
        boostAmount
      );

      setParams((prev) => ({
        ...prev,
        apportPersonnel: apport,
        loans: prev.loans.map((loan) =>
          loan.id === "standard" ? { ...loan, amount: newStandardAmount } : loan
        ),
      }));
    },
    [params.propertyPrice, params.loans, setParams]
  );

  const handlePropertyTypeChange = useCallback(
    (type: PropertyType) => {
      const newPercent =
        type === "ancien" ? NOTARY_FEES_PERCENT_OLD : NOTARY_FEES_PERCENT_NEW;
      const newAmount = calculateNotaryFees(params.propertyPrice, newPercent);

      setParams((prev) => ({
        ...prev,
        propertyType: type,
        notaryFeesPercent: newPercent,
        notaryFees: newAmount,
      }));
    },
    [params.propertyPrice, setParams]
  );

  const handleNotaryAmountChange = useCallback(
    (amount: number) => {
      const newPercent = (amount / params.propertyPrice) * 100;

      setParams((prev) => ({
        ...prev,
        notaryFees: amount,
        notaryFeesPercent: parseFloat(newPercent.toFixed(2)),
      }));
    },
    [params.propertyPrice, setParams]
  );

  const handleNotaryPercentChange = useCallback(
    (percent: number) => {
      const newAmount = calculateNotaryFees(params.propertyPrice, percent);

      setParams((prev) => ({
        ...prev,
        notaryFeesPercent: percent,
        notaryFees: newAmount,
      }));
    },
    [params.propertyPrice, setParams]
  );

  const handleStandardRateChange = useCallback(
    (rate: number) => {
      setParams((prev) => ({
        ...prev,
        loans: prev.loans.map((loan) =>
          loan.id === "standard" ? { ...loan, rate } : loan
        ),
      }));
    },
    [setParams]
  );

  /** Handler pour le changement de la date d'achat */
  const handlePurchaseDateChange = useCallback(
    (date: string) => {
      setParams((prev) => ({
        ...prev,
        purchaseDate: date,
      }));

      // Calculer automatiquement la durée de détention depuis la date d'achat
      const purchaseDate = new Date(date);
      const today = new Date();
      const diffMs = today.getTime() - purchaseDate.getTime();

      if (diffMs > 0) {
        const diffYears = Math.round(diffMs / (1000 * 60 * 60 * 24 * 365.25));
        if (diffYears >= 1 && diffYears <= 25) {
          setTargetYear(diffYears);
        }
      }
    },
    [setParams, setTargetYear]
  );

  const handleYearChange = useCallback(
    (newYear: number) => {
      setTargetYear(newYear);

      if (newYear > 0) {
        const newRate = calculateAppreciationRate(
          params.propertyPrice,
          manualTargetPrice,
          newYear
        );
        setParams((prev) => ({ ...prev, propertyAppreciation: newRate }));
      }
    },
    [params.propertyPrice, manualTargetPrice, setParams, setTargetYear]
  );

  const handleTargetPriceChange = useCallback(
    (price: number) => {
      setManualTargetPrice(price);

      if (targetYear > 0) {
        const newRate = calculateAppreciationRate(
          params.propertyPrice,
          price,
          targetYear
        );
        setParams((prev) => ({ ...prev, propertyAppreciation: newRate }));
      }
    },
    [params.propertyPrice, targetYear, setParams]
  );

  const addCustomExpense = useCallback(
    (name: string, amount: number, type: ExpenseType) => {
      if (!name || amount <= 0) {
        return;
      }

      const newExpense: CustomExpense = {
        id: generateUniqueId(),
        name,
        amount,
        type,
      };

      setCustomExpenses((prev) => [...prev, newExpense]);
    },
    [setCustomExpenses]
  );

  const removeCustomExpense = useCallback(
    (id: string) => {
      setCustomExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    [setCustomExpenses]
  );

  return {
    state: {
      params,
      customExpenses,
      targetYear,
      graphScale,
      isLogScale,
    },
    calculated: {
      totalInitialExpenses,
      totalMonthlyExpenses,
      totalYearlyExpenses,
      totalAnnualizedCharges,
      simulationData,
      targetData,
      isWinnerWealth,
      isWinnerMonthly,
      breakEvenWealth,
      breakEvenMonthly,
      manualTargetPrice,
    },
    handlers: {
      setParams,
      setTargetYear,
      setGraphScale,
      setIsLogScale,
      handleReset,
      handlePropertyPriceChange,
      handleApportChange,
      handlePropertyTypeChange,
      handleNotaryAmountChange,
      handleNotaryPercentChange,
      handleStandardRateChange,
      handlePurchaseDateChange,
      handleYearChange,
      handleTargetPriceChange,
      addCustomExpense,
      removeCustomExpense,
    },
    isLoaded,
  };
};
