/**
 * Formulaire des paramètres de vente
 * Gère la durée de détention, le prix de vente cible et les frais de vente
 */

import React from "react";
import { Settings, Percent, Banknote, TrendingUp } from "lucide-react";
import type { SimulationParams } from "../../types";
import {
  MIN_HOLDING_YEARS,
  MAX_HOLDING_YEARS,
  SALE_PRICE_MIN_COEFFICIENT,
  SALE_PRICE_MAX_COEFFICIENT,
} from "../../constants";
import { Card, CardContent, CardTitle } from "../ui/Card";
import { formatPercentWithSign, formatCurrency } from "../../utils/formatters";

interface SaleParamsFormProps {
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Année cible */
  targetYear: number;
  /** Prix de vente manuel */
  manualTargetPrice: number;
  /** Callback pour le changement d'année */
  onYearChange: (year: number) => void;
  /** Callback pour le changement de prix cible */
  onPriceChange: (price: number) => void;
  /** Callback pour le changement des frais d'agence */
  onAgencyFeesChange: (percent: number) => void;
  /** Callback pour le changement des frais de diagnostics */
  onDiagnosticsChange: (amount: number) => void;
  /** Active le mode collapsible */
  collapsible?: boolean;
  /** État initial du collapse */
  defaultOpen?: boolean;
}

/**
 * Formulaire des paramètres de vente
 */
export const SaleParamsForm: React.FC<SaleParamsFormProps> = ({
  params,
  targetYear,
  manualTargetPrice,
  onYearChange,
  onPriceChange,
  onAgencyFeesChange,
  onDiagnosticsChange,
  collapsible = false,
  defaultOpen = true,
}) => {
  const minSalePrice = Math.round(
    params.propertyPrice * SALE_PRICE_MIN_COEFFICIENT
  );
  const maxSalePrice = Math.round(
    params.propertyPrice * SALE_PRICE_MAX_COEFFICIENT
  );

  // Calcul des frais d'agence en euros
  const agencyFeesAmount = Math.round(
    (manualTargetPrice * params.agencyFeesPercent) / 100
  );
  const totalSellingCosts = agencyFeesAmount + params.saleDiagnostics;

  // Récap court: durée + prix de vente + frais
  const summary = (
    <span className="flex gap-2 text-[10px]">
      <span className="text-blue-600 font-medium">{targetYear} ans</span>
      <span className="text-slate-300">|</span>
      <span className="text-emerald-600">
        {formatCurrency(manualTargetPrice)} €
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-rose-500">
        -{formatCurrency(totalSellingCosts)} €
      </span>
    </span>
  );

  return (
    <Card
      data-testid="sale-params-form"
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      title="Vente"
      icon={<TrendingUp className="w-5 h-5" />}
      summary={summary}
    >
      <CardContent>
        {/* Titre affiché uniquement en mode non-collapsible */}
        {!collapsible && (
          <CardTitle
            icon={<TrendingUp className="w-5 h-5" />}
            className="pb-2 border-b border-slate-100"
          >
            Paramètres Vente
          </CardTitle>
        )}

        <div className="space-y-4 pt-4">
          {/* Durée de détention */}
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 space-y-2">
            <label className="text-xs font-semibold text-indigo-700 mb-2 flex justify-between">
              <span>Durée détention</span>
              <span className="font-bold text-indigo-600">
                {targetYear} ans
              </span>
            </label>
            <input
              type="range"
              min={MIN_HOLDING_YEARS}
              max={MAX_HOLDING_YEARS}
              value={targetYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Prix de vente */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-blue-700 uppercase">
                Prix de Vente
              </label>
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-blue-200 shadow-sm">
                <input
                  type="number"
                  value={manualTargetPrice}
                  onChange={(e) => onPriceChange(Number(e.target.value))}
                  className="w-20 text-right font-bold text-sm text-blue-800 outline-none"
                />
                <span className="text-sm font-bold text-blue-700">€</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={minSalePrice}
                max={maxSalePrice}
                step={1000}
                value={manualTargetPrice}
                onChange={(e) => onPriceChange(Number(e.target.value))}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded text-blue-600 border border-blue-100 whitespace-nowrap">
                {formatPercentWithSign(params.propertyAppreciation)}/an
              </span>
            </div>
          </div>

          {/* Frais de vente */}
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
            <label className="text-xs font-bold text-rose-700 uppercase mb-2 block">
              Frais de Vente
            </label>

            <div className="space-y-2">
              {/* Frais d'agence */}
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-rose-600 flex-1">Agence</span>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-rose-200">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={params.agencyFeesPercent}
                    onChange={(e) => onAgencyFeesChange(Number(e.target.value))}
                    className="w-12 text-right font-mono text-xs text-rose-700 outline-none"
                  />
                  <span className="text-xs text-rose-500">%</span>
                </div>
                <span className="text-xs text-rose-400 font-mono min-w-[70px] text-right">
                  = {formatCurrency(agencyFeesAmount)} €
                </span>
              </div>

              {/* Diagnostics */}
              <div className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-rose-600 flex-1">
                  Diagnostics
                </span>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-rose-200">
                  <input
                    type="number"
                    step={50}
                    min={0}
                    value={params.saleDiagnostics}
                    onChange={(e) =>
                      onDiagnosticsChange(Number(e.target.value))
                    }
                    className="w-16 text-right font-mono text-xs text-rose-700 outline-none"
                  />
                  <span className="text-xs text-rose-500">€</span>
                </div>
              </div>

              {/* Total frais */}
              <div className="flex items-center justify-between pt-2 border-t border-rose-200 mt-2">
                <span className="text-xs font-bold text-rose-700">
                  Total frais
                </span>
                <span className="text-sm font-bold text-rose-700">
                  {formatCurrency(totalSellingCosts)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
