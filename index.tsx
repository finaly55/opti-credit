import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Calculator,
  Home,
  TrendingUp,
  AlertCircle,
  Euro,
  Settings,
  Wallet,
  Tag,
  PieChart,
  ShoppingCart,
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Percent,
  Building,
  FileText,
  Clock,
} from "lucide-react";

// --- Types et Interfaces ---

interface Loan {
  id: string;
  name: string;
  amount: number;
  rate: number;
  durationMonths: number;
  insuranceRate: number;
  deferredMonths: number;
}

interface CustomExpense {
  id: string;
  name: string;
  amount: number;
  type: "initial" | "monthly" | "yearly";
}

interface SimulationParams {
  propertyPrice: number;
  propertyType: "ancien" | "neuf";
  notaryFees: number;
  notaryFeesPercent: number;
  renovationCost: number;
  propertyAppreciation: number;
  agencyFeesPercent: number;
  saleDiagnostics: number;
  apportPersonnel: number;
  loans: Loan[];
  propertyTax: number;
  condoFees: number;
  maintenanceCost: number;
  monthlyExtraCosts: number;
  yearlyExtraCosts: number;
  monthlyRent: number;
  savingsRate: number;
  rentInflation: number;
}

const DefaultParams: SimulationParams = {
  propertyPrice: 286000,
  propertyType: "ancien",
  notaryFees: 21450,
  notaryFeesPercent: 7.5,
  renovationCost: 8000,
  propertyAppreciation: 0,
  agencyFeesPercent: 5,
  saleDiagnostics: 400,
  apportPersonnel: 25000,
  loans: [
    {
      id: "ptz",
      name: "PTZ (État)",
      amount: 75600,
      rate: 0,
      durationMonths: 240,
      insuranceRate: 0.36,
      deferredMonths: 60,
    },
    {
      id: "boost",
      name: "Prêt Boost",
      amount: 15000,
      rate: 0,
      durationMonths: 240,
      insuranceRate: 0.36,
      deferredMonths: 0,
    },
    {
      id: "standard",
      name: "Prêt Standard",
      amount: 169950,
      rate: 1.18,
      durationMonths: 300,
      insuranceRate: 0.36,
      deferredMonths: 0,
    },
  ],
  propertyTax: 1200,
  condoFees: 180,
  maintenanceCost: 0,
  monthlyExtraCosts: 0,
  yearlyExtraCosts: 0,
  monthlyRent: 902,
  savingsRate: 3.0,
  rentInflation: 1.5,
};

const calculateMonthlyPayment = (
  amount: number,
  rate: number,
  duration: number
) => {
  if (rate === 0) return amount / duration;
  const monthlyRate = rate / 100 / 12;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration));
};

const STORAGE_KEY = "immo_sim_v23_data";

