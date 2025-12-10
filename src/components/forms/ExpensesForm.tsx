/**
 * Formulaire des dépenses et charges
 * Gère les charges de base et les dépenses personnalisées
 */

import React, { useState, useMemo } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import type { SimulationParams, CustomExpense, ExpenseType } from "../../types";
import { Card, CardContent, CardTitle } from "../ui/Card";
import { Collapsible } from "../ui/Collapsible";
import { formatCurrency } from "../../utils/formatters";

interface ExpensesFormProps {
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Dépenses personnalisées */
  customExpenses: CustomExpense[];
  /** Total des dépenses initiales */
  totalInitialExpenses: number;
  /** Total des charges annualisées */
  totalAnnualizedCharges: number;
  /** Callback pour la mise à jour des paramètres */
  onParamsChange: (params: SimulationParams) => void;
  /** Callback pour ajouter une dépense */
  onAddExpense: (name: string, amount: number, type: ExpenseType) => void;
  /** Callback pour supprimer une dépense */
  onRemoveExpense: (id: string) => void;
  /** Active le mode collapsible */
  collapsible?: boolean;
  /** État initial du collapse */
  defaultOpen?: boolean;
}

/**
 * Formulaire de gestion des dépenses et charges
 */
export const ExpensesForm: React.FC<ExpensesFormProps> = ({
  params,
  customExpenses,
  // Props gardés pour compatibilité API mais non utilisés dans l'affichage
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalInitialExpenses: _totalInitialExpenses,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalAnnualizedCharges: _totalAnnualizedCharges,
  onParamsChange,
  onAddExpense,
  onRemoveExpense,
  collapsible = false,
  defaultOpen = true,
}) => {
  /** Calcul des totaux pour les charges de base */
  const baseChargesSummary = useMemo(() => {
    const initial = params.renovationCost;
    const annual = params.propertyTax + params.condoFees * 12;
    return { initial, annual };
  }, [params.renovationCost, params.propertyTax, params.condoFees]);

  /** Calcul des totaux pour les dépenses personnalisées */
  const customExpensesSummary = useMemo(() => {
    const initial = customExpenses
      .filter((e) => e.type === "initial")
      .reduce((sum, e) => sum + e.amount, 0);
    const monthly = customExpenses
      .filter((e) => e.type === "monthly")
      .reduce((sum, e) => sum + e.amount, 0);
    const yearly = customExpenses
      .filter((e) => e.type === "yearly")
      .reduce((sum, e) => sum + e.amount, 0);
    const annual = monthly * 12 + yearly;
    return { initial, annual };
  }, [customExpenses]);

  // Récap global pour le Card (total base + custom)
  const totalInitial =
    baseChargesSummary.initial + customExpensesSummary.initial;
  const totalAnnual = baseChargesSummary.annual + customExpensesSummary.annual;
  const cardSummary = (
    <span className="flex gap-2 text-[10px]">
      <span className="text-emerald-600">
        {formatCurrency(totalInitial)} € init.
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-blue-600">{formatCurrency(totalAnnual)} €/an</span>
    </span>
  );

  return (
    <Card
      data-testid="expenses-form"
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      title="Dépenses & Charges"
      icon={<Tag className="w-5 h-5" />}
      summary={cardSummary}
    >
      <CardContent>
        {/* Titre affiché uniquement en mode non-collapsible */}
        {!collapsible && (
          <div className="pb-2 border-b border-slate-100">
            <CardTitle icon={<Tag className="w-5 h-5" />}>
              Dépenses & Charges
            </CardTitle>
          </div>
        )}

        {/* Charges de base */}
        <BaseExpensesSection
          params={params}
          onParamsChange={onParamsChange}
          summary={baseChargesSummary}
        />

        {/* Dépenses personnalisées */}
        <CustomExpensesSection
          customExpenses={customExpenses}
          onAddExpense={onAddExpense}
          onRemoveExpense={onRemoveExpense}
          summary={customExpensesSummary}
        />
      </CardContent>
    </Card>
  );
};

