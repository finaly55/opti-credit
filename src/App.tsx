/**
 * Composant principal du simulateur immobilier
 * Orchestre tous les sous-composants et le hook de simulation
 */

import React from "react";
import { PieChart, Wallet } from "lucide-react";
import type { ActiveTab } from "./types";
import { useSimulation } from "./hooks";
import { Header } from "./components/layout";
import { Tabs } from "./components/ui";
import { ResultCard, DetailTable } from "./components/cards";
import { SimulationChart } from "./components/charts";
import { ParametersPanel } from "./components/forms";

/** Configuration des onglets */
const TABS: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
  {
    id: "monthly",
    label: "Coût Mensuel",
    icon: <PieChart className="w-4 h-4" />,
  },
  { id: "wealth", label: "Patrimoine", icon: <Wallet className="w-4 h-4" /> },
];

/**
 * Composant racine du simulateur immobilier
 */
const RealEstateSimulator: React.FC = () => {
  const { state, calculated, handlers, isLoaded } = useSimulation();

  // État local pour l'onglet actif (non persisté)
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("monthly");

  // Affichage de chargement
  if (!isLoaded) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  return (
    <div
      className="flex flex-col md:flex-row gap-6 p-4 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans text-slate-800"
      data-testid="real-estate-simulator"
    >
      {/* Colonne gauche: Paramètres */}
      <div className="w-full md:w-1/3 space-y-4" data-testid="params-section">
        {/* Header */}
        <Header onReset={handlers.handleReset} />

        {/* Tabs */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Résultat Flash */}
        <ResultCard
          activeTab={activeTab}
          targetData={calculated.targetData}
          isWinnerWealth={calculated.isWinnerWealth}
          isWinnerMonthly={calculated.isWinnerMonthly}
          breakEvenWealth={calculated.breakEvenWealth}
          breakEvenMonthly={calculated.breakEvenMonthly}
        />

        {/* Panneau de paramètres unifié et compact */}
        <ParametersPanel
          params={state.params}
          targetYear={state.targetYear}
          manualTargetPrice={calculated.manualTargetPrice}
          customExpenses={state.customExpenses}
          totalInitialExpenses={calculated.totalInitialExpenses}
          onPriceChange={handlers.handlePropertyPriceChange}
          onApportChange={handlers.handleApportChange}
          onPropertyTypeChange={handlers.handlePropertyTypeChange}
          onNotaryAmountChange={handlers.handleNotaryAmountChange}
          onNotaryPercentChange={handlers.handleNotaryPercentChange}
          onRateChange={handlers.handleStandardRateChange}
          onPurchaseDateChange={handlers.handlePurchaseDateChange}
          onYearChange={handlers.handleYearChange}
          onTargetPriceChange={handlers.handleTargetPriceChange}
          onAgencyFeesChange={(percent) =>
            handlers.setParams({ ...state.params, agencyFeesPercent: percent })
          }
          onDiagnosticsChange={(amount) =>
            handlers.setParams({ ...state.params, saleDiagnostics: amount })
          }
          onParamsChange={handlers.setParams}
          onAddExpense={handlers.addCustomExpense}
          onRemoveExpense={handlers.removeCustomExpense}
        />
      </div>

      {/* Colonne droite: Résultats (Graphique + Détail) */}
      <div className="w-full md:w-2/3 space-y-6" data-testid="results-section">
        <SimulationChart
          activeTab={activeTab}
          graphScale={state.graphScale}
          isLogScale={state.isLogScale}
          simulationData={calculated.simulationData}
          targetYear={state.targetYear}
          purchaseDate={state.params.purchaseDate}
          onScaleChange={handlers.setGraphScale}
          onLogScaleChange={handlers.setIsLogScale}
          onTargetYearChange={handlers.handleYearChange}
        />

        <DetailTable
          activeTab={activeTab}
          targetYear={state.targetYear}
          targetData={calculated.targetData}
          params={state.params}
        />
      </div>
    </div>
  );
};

export default RealEstateSimulator;
