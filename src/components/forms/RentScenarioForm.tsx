/**
 * Formulaire du scénario location
 * Gère le loyer, le taux d'épargne et l'inflation
 * Design compact et ergonomique
 */

import React from "react";
import { Building, PiggyBank, TrendingUp, Home } from "lucide-react";
import type { SimulationParams } from "../../types";
import { Card, CardContent, CardTitle } from "../ui/Card";

interface RentScenarioFormProps {
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Callback pour la mise à jour des paramètres */
  onParamsChange: (params: SimulationParams) => void;
  /** Active le mode collapsible */
  collapsible?: boolean;
  /** État initial du collapse */
  defaultOpen?: boolean;
}

/**
 * Input compact avec icône et unité intégrés
 */
interface CompactInputProps {
  /** Icône à afficher */
  icon: React.ReactNode;
  /** Label du champ */
  label: string;
  /** Valeur actuelle */
  value: number;
  /** Unité (€ ou %) */
  unit: string;
  /** Step pour l'input number */
  step?: string;
  /** Largeur de l'input */
  inputWidth?: string;
  /** Callback de changement */
  onChange: (value: number) => void;
  /** Couleur de l'icône */
  iconColor?: string;
}

const CompactInput: React.FC<CompactInputProps> = ({
  icon,
  label,
  value,
  unit,
  step = "1",
  inputWidth = "w-20",
  onChange,
  iconColor = "text-slate-400",
}) => (
  <div className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-lg hover:bg-slate-100/80 transition-colors">
    <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
    </div>
    <div className="flex items-center gap-1">
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`${inputWidth} px-2 py-1.5 text-right font-mono text-sm border border-slate-200 rounded-md 
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white`}
      />
      <span className="text-xs font-medium text-slate-500 w-4">{unit}</span>
    </div>
  </div>
);

/**
 * Formulaire du scénario alternatif (location)
 * Design amélioré avec icônes, meilleur espacement et feedback visuel
 */
export const RentScenarioForm: React.FC<RentScenarioFormProps> = ({
  params,
  onParamsChange,
  collapsible = false,
  defaultOpen = true,
}) => {
  // Récap court: loyer + taux épargne
  const summary = (
    <span className="flex gap-2 text-[10px]">
      <span className="text-amber-600 font-medium">
        {params.monthlyRent} €/mois
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-blue-600">{params.savingsRate}%</span>
    </span>
  );

  return (
    <Card
      className="overflow-hidden"
      data-testid="rent-scenario-form"
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      title="Scénario Location"
      icon={<Building className="w-4 h-4 text-amber-600" />}
      summary={summary}
    >
      <CardContent className="p-0">
        {/* Header coloré - affiché uniquement en mode non-collapsible */}
        {!collapsible && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-100/50">
            <CardTitle
              icon={<Building className="w-4 h-4 text-amber-600" />}
              className="text-amber-800 text-sm"
            >
              Scénario Location
            </CardTitle>
            <p className="text-xs text-amber-600/70 mt-0.5">
              Alternative à l'achat immobilier
            </p>
          </div>
        )}

        {/* Contenu avec inputs compacts */}
        <div className="p-3 space-y-2">
          <CompactInput
            icon={<Home className="w-4 h-4" />}
            label="Loyer mensuel évité"
            value={params.monthlyRent}
            unit="€"
            step="50"
            inputWidth="w-24"
            onChange={(value) =>
              onParamsChange({ ...params, monthlyRent: value })
            }
            iconColor="text-amber-500"
          />

          <CompactInput
            icon={<PiggyBank className="w-4 h-4" />}
            label="Rendement épargne"
            value={params.savingsRate}
            unit="%"
            step="0.1"
            inputWidth="w-16"
            onChange={(value) =>
              onParamsChange({ ...params, savingsRate: value })
            }
            iconColor="text-emerald-500"
          />

          <CompactInput
            icon={<TrendingUp className="w-4 h-4" />}
            label="Inflation loyer"
            value={params.rentInflation}
            unit="%"
            step="0.1"
            inputWidth="w-16"
            onChange={(value) =>
              onParamsChange({ ...params, rentInflation: value })
            }
            iconColor="text-blue-500"
          />
        </div>

        {/* Footer informatif */}
        <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            Différence investie mensuellement • Capitalisation composée
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
