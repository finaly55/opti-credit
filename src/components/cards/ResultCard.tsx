/**
 * Carte de résultat principal (Flash)
 * Affiche le résultat de la simulation avec indicateur visuel
 */

import React from "react";
import { Calculator, TrendingUp, AlertCircle } from "lucide-react";
import type { ActiveTab, SimulationDataPoint } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface ResultCardProps {
  /** Onglet actif (patrimoine ou coût mensuel) */
  activeTab: ActiveTab;
  /** Données à l'année cible */
  targetData: SimulationDataPoint;
  /** Propriétaire gagnant en patrimoine */
  isWinnerWealth: boolean;
  /** Propriétaire gagnant en coût mensuel */
  isWinnerMonthly: boolean;
  /** Point de rentabilité patrimoine */
  breakEvenWealth: SimulationDataPoint | undefined;
  /** Point de rentabilité coût mensuel */
  breakEvenMonthly: SimulationDataPoint | undefined;
}

/**
 * Carte affichant le résultat principal de la simulation
 */
export const ResultCard: React.FC<ResultCardProps> = ({
  activeTab,
  targetData,
  isWinnerWealth,
  isWinnerMonthly,
  breakEvenWealth,
  breakEvenMonthly,
}) => {
  const isWinner = activeTab === "wealth" ? isWinnerWealth : isWinnerMonthly;
  const wealthDifference = targetData.ownerWealth - targetData.tenantWealth;
  const costDifference = Math.abs(
    targetData.monthlyCostOwner - targetData.monthlyCostTenant
  );

  return (
    <div
      className={`p-6 rounded-2xl shadow-lg transition-colors duration-500 flex flex-col justify-between ${
        activeTab === "monthly"
          ? isWinnerMonthly
            ? "bg-emerald-600 text-white"
            : "bg-rose-600 text-white"
          : isWinner
          ? "bg-emerald-600 text-white"
          : "bg-rose-600 text-white"
      }`}
      style={{ minHeight: "220px" }}
      data-testid="result-card"
    >
      <div>
        <div
          className={`flex items-center gap-2 mb-2 ${
            activeTab === "monthly" ? "justify-center" : "opacity-90"
          }`}
        >
          <Calculator
            className={`w-5 h-5 ${activeTab === "monthly" ? "hidden" : ""}`}
          />
          <h2
            className={`text-lg font-bold uppercase tracking-wider ${
              activeTab === "monthly"
                ? "text-xs font-medium text-white opacity-90"
                : ""
            }`}
          >
            {activeTab === "wealth"
              ? "Gain Net / Location"
              : "Perte/mois propriétaire vs location"}
          </h2>
        </div>

        {activeTab === "wealth" ? (
          <>
            <div className="text-4xl font-extrabold mb-2">
              {wealthDifference > 0 ? "+" : ""}
              {formatCurrency(wealthDifference)} €
            </div>
            <p className="opacity-90 text-sm">
              {isWinnerWealth
                ? "Vous êtes plus riche que si vous étiez resté locataire."
                : "Votre patrimoine serait plus élevé en restant locataire."}
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center items-baseline gap-1 mb-4">
              <span className="text-5xl font-extrabold tracking-tight">
                {formatCurrency(targetData.monthlyCostOwner)}
              </span>
              <span className="text-xl opacity-70 font-medium">€</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-white/20 py-4">
              <div className="text-center">
                <div className="text-xs opacity-70 mb-1">Écart</div>
                <div className="text-sm font-semibold">
                  {isWinnerMonthly ? "+" : "-"}
                  {formatCurrency(costDifference)} €
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs opacity-70 mb-1">Rentable</div>
                <div className="text-sm font-semibold">
                  {breakEvenMonthly
                    ? `${Math.floor(breakEvenMonthly.month / 12)} ans et ${breakEvenMonthly.month % 12} mois`
                    : "Jamais"}
                </div>
              </div>
            </div>

            <p className="text-xs opacity-70 text-center">
              Basé sur un loyer de{" "}
              {formatCurrency(targetData.monthlyCostTenant)} €
            </p>
          </>
        )}
      </div>

      {activeTab === "wealth" && (
        <div className="border-t border-white/20 pt-4 mt-auto">
          <WealthBreakEvenInfo
            isWinner={isWinnerWealth}
            breakEven={breakEvenWealth}
          />
        </div>
      )}
    </div>
  );
};

interface BreakEvenInfoProps {
  isWinner: boolean;
  breakEven: SimulationDataPoint | undefined;
}

/**
 * Information sur le point de rentabilité patrimoine
 */
const WealthBreakEvenInfo: React.FC<BreakEvenInfoProps> = ({
  isWinner,
  breakEven,
}) => {
  if (!isWinner && breakEven) {
    return (
      <p className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Rentable à partir de l'année {breakEven.year} (Mois {breakEven.month})
      </p>
    );
  }

  if (!isWinner) {
    return (
      <p className="text-sm font-semibold flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Jamais rentable sur 25 ans
      </p>
    );
  }

  return (
    <p className="text-sm font-semibold flex items-center gap-2">
      <TrendingUp className="w-4 h-4" />
      Rentabilité atteinte
    </p>
  );
};

/**
 * Information sur le point de rentabilité coût mensuel
 */
const MonthlyBreakEvenInfo: React.FC<BreakEvenInfoProps> = ({
  isWinner,
  breakEven,
}) => {
  if (!isWinner && breakEven) {
    return (
      <p className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Moins cher que le loyer dès l'année {breakEven.year} (Mois{" "}
        {breakEven.month})
      </p>
    );
  }

  if (!isWinner) {
    return (
      <p className="text-sm font-semibold flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Toujours plus cher que le loyer
      </p>
    );
  }

  return (
    <p className="text-sm font-semibold flex items-center gap-2">
      <TrendingUp className="w-4 h-4" />
      Plus économique que la location
    </p>
  );
};
