/**
 * Tableau de détails à l'année cible
 * Compare les situations propriétaire vs locataire
 * Design compact et ergonomique
 */

import React, { useState } from "react";
import {
  Home,
  Building,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  ActiveTab,
  SimulationDataPoint,
  SimulationParams,
} from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { Card } from "../ui/Card";

interface DetailTableProps {
  /** Onglet actif */
  activeTab: ActiveTab;
  /** Année cible */
  targetYear: number;
  /** Données à l'année cible */
  targetData: SimulationDataPoint;
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Total des dépenses initiales */
  totalInitialExpenses: number;
}

/**
 * Tableau comparatif des détails propriétaire/locataire
 */
export const DetailTable: React.FC<DetailTableProps> = ({
  activeTab,
  targetYear,
  targetData,
  params,
  totalInitialExpenses,
}) => {
  const initialCapital =
    params.apportPersonnel + params.notaryFees + totalInitialExpenses;

  return (
    <Card className="overflow-hidden" data-testid="detail-table">
      {/* Header compact avec année et prix de vente */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">
              Année {targetYear}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Vente à {formatCurrency(targetData.propertyValue)} €
            </span>
          </div>
        </div>
      </div>

      {/* Contenu: 2 colonnes côte à côte */}
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        {/* Colonne Propriétaire */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-bold text-emerald-700 text-sm">
              Propriétaire
            </span>
          </div>

          {activeTab === "wealth" ? (
            <div className="space-y-2">
              <CompactRow
                label="Vente brute"
                value={targetData.propertyValue}
                positive
              />
              <CompactRow
                label="Frais agence"
                value={
                  -Math.round(
                    (targetData.propertyValue * params.agencyFeesPercent) / 100
                  )
                }
              />
              <CompactRow label="Diagnostics" value={-params.saleDiagnostics} />
              <CompactRow
                label="Remb. banque"
                value={-targetData.debtRemaining}
              />
              <ResultRow
                label="Net en poche"
                value={targetData.ownerWealth}
                colorClass="text-emerald-600 bg-emerald-50"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Total dépensé avec détail dépliable */}
              {(() => {
                // Calcul du détail des coûts récurrents
                const agencyFees = Math.round(
                  (targetData.propertyValue * params.agencyFeesPercent) / 100
                );
                const cumulatedPropertyTax = Math.round(
                  params.propertyTax * targetYear
                );
                const cumulatedCondoFees = Math.round(
                  params.condoFees * 12 * targetYear
                );
                const interestsAndInsurance = Math.round(
                  targetData.sunkCosts -
                    cumulatedPropertyTax -
                    cumulatedCondoFees
                );
                const totalSpent =
                  targetData.sunkCosts +
                  params.propertyPrice +
                  params.notaryFees +
                  agencyFees;

                return (
                  <CollapsibleRow
                    label="Total dépensé"
                    value={-totalSpent}
                    details={[
                      { label: "Prix du bien", value: -params.propertyPrice },
                      { label: "Frais notaire", value: -params.notaryFees },
                      { label: "Frais agence vente", value: -agencyFees },
                      {
                        label: "Intérêts + assurance",
                        value: -interestsAndInsurance,
                      },
                      { label: "Taxe foncière", value: -cumulatedPropertyTax },
                      { label: "Charges copro", value: -cumulatedCondoFees },
                    ]}
                  />
                );
              })()}
              <CompactRow
                label="Récupéré vente"
                value={targetData.propertyValue}
                positive
              />
            </div>
          )}
        </div>

        {/* Colonne Locataire */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
              <Building className="w-4 h-4 text-amber-600" />
            </div>
            <span className="font-bold text-amber-700 text-sm">Locataire</span>
          </div>

          {activeTab === "wealth" ? (
            <div className="space-y-2">
              <CompactRow label="Capital placé" value={initialCapital} />
              <CompactRow
                label="Intérêts gagnés"
                value={targetData.tenantWealth - initialCapital}
                positive
              />
              <ResultRow
                label="Capital total"
                value={targetData.tenantWealth}
                colorClass="text-amber-600 bg-amber-50"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Total dépensé locataire avec détail dépliable */}
              {(() => {
                // Calcul du total des loyers cumulés (moyenne * nb mois)
                const totalMonths = targetYear * 12;
                const totalRentPaid = Math.round(
                  targetData.monthlyCostTenant * totalMonths
                );
                const firstYearRent = Math.round(params.monthlyRent * 12);
                const rentIncreaseDueToInflation =
                  totalRentPaid - firstYearRent * targetYear;

                return (
                  <CollapsibleRow
                    label="Total dépensé"
                    value={-totalRentPaid}
                    details={[
                      {
                        label: `Loyer initial (${params.monthlyRent} €/mois)`,
                        value: -firstYearRent * targetYear,
                      },
                      {
                        label: `Inflation cumulée (+${params.rentInflation}%/an)`,
                        value: -rentIncreaseDueToInflation,
                      },
                    ]}
                  />
                );
              })()}
              {/* Gain placements avec icône info */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  Gain placements
                  <span className="group relative">
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-1 rounded max-w-[200px] text-center z-10 whitespace-nowrap">
                      Intérêts générés par l'apport placé + épargne du surcoût propriétaire
                    </span>
                  </span>
                </span>
                <span className="font-medium text-emerald-600">
                  +{formatCurrency(targetData.monthlyInterestsEarned)} €/mois
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résultats comparatifs côte à côte (mode coût mensuel uniquement) */}
      {activeTab === "monthly" && (
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-amber-50">
          <div className="p-3 text-center">
            <div className="text-xs text-emerald-600 font-medium mb-1 flex items-center justify-center gap-1">
              Coût / mois
              <span className="group relative">
                <Info className="w-3 h-3 text-emerald-500/60 cursor-help" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                  Ce que vous coûte votre logement "à fonds perdus" chaque mois
                </span>
              </span>
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {formatCurrency(targetData.monthlyCostOwner)} €
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-xs text-amber-600 font-medium mb-1 flex items-center justify-center gap-1">
              Loyer moyen
              <span className="group relative">
                <Info className="w-3 h-3 text-amber-500/60 cursor-help" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                  Moyenne des loyers versés sur {targetYear} ans
                </span>
              </span>
            </div>
            <div className="text-xl font-bold text-amber-700">
              {formatCurrency(targetData.monthlyCostTenant)} €
            </div>
          </div>
        </div>
      )}

    </Card>
  );
};

interface CompactRowProps {
  label: string;
  value: number;
  positive?: boolean;
  suffix?: string;
}

/**
 * Ligne compacte avec formatage automatique
 */
const CompactRow: React.FC<CompactRowProps> = ({
  label,
  value,
  positive,
  suffix = "",
}) => {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const colorClass = isNegative
    ? "text-rose-600"
    : positive
    ? "text-emerald-600"
    : "text-slate-700";
  const prefix = isNegative ? "-" : positive && value > 0 ? "+" : "";

  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${colorClass}`}>
        {prefix}
        {formatCurrency(absValue)} €{suffix}
      </span>
    </div>
  );
};

interface CollapsibleRowProps {
  /** Label principal */
  label: string;
  /** Valeur totale */
  value: number;
  /** Détails à afficher quand déplié */
  details: Array<{ label: string; value: number }>;
  /** État initial (plié par défaut) */
  defaultOpen?: boolean;
}

/**
 * Ligne collapsible avec détail du calcul
 */
const CollapsibleRow: React.FC<CollapsibleRowProps> = ({
  label,
  value,
  details,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const colorClass = isNegative ? "text-rose-600" : "text-slate-700";
  const prefix = isNegative ? "-" : "";

  return (
    <div>
      {/* Ligne principale cliquable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-xs hover:bg-slate-50 rounded -mx-1 px-1 py-0.5 transition-colors"
      >
        <span className="text-slate-500 flex items-center gap-1">
          {label}
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          )}
        </span>
        <span className={`font-medium ${colorClass}`}>
          {prefix}
          {formatCurrency(absValue)} €
        </span>
      </button>

      {/* Détails quand déplié */}
      {isOpen && (
        <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-2">
          {details.map((detail, index) => (
            <div
              key={index}
              className="flex justify-between items-center text-[10px]"
            >
              <span className="text-slate-400">{detail.label}</span>
              <span
                className={`font-medium ${
                  detail.value < 0 ? "text-rose-500" : "text-slate-500"
                }`}
              >
                {detail.value < 0 ? "-" : ""}
                {formatCurrency(Math.abs(detail.value))} €
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ResultRowProps {
  label: string;
  value: number;
  colorClass: string;
  suffix?: string;
}

/**
 * Ligne de résultat mise en évidence
 */
const ResultRow: React.FC<ResultRowProps> = ({
  label,
  value,
  colorClass,
  suffix = "",
}) => {
  return (
    <div
      className={`flex justify-between items-center text-sm font-bold mt-2 pt-2 border-t border-dashed border-slate-200 rounded px-2 py-1 ${colorClass}`}
    >
      <span>{label}</span>
      <span className="text-base">
        {formatCurrency(value)} €{suffix}
      </span>
    </div>
  );
};
