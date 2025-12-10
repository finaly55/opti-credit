/**
 * Formulaire d'acquisition et de financement
 * Gère le prix, les frais de notaire, l'apport, le taux et la date d'achat
 */

import React from "react";
import { ShoppingCart, FileText, Calendar } from "lucide-react";
import type { SimulationParams, PropertyType } from "../../types";
import { PRICE_RANGE_MIN, PRICE_RANGE_MAX, RATE_MAX } from "../../constants";
import { Card, CardContent, CardTitle } from "../ui/Card";
import { formatCurrency } from "../../utils/formatters";

interface AcquisitionFormProps {
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Callback pour le changement de prix */
  onPriceChange: (price: number) => void;
  /** Callback pour le changement d'apport */
  onApportChange: (apport: number) => void;
  /** Callback pour le changement de type de bien */
  onPropertyTypeChange: (type: PropertyType) => void;
  /** Callback pour le changement du montant des frais de notaire */
  onNotaryAmountChange: (amount: number) => void;
  /** Callback pour le changement du pourcentage des frais de notaire */
  onNotaryPercentChange: (percent: number) => void;
  /** Callback pour le changement du taux */
  onRateChange: (rate: number) => void;
  /** Callback pour le changement de la date d'achat */
  onPurchaseDateChange: (date: string) => void;
  /** Active le mode collapsible */
  collapsible?: boolean;
  /** État initial du collapse */
  defaultOpen?: boolean;
}

/**
 * Formulaire d'acquisition et financement
 */
