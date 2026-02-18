/**
 * Panneau de paramètres compact avec accordéons
 * Design inspiré MUI - clair et concis
 */

import React from "react";
import {
  Settings,
  Home,
  Wallet,
  FileText,
  Building2,
  TrendingUp,
  Calendar,
  PiggyBank,
} from "lucide-react";
import type {
  SimulationParams,
  PropertyType,
  CustomExpense,
  ExpenseType,
} from "../../types";
import {
  PRICE_RANGE_MIN,
  PRICE_RANGE_MAX,
  RATE_MAX,
  MIN_HOLDING_YEARS,
  MAX_HOLDING_YEARS,
  SALE_PRICE_MIN_COEFFICIENT,
  SALE_PRICE_MAX_COEFFICIENT,
} from "../../constants";
import {
  AccordionItem,
  InputGroup,
  AccordionContainer,
  useAccordionState,
} from "../ui/Accordion";
import { formatCurrency } from "../../utils/formatters";

interface ParametersPanelProps {
  /** Paramètres de simulation */
  params: SimulationParams;
  /** Année cible */
  targetYear: number;
  /** Prix de vente manuel */
  manualTargetPrice: number;
  /** Dépenses personnalisées */
  customExpenses: CustomExpense[];
  /** Total des dépenses initiales */
  totalInitialExpenses: number;
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
  /** Callback pour le changement d'année cible */
  onYearChange: (year: number) => void;
  /** Callback pour le changement du prix de vente */
  onTargetPriceChange: (price: number) => void;
  /** Callback pour le changement des frais d'agence */
  onAgencyFeesChange: (percent: number) => void;
  /** Callback pour le changement des diagnostics */
  onDiagnosticsChange: (amount: number) => void;
  /** Callback pour la mise à jour des paramètres */
  onParamsChange: (params: SimulationParams) => void;
  /** Callback pour ajouter une dépense */
  onAddExpense: (name: string, amount: number, type: ExpenseType) => void;
  /** Callback pour supprimer une dépense */
  onRemoveExpense: (id: string) => void;
}

/**
 * Panneau de paramètres unifié et compact
 */