interface BaseExpensesSectionProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  summary: { initial: number; annual: number };
}

/**
 * Section des charges de base (rénovation, copropriété, taxe foncière)
 */
const BaseExpensesSection: React.FC<BaseExpensesSectionProps> = ({
  params,
  onParamsChange,
  summary,
}) => {
  /** Récapitulatif pour affichage fermé */
  const summaryElement = (
    <span className="flex gap-2">
      <span className="text-emerald-600">
        {formatCurrency(summary.initial)} € init.
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-blue-600">
        {formatCurrency(summary.annual)} €/an
      </span>
    </span>
  );

  return (
    <Collapsible
      title="Charges de Base"
      className="space-y-3 pt-4"
      summary={summaryElement}
    >
      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* Coût initial */}
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
                onParamsChange({
                  ...params,
                  renovationCost: Number(e.target.value),
                })
              }
              className="flex-1 p-1.5 border rounded text-sm text-right"
            />
            <span className="text-xs text-slate-500">€</span>
          </div>
        </div>

        {/* Charges mensuelles */}
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
                onParamsChange({ ...params, condoFees: Number(e.target.value) })
              }
              className="flex-1 p-1.5 border rounded text-sm text-right"
            />
            <span className="text-xs text-slate-500">€</span>
          </div>
        </div>

        {/* Charges annuelles - Taxe foncière uniquement */}
        <div className="col-span-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Charges Annuelles
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-24">Taxe Foncière</span>
            <input
              type="number"
              step="10"
              value={params.propertyTax}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  propertyTax: Number(e.target.value),
                })
              }
              className="flex-1 p-1.5 border rounded text-sm text-right"
            />
            <span className="text-xs text-slate-500">€</span>
          </div>
        </div>
      </div>
    </Collapsible>
  );
};

interface CustomExpensesSectionProps {
  customExpenses: CustomExpense[];
  onAddExpense: (name: string, amount: number, type: ExpenseType) => void;
  onRemoveExpense: (id: string) => void;
  summary: { initial: number; annual: number };
}

/**
 * Section des dépenses personnalisées avec formulaire d'ajout
 */
const CustomExpensesSection: React.FC<CustomExpensesSectionProps> = ({
  customExpenses,
  onAddExpense,
  onRemoveExpense,
  summary,
}) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ExpenseType>("initial");

  const handleAdd = (): void => {
    if (!name || !amount) return;
    onAddExpense(name, parseFloat(amount), type);
    setName("");
    setAmount("");
  };

  /** Récapitulatif toujours visible à droite du titre */
  const summaryElement = (
    <span className="flex gap-2">
      <span className="text-emerald-600">
        {formatCurrency(summary.initial)} € init.
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-blue-600">
        {formatCurrency(summary.annual)} €/an
      </span>
    </span>
  );

  return (
    <Collapsible
      title="Autres Dépenses"
      className="pt-4 border-t border-slate-200"
      summary={summaryElement}
    >
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
              <span className="font-medium text-slate-700">{item.name}</span>
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
                {formatCurrency(item.amount)} €
              </span>
              <button
                onClick={() => onRemoveExpense(item.id)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      <div className="grid grid-cols-12 gap-2">
        <input
          type="text"
          placeholder="Ex: Ravalement"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-5 p-2 text-xs border rounded"
        />
        <input
          type="number"
          step="10"
          placeholder="Montant"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="col-span-3 p-2 text-xs border rounded"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ExpenseType)}
          className="col-span-3 p-2 text-xs border rounded bg-white"
        >
          <option value="initial">Initial</option>
          <option value="yearly">/ An</option>
          <option value="monthly">/ Mois</option>
        </select>
        <button
          onClick={handleAdd}
          className="col-span-1 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </Collapsible>
  );
};
