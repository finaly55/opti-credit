/**
 * Composants Accordion compacts pour la barre de paramètres
 * Design minimaliste avec animations fluides
 */

import React, { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

interface AccordionItemProps {
  /** Titre de la section */
  title: string;
  /** État ouvert/fermé */
  isOpen: boolean;
  /** Callback pour toggle */
  toggle: () => void;
  /** Icône de la section */
  icon: LucideIcon;
  /** Contenu de la section */
  children: React.ReactNode;
  /** Résumé affiché quand fermé */
  summary?: string;
}

/**
 * Item d'accordion avec animation de rotation du chevron
 */
export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  isOpen,
  toggle,
  icon: Icon,
  children,
  summary,
}) => {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && summary && (
            <span className="text-xs text-slate-500 font-mono">{summary}</span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-2 animate-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

interface InputGroupProps {
  /** Label du champ */
  label: string;
  /** Valeur actuelle */
  value: number;
  /** Callback de changement */
  onChange: (value: number) => void;
  /** Suffixe (€, %, ans) */
  suffix?: string;
  /** Step pour le slider */
  step?: number | string;
  /** Min pour le slider */
  min?: number;
  /** Max pour le slider */
  max?: number;
  /** Texte d'aide */
  help?: string;
  /** Afficher le slider */
  showSlider?: boolean;
  /** Largeur de l'input */
  inputWidth?: string;
}

/**
 * Composant InputGroup avec slider amélioré
 */
export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  value,
  onChange,
  suffix = "€",
  step = 1,
  min = 0,
  max,
  help,
  showSlider = false,
  inputWidth = "w-20",
}) => {
  // Format numbers with spaces for thousands
  const formatValue = (val: number): string => {
    return val.toLocaleString("fr-FR");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-slate-600 flex-1 min-w-0 truncate">
          {label}
        </label>
        <div className="flex items-center">
          <input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`${inputWidth} px-2 py-1 text-right text-xs font-mono border border-slate-200 rounded-l-md 
              focus:ring-1 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white outline-none`}
          />
          <span className="px-2 py-1 text-xs text-slate-500 bg-slate-50 border border-l-0 border-slate-200 rounded-r-md">
            {suffix}
          </span>
        </div>
      </div>
      {showSlider && max !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 w-12 text-right">{formatValue(min)}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-[10px] text-slate-400 w-12">{formatValue(max)}</span>
        </div>
      )}
      {help && <p className="text-[10px] text-slate-400">{help}</p>}
    </div>
  );
};

interface AccordionContainerProps {
  /** Titre du header */
  title: string;
  /** Icône du header */
  icon: LucideIcon;
  /** Contenu (AccordionItems) */
  children: React.ReactNode;
}

/**
 * Container principal avec header et sections accordion
 */
export const AccordionContainer: React.FC<AccordionContainerProps> = ({
  title,
  icon: Icon,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wider">
          <Icon className="h-4 w-4" /> {title}
        </h2>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
};

/**
 * Hook pour gérer l'état des sections accordion
 * Avec mode "exclusive" : un seul accordéon ouvert à la fois
 */
export const useAccordionState = (
  initialOpen: Record<string, boolean> = {},
  exclusive: boolean = false
) => {
  const [openSections, setOpenSections] =
    useState<Record<string, boolean>>(initialOpen);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      if (exclusive) {
        // Mode exclusif: fermer tous les autres quand on ouvre un nouveau
        const isCurrentlyOpen = prev[key];
        return { [key]: !isCurrentlyOpen };
      }
      // Mode normal: toggle indépendant
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  return { openSections, toggleSection };
};
