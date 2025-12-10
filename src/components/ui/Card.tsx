/**
 * Composant Card générique avec variantes
 * Base pour tous les panneaux de l'application
 * Supporte le mode collapsable avec récapitulatif
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CardProps {
  /** Contenu du composant */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Identifiant pour les tests */
  "data-testid"?: string;
  /** Active le mode collapsable */
  collapsible?: boolean;
  /** État initial (ouvert/fermé) en mode collapsable */
  defaultOpen?: boolean;
  /** Titre affiché en mode collapsable */
  title?: string;
  /** Icône affichée à côté du titre */
  icon?: React.ReactNode;
  /** Récapitulatif affiché à droite du titre (visible quand replié) */
  summary?: React.ReactNode;
}

/**
 * Conteneur Card principal avec support collapse
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  "data-testid": testId,
  collapsible = false,
  defaultOpen = true,
  title,
  icon,
  summary,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Mode simple sans collapse
  if (!collapsible) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}
        data-testid={testId}
      >
        {children}
      </div>
    );
  }

  // Mode collapsable avec récapitulatif optionnel
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}
      data-testid={testId}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left hover:bg-slate-50 transition-colors rounded-t-xl"
      >
        {/* Titre et récapitulatif sur une ligne */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            {icon}
            {title}
          </div>
          <div className="flex items-center gap-3">
            {!isOpen && summary && (
              <div className="text-xs font-normal text-slate-500">
                {summary}
              </div>
            )}
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </button>
      {isOpen && (
        <div className="animate-in slide-in-from-top-2">{children}</div>
      )}
    </div>
  );
};

interface CardHeaderProps {
  /** Contenu du header */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Header de Card avec style par défaut
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`p-6 pb-2 border-b border-slate-100 ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  /** Contenu du titre */
  children: React.ReactNode;
  /** Icône optionnelle */
  icon?: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Titre de Card avec support d'icône
 */
export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  icon,
  className = "",
}) => {
  return (
    <h3
      className={`font-bold flex items-center gap-2 text-slate-700 ${className}`}
    >
      {icon}
      {children}
    </h3>
  );
};

interface CardContentProps {
  /** Contenu */
  children: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Contenu de Card
 */
export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
}) => {
  return <div className={`px-6 pb-6 pt-3 space-y-4 ${className}`}>{children}</div>;
};