export default function RealEstateSimulator() {
  const [activeTab, setActiveTab] = useState<"wealth" | "monthly">("monthly");
  const [graphScale, setGraphScale] = useState<"years" | "months">("years");
  const [isSmoothCurve, setIsSmoothCurve] = useState(true);
  const [params, setParams] = useState<SimulationParams>(DefaultParams);
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [targetYear, setTargetYear] = useState<number>(4);
  const [isBaseExpensesOpen, setIsBaseExpensesOpen] = useState(false);
  const [isOtherExpensesOpen, setIsOtherExpensesOpen] = useState(false);
  const [manualTargetPrice, setManualTargetPrice] = useState<number>(
    DefaultParams.propertyPrice
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Formulaire ajout dépense
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseType, setNewExpenseType] = useState<
    "initial" | "monthly" | "yearly"
  >("initial");

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const loadedParams = { ...DefaultParams, ...parsed.params };
        if (parsed.customExpenses) setCustomExpenses(parsed.customExpenses);
        if (parsed.targetYear) setTargetYear(parsed.targetYear);
        if (parsed.graphScale) setGraphScale(parsed.graphScale);
        if (parsed.isSmoothCurve !== undefined)
          setIsSmoothCurve(parsed.isSmoothCurve);
        setParams(loadedParams);
      } catch (e) {
        console.error("Erreur lecture sauvegarde", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const dataToSave = {
        params,
        customExpenses,
        targetYear,
        graphScale,
        isSmoothCurve,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [params, customExpenses, targetYear, graphScale, isSmoothCurve, isLoaded]);

  useEffect(() => {
    const futureValue =
      params.propertyPrice *
      Math.pow(1 + params.propertyAppreciation / 100, targetYear);
    setManualTargetPrice(Math.round(futureValue));
  }, [targetYear, params.propertyPrice, params.propertyAppreciation]);

  const handleReset = () => {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données ?")) {
      setParams(DefaultParams);
      setCustomExpenses([]);
      setTargetYear(4);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const addCustomExpense = () => {
    if (!newExpenseName || !newExpenseAmount) return;
    const newExpense: CustomExpense = {
      id: Date.now().toString(),
      name: newExpenseName,
      amount: parseFloat(newExpenseAmount),
      type: newExpenseType,
    };
    setCustomExpenses([...customExpenses, newExpense]);
    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  const removeCustomExpense = (id: string) => {
    setCustomExpenses(customExpenses.filter((e) => e.id !== id));
  };

  const handleYearChange = (newYear: number) => {
    setTargetYear(newYear);
    if (newYear > 0) {
      const ratio = manualTargetPrice / params.propertyPrice;
      const newRate = (Math.pow(ratio, 1 / newYear) - 1) * 100;
      setParams((prev) => ({ ...prev, propertyAppreciation: newRate }));
    }
  };

  const handlePriceChange = (newPrice: number) => {
    setManualTargetPrice(newPrice);
    if (targetYear > 0) {
      const ratio = newPrice / params.propertyPrice;
      const newRate = (Math.pow(ratio, 1 / targetYear) - 1) * 100;
      setParams((prev) => ({ ...prev, propertyAppreciation: newRate }));
    }
  };

  const recalculateLoan = (
    price: number,
    apport: number,
    notaire: number,
    currentParams: SimulationParams
  ) => {
    const ptzAmount =
      currentParams.loans.find((l) => l.id === "ptz")?.amount || 0;
    const boostAmount =
      currentParams.loans.find((l) => l.id === "boost")?.amount || 0;
    let newStandardAmount = price - apport - ptzAmount - boostAmount;
    if (newStandardAmount < 0) newStandardAmount = 0;
    return newStandardAmount;
  };

  const handlePurchasePriceChange = (newPrice: number) => {
    const newNotaryFees = Math.round(
      newPrice * (params.notaryFeesPercent / 100)
    );
    const newStandardAmount = recalculateLoan(
      newPrice,
      params.apportPersonnel,
      newNotaryFees,
      params
    );

    setParams((prev) => ({
      ...prev,
      propertyPrice: newPrice,
      notaryFees: newNotaryFees,
      loans: prev.loans.map((loan) =>
        loan.id === "standard" ? { ...loan, amount: newStandardAmount } : loan
      ),
    }));
  };

  const handleApportChange = (newApport: number) => {
    const newStandardAmount = recalculateLoan(
      params.propertyPrice,
      newApport,
      params.notaryFees,
      params
    );

    setParams((prev) => ({
      ...prev,
      apportPersonnel: newApport,
      loans: prev.loans.map((loan) =>
        loan.id === "standard" ? { ...loan, amount: newStandardAmount } : loan
      ),
    }));
  };

  const handlePropertyTypeChange = (type: "ancien" | "neuf") => {
    const newPercent = type === "ancien" ? 7.5 : 2.5;
    const newAmount = Math.round(params.propertyPrice * (newPercent / 100));
    setParams((prev) => ({
      ...prev,
      propertyType: type,
      notaryFeesPercent: newPercent,
      notaryFees: newAmount,
    }));
  };

  const handleNotaryAmountChange = (newAmount: number) => {
    const newPercent = (newAmount / params.propertyPrice) * 100;
    setParams((prev) => ({
      ...prev,
      notaryFees: newAmount,
      notaryFeesPercent: parseFloat(newPercent.toFixed(2)),
    }));
  };

  const handleNotaryPercentChange = (newPercent: number) => {
    const newAmount = Math.round(params.propertyPrice * (newPercent / 100));
    setParams((prev) => ({
      ...prev,
      notaryFeesPercent: newPercent,
      notaryFees: newAmount,
    }));
  };

  const handleStandardRateChange = (newRate: number) => {
    setParams((prev) => ({
      ...prev,
      loans: prev.loans.map((loan) =>
        loan.id === "standard" ? { ...loan, rate: newRate } : loan
      ),
    }));
  };

  // --- CALCULS ---

  const totalInitialExpenses = useMemo(
    () =>
      params.renovationCost +
      customExpenses
        .filter((e) => e.type === "initial")
        .reduce((sum, e) => sum + e.amount, 0),
    [params.renovationCost, customExpenses]
  );

  const totalMonthlyExpenses = useMemo(
    () =>
      params.monthlyExtraCosts +
      customExpenses
        .filter((e) => e.type === "monthly")
        .reduce((sum, e) => sum + e.amount, 0),
    [params.monthlyExtraCosts, customExpenses]
  );

  const totalYearlyExpenses = useMemo(
    () =>
      params.yearlyExtraCosts +
      customExpenses
        .filter((e) => e.type === "yearly")
        .reduce((sum, e) => sum + e.amount, 0),
    [params.yearlyExtraCosts, customExpenses]
  );

  const totalAnnualizedCharges = useMemo(() => {
    return (
      (params.condoFees + totalMonthlyExpenses) * 12 +
      (params.propertyTax + totalYearlyExpenses)
    );
  }, [
    params.condoFees,
    totalMonthlyExpenses,
    params.propertyTax,
    totalYearlyExpenses,
  ]);

  const simulationData = useMemo(() => {
    const monthlyData = [];
    const yearlyData = [];

    let currentPropertyVal = params.propertyPrice;
    let currentRent = params.monthlyRent;

    let tenantSavings =
      params.apportPersonnel + params.notaryFees + totalInitialExpenses;
    let accumulatedTenantInterests = 0;
    let accumulatedOwnerCosts = params.notaryFees + totalInitialExpenses;
    let accumulatedRunningCosts = 0;
    let accumulatedRent = 0;

    let loansState = params.loans.map((loan) => ({
      ...loan,
      remainingCapital: loan.amount,
      monthlyPayment: calculateMonthlyPayment(
        loan.amount,
        loan.rate,
        loan.durationMonths - loan.deferredMonths
      ),
    }));

    for (let m = 0; m <= 300; m++) {
      if (m === 0) {
      } else {
        const monthlyAppreciationRate =
          Math.pow(1 + params.propertyAppreciation / 100, 1 / 12) - 1;
        currentPropertyVal = currentPropertyVal * (1 + monthlyAppreciationRate);

        if (m > 1 && (m - 1) % 12 === 0) {
          currentRent = currentRent * (1 + params.rentInflation / 100);
        }
        accumulatedRent += currentRent;

        let currentMonthCapitalRepaid = 0;
        let currentMonthInterest = 0;
        let currentMonthInsurance = 0;

        loansState.forEach((loan) => {
          const monthlyIns = (loan.amount * (loan.insuranceRate / 100)) / 12;
          currentMonthInsurance += monthlyIns;

          if (m <= loan.durationMonths) {
            if (m <= loan.deferredMonths) {
              if (loan.rate > 0 && loan.deferredMonths > 0) {
                const interest = loan.remainingCapital * (loan.rate / 100 / 12);
                currentMonthInterest += interest;
              }
            } else {
              const interest = loan.remainingCapital * (loan.rate / 100 / 12);
              const principal = loan.monthlyPayment - interest;
              if (loan.remainingCapital > 0) {
                loan.remainingCapital -= principal;
                if (loan.remainingCapital < 0) loan.remainingCapital = 0;
                currentMonthInterest += interest;
                currentMonthCapitalRepaid += principal;
              }
            }
          }
        });

        const debtRemaining = loansState.reduce(
          (acc, loan) => acc + loan.remainingCapital,
          0
        );

        const currentMonthSunkCosts =
          currentMonthInterest +
          currentMonthInsurance +
          params.propertyTax / 12 +
          params.condoFees +
          totalMonthlyExpenses +
          totalYearlyExpenses / 12;

        accumulatedRunningCosts += currentMonthSunkCosts;
        accumulatedOwnerCosts += currentMonthSunkCosts;

        const ownerMonthlyCashOut =
          currentMonthCapitalRepaid +
          currentMonthInterest +
          currentMonthInsurance +
          params.propertyTax / 12 +
          params.condoFees +
          totalMonthlyExpenses +
          totalYearlyExpenses / 12;

        const tenantMonthlyCashOut = currentRent;
        const cashFlowDifference = ownerMonthlyCashOut - tenantMonthlyCashOut;

        const monthlyInterestRate = params.savingsRate / 100 / 12;
        const interestEarnedThisMonth = tenantSavings * monthlyInterestRate;

        if (tenantSavings > 0) {
          accumulatedTenantInterests += interestEarnedThisMonth;
          tenantSavings += interestEarnedThisMonth;
        }
        tenantSavings += cashFlowDifference;

        const sellingCosts =
          (currentPropertyVal * params.agencyFeesPercent) / 100 +
          params.saleDiagnostics;
        const ownerNetWealth =
          currentPropertyVal - sellingCosts - debtRemaining;

        const totalAcquisition =
          params.propertyPrice + params.notaryFees + totalInitialExpenses;
        const totalCostAbsolute =
          totalAcquisition +
          accumulatedRunningCosts +
          sellingCosts -
          currentPropertyVal;

        const monthlyCostOwner = totalCostAbsolute / m;
        const monthlyCostTenant = accumulatedRent / m;
        const monthlyInterestsEarned = accumulatedTenantInterests / m;

        const dataPoint = {
          month: m,
          year: parseFloat((m / 12).toFixed(1)),
          ownerWealth: Math.round(ownerNetWealth),
          tenantWealth: Math.round(tenantSavings),
          monthlyCostOwner: Math.round(monthlyCostOwner),
          monthlyCostTenant: Math.round(monthlyCostTenant),
          monthlyInterestsEarned: Math.round(monthlyInterestsEarned),
          propertyValue: Math.round(currentPropertyVal),
          netSalePrice: Math.round(currentPropertyVal - sellingCosts),
          sellingCosts: Math.round(sellingCosts),
          debtRemaining: Math.round(debtRemaining),
          sunkCosts: Math.round(accumulatedOwnerCosts),
        };

        monthlyData.push(dataPoint);
        if (m % 12 === 0) {
          yearlyData.push({ ...dataPoint, year: m / 12 });
        }
      }
    }
    return { monthlyData, yearlyData };
  }, [params, totalInitialExpenses, totalMonthlyExpenses, totalYearlyExpenses]);

  const targetDataIndex = targetYear * 12 - 1;
  const targetData =
    simulationData.monthlyData[targetDataIndex] ||
    simulationData.monthlyData[simulationData.monthlyData.length - 1];

  const isWinnerWealth = targetData.ownerWealth > targetData.tenantWealth;
  const isWinnerMonthly =
    targetData.monthlyCostOwner < targetData.monthlyCostTenant;

  const breakEvenDataMonthly = simulationData.monthlyData.find(
    (d) => d.month > 0 && d.monthlyCostOwner <= d.monthlyCostTenant
  );
  const breakEvenDataWealth = simulationData.monthlyData.find(
    (d) => d.month > 0 && d.ownerWealth >= d.tenantWealth
  );

  const standardLoan = params.loans.find((l) => l.id === "standard");

  if (!isLoaded) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans text-slate-800">
      {/* Colonne de Gauche */}
      <div className="w-full md:w-1/3 space-y-6">
        {/* Header */}
        <div className="px-1">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              Simulateur Immo
            </h1>
            <button
              onClick={handleReset}
              title="Réinitialiser"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "monthly"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Coût Mensuel
          </button>
          <button
            onClick={() => setActiveTab("wealth")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "wealth"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Patrimoine
          </button>
        </div>

        {/* Résultat Flash */}
        <div
          className={`p-6 rounded-2xl shadow-lg text-white transition-colors duration-500 flex flex-col justify-between ${
            (activeTab === "wealth" ? isWinnerWealth : isWinnerMonthly)
              ? "bg-emerald-600"
              : "bg-rose-600"
          }`}
          style={{ height: "280px", minHeight: "280px" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Calculator className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">
                {activeTab === "wealth"
                  ? "Gain Net / Location"
                  : "Coût de revient / mois"}
              </h2>
            </div>

            {activeTab === "wealth" ? (
              <>
                <div className="text-4xl font-extrabold mb-2">
                  {targetData.ownerWealth - targetData.tenantWealth > 0
                    ? "+"
                    : ""}
                  {(
                    targetData.ownerWealth - targetData.tenantWealth
                  ).toLocaleString()}{" "}
                  €
                </div>
                <p className="opacity-90 text-sm">
                  {isWinnerWealth
                    ? "Vous êtes plus riche que si vous étiez resté locataire."
                    : "Votre patrimoine serait plus élevé en restant locataire."}
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl font-extrabold mb-1">
                  {targetData.monthlyCostOwner.toLocaleString()} €
                  <span className="text-lg font-normal opacity-80"> /mois</span>
                </div>
                <div className="text-sm opacity-80 mb-4 border-l-2 border-white/30 pl-3">
                  vs Loyer moyen :{" "}
                  {targetData.monthlyCostTenant.toLocaleString()} €
                </div>
                <p className="opacity-90 text-sm font-medium">
                  {isWinnerMonthly
                    ? `Économie mensuelle : ${Math.abs(
                        targetData.monthlyCostOwner -
                          targetData.monthlyCostTenant
                      ).toLocaleString()} €`
                    : `Surcoût mensuel : ${Math.abs(
                        targetData.monthlyCostOwner -
                          targetData.monthlyCostTenant
                      ).toLocaleString()} €`}
                </p>
              </>
            )}
          </div>

          <div className="border-t border-white/20 pt-4 mt-auto">
            {activeTab === "wealth" ? (
              !isWinnerWealth && breakEvenDataWealth ? (
                <p className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Rentable à partir de l'année {
                    breakEvenDataWealth.year
                  } (Mois {breakEvenDataWealth.month})
                </p>
              ) : !isWinnerWealth ? (
                <p className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Jamais rentable sur 25 ans
                </p>
              ) : (
                <p className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Rentabilité atteinte
                </p>
              )
            ) : !isWinnerMonthly && breakEvenDataMonthly ? (
              <p className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Moins cher que le loyer dès l'année {
                  breakEvenDataMonthly.year
                }{" "}
                (Mois {breakEvenDataMonthly.month})
              </p>
            ) : !isWinnerMonthly ? (
              <p className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Toujours plus cher que le loyer
              </p>
            ) : (
              <p className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Plus économique que la location
              </p>
            )}
          </div>
        </div>

        {/* 1. ACQUISITION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100">
            <ShoppingCart className="w-5 h-5" />
            Acquisition & Financement
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Prix Achat (Input Compact Style) */}
            <div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <label className="text-sm font-bold text-slate-500">
                  Prix d'Achat
                </label>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={params.propertyPrice}
                    onChange={(e) =>
                      handlePurchasePriceChange(Number(e.target.value))
                    }
                    className="w-20 text-right font-mono text-sm outline-none text-slate-800"
                  />
                  <span className="text-sm font-bold text-slate-500">€</span>
                </div>
              </div>
              <input
                type="range"
                min={100000}
                max={500000}
                step={500}
                value={params.propertyPrice}
                onChange={(e) =>
                  handlePurchasePriceChange(Number(e.target.value))
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
              />
            </div>

            {/* Frais de Notaire (Avancés) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Frais de Notaire
                </label>

                <div className="flex bg-white rounded border border-slate-200 p-0.5">
                  <button
                    onClick={() => handlePropertyTypeChange("ancien")}
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      params.propertyType === "ancien"
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Ancien
                  </button>
                  <button
                    onClick={() => handlePropertyTypeChange("neuf")}
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      params.propertyType === "neuf"
                        ? "bg-blue-100 text-blue-700 font-bold"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Neuf
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                  <input
                    type="number"
                    value={params.notaryFees}
                    onChange={(e) =>
                      handleNotaryAmountChange(Number(e.target.value))
                    }
                    className="w-full text-sm font-mono text-right outline-none text-slate-700"
                  />
                  <span className="text-xs text-slate-400">€</span>
                </div>

                <span className="text-slate-300 text-sm">=</span>

                <div className="w-20 flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                  <input
                    type="number"
                    step="0.1"
                    value={params.notaryFeesPercent}
                    onChange={(e) =>
                      handleNotaryPercentChange(Number(e.target.value))
                    }
                    className="w-full text-sm font-mono text-right outline-none text-slate-700"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Apport (Compact Style) */}
            <div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <label className="text-sm font-bold text-slate-500">
                  Apport Personnel
                </label>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={params.apportPersonnel}
                    onChange={(e) => handleApportChange(Number(e.target.value))}
                    className="w-20 text-right font-mono text-sm outline-none text-slate-800"
                  />
                  <span className="text-sm font-bold text-slate-500">€</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={params.propertyPrice - 90600}
                step={500}
                value={params.apportPersonnel}
                onChange={(e) => handleApportChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500 mt-2"
              />
            </div>

            {/* Taux Crédit (Compact Style) */}
            <div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <label className="text-sm font-bold text-slate-500">
                  Taux Global
                </label>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
                  <input
                    type="number"
                    step="0.01"
                    value={standardLoan?.rate}
                    onChange={(e) =>
                      handleStandardRateChange(Number(e.target.value))
                    }
                    className="w-14 text-right font-mono text-sm outline-none text-slate-800"
                  />
                  <span className="text-sm font-bold text-slate-500">%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.01}
                value={standardLoan?.rate}
                onChange={(e) =>
                  handleStandardRateChange(Number(e.target.value))
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500 mt-2"
              />
            </div>
          </div>
        </div>

        {/* 2. PARAMETRES DE VENTE */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
          <h3 className="font-bold flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100">
            <Settings className="w-5 h-5" />
            Paramètres de Vente
          </h3>

          {/* Slider Durée */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
              <span>Durée détention</span>
              <span className="font-bold text-blue-600">{targetYear} ans</span>
            </label>
            <input
              type="range"
              min="1"
              max="25"
              value={targetYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Slider Prix Vente (Input Compact) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-blue-700 uppercase">
                Prix de Vente
              </label>
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-blue-200 shadow-sm">
                <input
                  type="number"
                  value={manualTargetPrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-20 text-right font-bold text-sm text-blue-800 outline-none"
                />
                <span className="text-sm font-bold text-blue-700">€</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={Math.round(params.propertyPrice * 0.7)}
                max={Math.round(params.propertyPrice * 1.6)}
                step={1000}
                value={manualTargetPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded text-blue-600 border border-blue-100 whitespace-nowrap min-w-[70px] text-center">
                {params.propertyAppreciation > 0 ? "+" : ""}
                {params.propertyAppreciation.toFixed(2)}% / an
              </span>
            </div>
          </div>
        </div>

        {/* 3. DEPENSES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold flex items-center gap-2 text-slate-700">
              <Tag className="w-5 h-5" />
              Dépenses & Charges
            </h3>

            {/* --- RECAPITULATIF DES CHARGES (Deplacé ici) --- */}
            <div className="flex gap-2 text-[10px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-100 shadow-sm">
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Initial: </span>
                <span className="font-bold text-slate-700">
                  {totalInitialExpenses.toLocaleString()} €
                </span>
              </div>
              <div className="w-px bg-slate-200 h-3"></div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Annuel: </span>
                <span className="font-bold text-slate-700">
                  {totalAnnualizedCharges.toLocaleString()} €
                </span>
              </div>
            </div>
          </div>

          {/* CHARGES DE BASE */}
          <div className="space-y-3">
            <button
              onClick={() => setIsBaseExpensesOpen(!isBaseExpensesOpen)}
              className="w-full flex justify-between items-center text-xs font-bold text-slate-500 uppercase hover:text-slate-700"
            >
              <span>Charges de Base</span>
              {isBaseExpensesOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isBaseExpensesOpen && (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2">
                {/* Initial */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Coût Initial Base
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-24">Cuisine</span>
                    <input
                      type="number"
                      step="10"
                      value={params.renovationCost}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          renovationCost: Number(e.target.value),
                        })
                      }
                      className="flex-1 p-1.5 border rounded text-sm text-right"
                    />
                    <span className="text-xs text-slate-500">€</span>
                  </div>
                </div>

                {/* Mensuel */}
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Charges Mensuelles
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-500 w-24">Copro</span>
                    <input
                      type="number"
                      step="10"
                      value={params.condoFees}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          condoFees: Number(e.target.value),
                        })
                      }
                      className="flex-1 p-1.5 border rounded text-sm text-right"
                    />
                    <span className="text-xs text-slate-500">€</span>
                  </div>
                </div>

                {/* Annuel */}
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Charges Annuelles
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-500 w-24">
                      Taxe Foncière
                    </span>
                    <input
                      type="number"
                      step="10"
                      value={params.propertyTax}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          propertyTax: Number(e.target.value),
                        })
                      }
                      className="flex-1 p-1.5 border rounded text-sm text-right"
                    />
                    <span className="text-xs text-slate-500">€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-24">
                      Agence Vente %
                    </span>
                    <input
                      type="number"
                      value={params.agencyFeesPercent}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          agencyFeesPercent: Number(e.target.value),
                        })
                      }
                      className="flex-1 p-1.5 border rounded text-sm text-right"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AUTRES DEPENSES */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsOtherExpensesOpen(!isOtherExpensesOpen)}
              className="w-full flex justify-between items-center mb-2"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase cursor-pointer">
                  Autres Dépenses
                </label>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                  {customExpenses.length}
                </span>
              </div>
              {isOtherExpensesOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isOtherExpensesOpen && (
              <div className="animate-in slide-in-from-top-2">
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {customExpenses.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Aucune dépense supplémentaire.
                    </p>
                  )}
                  {customExpenses.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded border border-slate-100"
                    >
                      <div>
                        <span className="font-medium text-slate-700">
                          {item.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          (
                          {item.type === "initial"
                            ? "Initial"
                            : item.type === "monthly"
                            ? "/mois"
                            : "/an"}
                          )
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-600">
                          {item.amount.toLocaleString()} €
                        </span>
                        <button
                          onClick={() => removeCustomExpense(item.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Ravalement"
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
                    className="col-span-5 p-2 text-xs border rounded"
                  />
                  <input
                    type="number"
                    step="10"
                    placeholder="Montant"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="col-span-3 p-2 text-xs border rounded"
                  />
                  <select
                    value={newExpenseType}
                    onChange={(e) => setNewExpenseType(e.target.value as any)}
                    className="col-span-3 p-2 text-xs border rounded bg-white"
                  >
                    <option value="initial">Initial</option>
                    <option value="yearly">/ An</option>
                    <option value="monthly">/ Mois</option>
                  </select>
                  <button
                    onClick={addCustomExpense}
                    className="col-span-1 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. SCÉNARIO LOCATION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100">
            <Building className="w-5 h-5" />
            Scénario Location
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Loyer mensuel évité
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="50"
                  value={params.monthlyRent}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      monthlyRent: parseFloat(e.target.value),
                    })
                  }
                  className="w-24 p-2 border rounded text-right font-mono text-sm"
                />
                <span className="text-sm text-slate-600">€</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Taux Épargne
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={params.savingsRate}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      savingsRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-20 p-2 border rounded text-right font-mono text-sm"
                />
                <span className="text-sm text-slate-600">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne de Droite */}
      <div className="w-full md:w-2/3 space-y-6">
        {/* Graphique */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-700">
              {activeTab === "wealth"
                ? "Évolution du Patrimoine Net"
                : "Coût Mensuel Moyen (Lissé)"}
            </h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer mr-3">
                <input
                  type="checkbox"
                  checked={isSmoothCurve}
                  onChange={(e) => setIsSmoothCurve(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Courbe exponentielle
              </label>
              <div className="flex bg-slate-100 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setGraphScale("years")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    graphScale === "years"
                      ? "bg-white shadow text-blue-600 font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Années
                </button>
                <button
                  onClick={() => setGraphScale("months")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    graphScale === "months"
                      ? "bg-white shadow text-blue-600 font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mois
                </button>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart
              data={
                graphScale === "years"
                  ? simulationData.yearlyData
                  : simulationData.monthlyData
              }
              margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey={graphScale === "years" ? "year" : "month"}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b" }}
                label={{
                  value: graphScale === "years" ? "Années" : "Mois",
                  position: "insideBottomRight",
                  offset: -10,
                }}
              />
              <YAxis
                tickFormatter={(value) =>
                  `${value > 1000 ? (value / 1000).toFixed(0) + "k" : value}`
                }
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b" }}
                domain={[0, "auto"]}
                padding={{ top: 30 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString()} €`,
                  "",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ bottom: 0 }}
              />
              <ReferenceLine
                x={graphScale === "years" ? targetYear : targetYear * 12}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label="Cible"
              />

              {activeTab === "wealth" ? (
                <>
                  <Line
                    type={isSmoothCurve ? "monotone" : "linear"}
                    dataKey="ownerWealth"
                    name="Propriétaire (Net Vendeur)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type={isSmoothCurve ? "monotone" : "linear"}
                    dataKey="tenantWealth"
                    name="Locataire (Épargne)"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                  />
                </>
              ) : (
                <>
                  <Line
                    type={isSmoothCurve ? "monotone" : "linear"}
                    dataKey="monthlyCostOwner"
                    name="Coût Mensuel Propriétaire"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type={isSmoothCurve ? "monotone" : "linear"}
                    dataKey="monthlyCostTenant"
                    name="Loyer Moyen"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau Détails Année Cible */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">
              Détail à l'année {targetYear}
            </h3>
            <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">
              Vente : {targetData.propertyValue.toLocaleString()} €
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Colonne Propriétaire */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <Home className="w-5 h-5" />
                <span className="font-bold">Propriétaire</span>
              </div>

              {activeTab === "wealth" ? (
                // MODE PATRIMOINE
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prix de vente Brut</span>
                    <span className="font-medium">
                      {targetData.propertyValue.toLocaleString()} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Frais Vente
                    </span>
                    <span className="font-medium">
                      -{targetData.sellingCosts.toLocaleString()} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Remboursement Banque</span>
                    <span className="font-medium text-rose-600">
                      -{targetData.debtRemaining.toLocaleString()} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">
                      Net Vendeur (Poche)
                    </span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {targetData.ownerWealth.toLocaleString()} €
                    </span>
                  </div>
                </>
              ) : (
                // MODE MENSUEL
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Total Dépensé (Frais + Crédit + Travaux)
                    </span>
                    <span className="font-medium text-rose-600">
                      -
                      {(
                        targetData.sunkCosts + params.propertyPrice
                      ).toLocaleString()}{" "}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Récupéré à la vente (Net)
                    </span>
                    <span className="font-medium text-emerald-600">
                      +
                      {(
                        targetData.propertyValue - targetData.sellingCosts
                      ).toLocaleString()}{" "}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">
                      Coût réel / mois
                    </span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {targetData.monthlyCostOwner.toLocaleString()} €
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    C'est ce que vous a coûté votre logement "à fonds perdus"
                    chaque mois.
                  </p>
                </>
              )}
            </div>

            {/* Colonne Locataire */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-700 mb-2">
                <Euro className="w-5 h-5" />
                <span className="font-bold">Locataire</span>
              </div>

              {activeTab === "wealth" ? (
                // MODE PATRIMOINE
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Capital initial placé
                    </span>
                    <span className="font-medium">
                      {(
                        params.apportPersonnel +
                        params.notaryFees +
                        totalInitialExpenses
                      ).toLocaleString()}{" "}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Épargne mensuelle & Intérêts
                    </span>
                    <span className="font-medium text-emerald-600">
                      +
                      {(
                        targetData.tenantWealth -
                        (params.apportPersonnel +
                          params.notaryFees +
                          totalInitialExpenses)
                      ).toLocaleString()}{" "}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">
                      Capital Total Disponible
                    </span>
                    <span className="font-bold text-rose-600 text-lg">
                      {targetData.tenantWealth.toLocaleString()} €
                    </span>
                  </div>
                </>
              ) : (
                // MODE MENSUEL
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Loyer initial</span>
                    <span className="font-medium">
                      {params.monthlyRent.toLocaleString()} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Inflation loyers</span>
                    <span className="font-medium text-rose-600">
                      {params.rentInflation}% /an
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 mt-1">
                    <span className="text-slate-500">
                      Gain sur Placements (Apport/Épargne)
                    </span>
                    <span className="font-medium">
                      +{targetData.monthlyInterestsEarned.toLocaleString()} €
                      /mois
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">
                      Loyer Moyen Payé
                    </span>
                    <span className="font-bold text-rose-600 text-lg">
                      {targetData.monthlyCostTenant.toLocaleString()} €
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Moyenne des loyers versés sur {targetYear} ans.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