export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  params,
  targetYear,
  manualTargetPrice,
  customExpenses,
  onPriceChange,
  onApportChange,
  onPropertyTypeChange,
  onNotaryAmountChange,
  // onNotaryPercentChange is available but using amount-based input
  onRateChange,
  onPurchaseDateChange,
  onYearChange,
  onTargetPriceChange,
  onAgencyFeesChange,
  onDiagnosticsChange,
  onParamsChange,
  onAddExpense,
  onRemoveExpense,
}) => {
  const { openSections, toggleSection } = useAccordionState({
    purchase: true,
    loan: false,
    sale: false,
    costs: false,
    rent: false,
    savings: false,
  });

  const standardLoan = params.loans.find((l) => l.id === "standard");
  const ptzAmount = params.loans.find((l) => l.id === "ptz")?.amount ?? 0;
  const boostAmount = params.loans.find((l) => l.id === "boost")?.amount ?? 0;
  const maxApport = params.propertyPrice - ptzAmount - boostAmount;
  const loanAmount = params.propertyPrice + params.notaryFees - params.apportPersonnel;
  const monthlyRate = (standardLoan?.rate ?? 0) / 100 / 12;
  const nbMonths = standardLoan?.durationMonths ?? 300;
  const monthlyLoanPayment = monthlyRate > 0 
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, nbMonths)) / (Math.pow(1 + monthlyRate, nbMonths) - 1)
    : loanAmount / nbMonths;
  const minSalePrice = Math.round(params.propertyPrice * SALE_PRICE_MIN_COEFFICIENT);
  const maxSalePrice = Math.round(params.propertyPrice * SALE_PRICE_MAX_COEFFICIENT);
  const agencyFeesAmount = Math.round((manualTargetPrice * params.agencyFeesPercent) / 100);
  
  // Coût total de l'opération d'achat
  const totalPurchaseCost = params.propertyPrice + params.notaryFees + params.renovationCost;
  
  // Charges annuelles propriétaire
  const yearlyOwnerCosts = params.propertyTax + params.condoFees * 12 + 
    customExpenses.filter(e => e.type === "yearly").reduce((sum, e) => sum + e.amount, 0) +
    customExpenses.filter(e => e.type === "monthly").reduce((sum, e) => sum + e.amount * 12, 0);

  return (
    <AccordionContainer title="Paramètres" icon={Settings}>
      {/* 1. BIEN IMMOBILIER */}
      <AccordionItem
        title="Bien immobilier"
        isOpen={openSections.purchase}
        toggle={() => toggleSection("purchase")}
        icon={Home}
        summary={`${formatCurrency(totalPurchaseCost)} €`}
      >
        {/* Type de bien */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-600">Type</span>
          <div className="flex bg-slate-100 rounded p-0.5">
            {(["ancien", "neuf"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onPropertyTypeChange(type)}
                className={`text-xs px-3 py-1 rounded transition-all capitalize ${
                  params.propertyType === type
                    ? "bg-white text-blue-700 shadow-sm font-medium"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <InputGroup
          label="Prix net vendeur"
          value={params.propertyPrice}
          onChange={onPriceChange}
          suffix="€"
          min={PRICE_RANGE_MIN}
          max={PRICE_RANGE_MAX}
          step={5000}
          showSlider
          inputWidth="w-24"
        />
        
        <InputGroup
          label="Travaux"
          value={params.renovationCost}
          onChange={(v) => onParamsChange({ ...params, renovationCost: v })}
          suffix="€"
          step={1000}
        />
        
        <InputGroup
          label="Frais de notaire"
          value={params.notaryFees}
          onChange={onNotaryAmountChange}
          suffix="€"
          step={100}
          help={`${params.notaryFeesPercent.toFixed(1)}%`}
        />
        
        <PurchaseDateCompact value={params.purchaseDate} onChange={onPurchaseDateChange} />
        
        {/* Récap */}
        <SectionSummary label="Coût total" value={totalPurchaseCost} color="blue" />
      </AccordionItem>

      {/* 2. FINANCEMENT */}
      <AccordionItem
        title="Financement"
        isOpen={openSections.loan}
        toggle={() => toggleSection("loan")}
        icon={Wallet}
        summary={`${formatCurrency(Math.round(monthlyLoanPayment))} €/mois`}
      >
        <InputGroup
          label="Apport"
          value={params.apportPersonnel}
          onChange={onApportChange}
          suffix="€"
          min={0}
          max={Math.min(maxApport, totalPurchaseCost)}
          step={1000}
          showSlider
          inputWidth="w-24"
        />
        
        <InputGroup
          label="Taux annuel"
          value={standardLoan?.rate ?? 0}
          onChange={onRateChange}
          suffix="%"
          step={0.05}
          min={0}
          max={RATE_MAX}
          showSlider
          inputWidth="w-14"
        />
        
        <InputGroup
          label="Durée"
          value={Math.round((standardLoan?.durationMonths ?? 300) / 12)}
          onChange={(v) => {
            const newLoans = params.loans.map((l) =>
              l.id === "standard" ? { ...l, durationMonths: v * 12 } : l
            );
            onParamsChange({ ...params, loans: newLoans });
          }}
          suffix="ans"
          min={5}
          max={30}
          showSlider
          inputWidth="w-14"
        />

        {/* Récap */}
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Emprunt</span>
            <span className="font-medium">{formatCurrency(loanAmount)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mensualité</span>
            <span className="font-bold text-blue-700">{formatCurrency(Math.round(monthlyLoanPayment))} €</span>
          </div>
        </div>
      </AccordionItem>

      {/* 3. COÛTS PROPRIÉTAIRE */}
      <AccordionItem
        title="Coûts propriétaire"
        isOpen={openSections.costs}
        toggle={() => toggleSection("costs")}
        icon={FileText}
        summary={`${formatCurrency(yearlyOwnerCosts)} €/an`}
      >
        <InputGroup
          label="Taxe foncière"
          value={params.propertyTax}
          onChange={(v) => onParamsChange({ ...params, propertyTax: v })}
          suffix="€/an"
          step={50}
        />
        
        <InputGroup
          label="Copropriété"
          value={params.condoFees * 12}
          onChange={(v) => onParamsChange({ ...params, condoFees: Math.round(v / 12) })}
          suffix="€/an"
          step={100}
          help={`${formatCurrency(params.condoFees)} €/mois`}
        />
        
        <InputGroup
          label="Entretien"
          value={params.maintenanceCost * 12}
          onChange={(v) => onParamsChange({ ...params, maintenanceCost: Math.round(v / 12) })}
          suffix="€/an"
          step={100}
        />
        
        <InputGroup
          label="Inflation coûts"
          value={params.ownerCostInflation}
          onChange={(v) => onParamsChange({ ...params, ownerCostInflation: v })}
          suffix="%/an"
          step={0.1}
          inputWidth="w-14"
          help="Taxe foncière, copro, entretien"
        />
        
        {/* Dépenses personnalisées */}
        {customExpenses.length > 0 && (
          <div className="space-y-1">
            {customExpenses.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 px-2 py-1 rounded">
                <span className="text-slate-600 truncate">{item.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-700">{formatCurrency(item.amount)} €</span>
                  <button onClick={() => onRemoveExpense(item.id)} className="text-slate-400 hover:text-red-500 text-sm">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <AddExpenseForm onAdd={onAddExpense} />
        
        <SectionSummary label="Total annuel" value={yearlyOwnerCosts} color="amber" suffix="/an" />
      </AccordionItem>

      {/* 4. COÛTS LOCATION */}
      <AccordionItem
        title="Coûts location"
        isOpen={openSections.rent}
        toggle={() => toggleSection("rent")}
        icon={Building2}
        summary={`${formatCurrency(params.monthlyRent)} €/mois`}
      >
        <InputGroup
          label="Loyer HC"
          value={params.monthlyRent}
          onChange={(v) => onParamsChange({ ...params, monthlyRent: v })}
          suffix="€/mois"
          step={50}
          inputWidth="w-20"
        />
        
        <InputGroup
          label="Charges locataire"
          value={params.tenantMonthlyCharges}
          onChange={(v) => onParamsChange({ ...params, tenantMonthlyCharges: v })}
          suffix="€/mois"
          step={10}
          inputWidth="w-20"
          help="Assurance habitation, charges locatives..."
        />
        
        <InputGroup
          label="Revalorisation"
          value={params.rentInflation}
          onChange={(v) => onParamsChange({ ...params, rentInflation: v })}
          suffix="%/an"
          step={0.1}
          inputWidth="w-14"
        />
      </AccordionItem>

      {/* 5. ÉPARGNE */}
      <AccordionItem
        title="Épargne"
        isOpen={openSections.savings}
        toggle={() => toggleSection("savings")}
        icon={PiggyBank}
        summary={`${params.savingsRate}% (net ${(params.savingsRate * (1 - params.savingsTaxRate / 100)).toFixed(1)}%)`}
      >
        <InputGroup
          label="Rendement brut"
          value={params.savingsRate}
          onChange={(v) => onParamsChange({ ...params, savingsRate: v })}
          suffix="%"
          step={0.1}
          min={0}
          max={15}
          showSlider
          inputWidth="w-14"
          help="Rémunération de l'épargne constituée"
        />
        
        <InputGroup
          label="Flat tax (PFU)"
          value={params.savingsTaxRate}
          onChange={(v) => onParamsChange({ ...params, savingsTaxRate: v })}
          suffix="%"
          step={1}
          min={0}
          max={50}
          inputWidth="w-14"
          help={`Rendement net : ${(params.savingsRate * (1 - params.savingsTaxRate / 100)).toFixed(2)}%`}
        />
      </AccordionItem>

      {/* 6. VENTE */}
      <AccordionItem
        title="Revente"
        isOpen={openSections.sale}
        toggle={() => toggleSection("sale")}
        icon={TrendingUp}
        summary={`${targetYear} ans`}
      >
        <InputGroup
          label="Durée détention"
          value={targetYear}
          onChange={onYearChange}
          suffix="ans"
          min={MIN_HOLDING_YEARS}
          max={MAX_HOLDING_YEARS}
          showSlider
          inputWidth="w-14"
        />
        
        <InputGroup
          label="Prix de vente"
          value={manualTargetPrice}
          onChange={onTargetPriceChange}
          suffix="€"
          min={minSalePrice}
          max={maxSalePrice}
          step={5000}
          showSlider
          inputWidth="w-24"
        />
        
        <InputGroup
          label="Frais agence"
          value={params.agencyFeesPercent}
          onChange={onAgencyFeesChange}
          suffix="%"
          step={0.5}
          min={0}
          max={10}
          showSlider
          inputWidth="w-12"
          help={`${formatCurrency(agencyFeesAmount)} €`}
        />
        
        <InputGroup
          label="Diagnostics"
          value={params.saleDiagnostics}
          onChange={onDiagnosticsChange}
          suffix="€"
          step={50}
          inputWidth="w-16"
        />
        
        <SectionSummary label="Frais de vente" value={agencyFeesAmount + params.saleDiagnostics} color="rose" />
      </AccordionItem>
    </AccordionContainer>
  );
};

/**
 * Résumé de section avec couleur personnalisée
 */
const SectionSummary: React.FC<{
  label: string;
  value: number;
  color: "blue" | "amber" | "rose" | "green";
  suffix?: string;
}> = ({ label, value, color, suffix = "" }) => {
  const colorClasses = {
    blue: "text-blue-700",
    amber: "text-amber-600",
    rose: "text-rose-600",
    green: "text-emerald-600",
  };
  
  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={`text-sm font-bold ${colorClasses[color]}`}>
          {formatCurrency(value)} €{suffix}
        </span>
      </div>
    </div>
  );
};

/**
 * Champ date d'achat compact
 */
const PurchaseDateCompact: React.FC<{
  value: string;
  onChange: (date: string) => void;
}> = ({ value, onChange }) => {
  const getHoldingDuration = (): string => {
    const purchaseDate = new Date(value);
    const today = new Date();
    const diffMs = today.getTime() - purchaseDate.getTime();
    if (diffMs < 0) return "Future";
    const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const diffMonths = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44)
    );
    if (diffYears === 0 && diffMonths === 0) return "< 1 mois";
    if (diffYears === 0) return `${diffMonths} mois`;
    if (diffMonths === 0) return `${diffYears} an${diffYears > 1 ? "s" : ""}`;
    return `${diffYears}a ${diffMonths}m`;
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-600">Date d'achat</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
          {getHoldingDuration()}
        </span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1 text-xs font-mono border border-slate-200 rounded-md 
            focus:ring-1 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white outline-none"
        />
      </div>
    </div>
  );
};

/**
 * Formulaire d'ajout de dépense compact
 */
const AddExpenseForm: React.FC<{
  onAdd: (name: string, amount: number, type: ExpenseType) => void;
}> = ({ onAdd }) => {
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [type, setType] = React.useState<ExpenseType>("initial");

  const handleAdd = () => {
    if (!name || !amount) return;
    onAdd(name, parseFloat(amount), type);
    setName("");
    setAmount("");
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 text-xs border border-slate-200 rounded"
        />
        <input
          type="number"
          placeholder="€"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ExpenseType)}
          className="w-14 px-1 py-1 text-[10px] border border-slate-200 rounded bg-white"
        >
          <option value="initial">Init</option>
          <option value="yearly">/An</option>
          <option value="monthly">/Mo</option>
        </select>
        <button
          onClick={handleAdd}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          +
        </button>
      </div>
    </div>
  );
};