export const AcquisitionForm: React.FC<AcquisitionFormProps> = ({
  params,
  onPriceChange,
  onApportChange,
  onPropertyTypeChange,
  onNotaryAmountChange,
  onNotaryPercentChange,
  onRateChange,
  onPurchaseDateChange,
  collapsible = false,
  defaultOpen = true,
}) => {
  const standardLoan = params.loans.find((l) => l.id === "standard");
  const ptzAmount = params.loans.find((l) => l.id === "ptz")?.amount ?? 0;
  const boostAmount = params.loans.find((l) => l.id === "boost")?.amount ?? 0;
  const maxApport = params.propertyPrice - ptzAmount - boostAmount;

  // Récap court: prix + taux
  const summary = (
    <span className="flex gap-2 text-[10px]">
      <span className="text-blue-600 font-medium">
        {formatCurrency(params.propertyPrice)} €
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-emerald-600">{standardLoan?.rate ?? 0}%</span>
    </span>
  );

  return (
    <Card
      data-testid="acquisition-form"
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      title="Achat"
      icon={<ShoppingCart className="w-5 h-5" />}
      summary={summary}
    >
      <CardContent>
        {/* Titre affiché uniquement en mode non-collapsible */}
        {!collapsible && (
          <CardTitle
            icon={<ShoppingCart className="w-5 h-5" />}
            className="pb-2 border-b border-slate-100"
          >
            Paramètres Achat
          </CardTitle>
        )}

        <div className={`grid grid-cols-1 gap-4 ${!collapsible ? "pt-4" : ""}`}>
          {/* Section 1: Prix d'Achat avec slider */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-blue-700">
                Prix d'Achat
              </label>
              <div className="flex items-center gap-2">
                <div className="bg-white px-2 py-1 rounded border border-blue-200">
                  <input
                    type="number"
                    min={PRICE_RANGE_MIN}
                    max={PRICE_RANGE_MAX}
                    step={500}
                    value={params.propertyPrice}
                    onChange={(e) => onPriceChange(Number(e.target.value))}
                    className="w-24 text-right font-mono text-sm outline-none text-slate-800"
                  />
                </div>
                <span className="text-sm font-bold text-blue-600">€</span>
              </div>
            </div>
            <input
              type="range"
              min={PRICE_RANGE_MIN}
              max={PRICE_RANGE_MAX}
              step={500}
              value={params.propertyPrice}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Section 2: Frais de Notaire avec type Ancien/Neuf */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <FileText className="w-3 h-3" aria-hidden="true" />
                Frais de Notaire
              </label>
              <div className="flex bg-white rounded border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => onPropertyTypeChange("ancien")}
                  className={`text-[10px] px-2 py-0.5 rounded ${
                    params.propertyType === "ancien"
                      ? "bg-blue-100 text-blue-700 font-bold"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Ancien
                </button>
                <button
                  type="button"
                  onClick={() => onPropertyTypeChange("neuf")}
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
                  onChange={(e) => onNotaryAmountChange(Number(e.target.value))}
                  className="w-full text-sm font-mono text-right outline-none text-slate-700"
                />
                <span className="text-xs text-slate-400">€</span>
              </div>
              <span className="text-slate-300 text-sm">=</span>
              <div className="w-20 flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                <input
                  type="number"
                  step={0.1}
                  value={params.notaryFeesPercent}
                  onChange={(e) =>
                    onNotaryPercentChange(Number(e.target.value))
                  }
                  className="w-full text-sm font-mono text-right outline-none text-slate-700"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.round(params.propertyPrice * 0.15)}
              step={100}
              value={params.notaryFees}
              onChange={(e) => onNotaryAmountChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
            />
          </div>

          {/* Section 3: Financement - ligne compacte */}
          <div className="grid grid-cols-2 gap-3">
            {/* Apport personnel */}
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-2">
              <label className="text-xs font-semibold text-emerald-700 mb-1 block">
                Apport
              </label>
              <div className="flex items-center bg-white border border-emerald-200 rounded-md">
                <input
                  type="number"
                  step={500}
                  min={0}
                  max={maxApport}
                  value={params.apportPersonnel}
                  onChange={(e) => onApportChange(Number(e.target.value))}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-right outline-none rounded-l-md"
                />
                <span className="px-2 text-sm text-emerald-600 bg-emerald-50 border-l border-emerald-200 py-1.5">
                  €
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxApport}
                step={500}
                value={params.apportPersonnel}
                onChange={(e) => onApportChange(Number(e.target.value))}
                className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
            {/* Taux global */}
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 space-y-2">
              <label className="text-xs font-semibold text-amber-700 mb-1 block">
                Taux Global
              </label>
              <div className="flex items-center bg-white border border-amber-200 rounded-md">
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  max={RATE_MAX}
                  value={standardLoan?.rate ?? 0}
                  onChange={(e) => onRateChange(Number(e.target.value))}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-right outline-none rounded-l-md"
                />
                <span className="px-2 text-sm text-amber-600 bg-amber-50 border-l border-amber-200 py-1.5">
                  %
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={RATE_MAX}
                step={0.01}
                value={standardLoan?.rate ?? 0}
                onChange={(e) => onRateChange(Number(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>
          </div>

          {/* Section 3: Date d'achat - compacte */}
          <PurchaseDateInput
            value={params.purchaseDate}
            onChange={onPurchaseDateChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface PurchaseDateInputProps {
  value: string;
  onChange: (date: string) => void;
}

/**
 * Champ de saisie de la date d'achat avec calcul de durée
 */
const PurchaseDateInput: React.FC<PurchaseDateInputProps> = ({
  value,
  onChange,
}) => {
  /** Calcul de la durée depuis la date d'achat */
  const getHoldingDuration = (): string => {
    const purchaseDate = new Date(value);
    const today = new Date();
    const diffMs = today.getTime() - purchaseDate.getTime();

    if (diffMs < 0) return "Date future";

    const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const diffMonths = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44)
    );

    if (diffYears === 0 && diffMonths === 0) return "Moins d'un mois";
    if (diffYears === 0) return `${diffMonths} mois`;
    if (diffMonths === 0) return `${diffYears} an${diffYears > 1 ? "s" : ""}`;
    return `${diffYears} an${diffYears > 1 ? "s" : ""} et ${diffMonths} mois`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Date d'Achat
        </label>
        <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
          {getHoldingDuration()}
        </span>
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm font-mono border border-blue-200 rounded-md 
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white"
      />
    </div>
  );
};
