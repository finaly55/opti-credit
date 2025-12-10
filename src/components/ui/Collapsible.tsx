/**
 * Composant Collapsible pour sections repliables
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleProps {
  /** Titre de la section */
  title: string;
  /** Contenu à afficher/masquer */
  children: React.ReactNode;
  /** État initial (ouvert/fermé) */
  defaultOpen?: boolean;
  /** Badge optionnel (compteur, etc.) */
  badge?: React.ReactNode;
  /** Récapitulatif à afficher à droite du titre (toujours visible) */
  summary?: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Section repliable avec animation
 * Affiche toujours le récapitulatif à droite du titre
 */
export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  badge,
  summary,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-xs font-bold text-slate-500 uppercase hover:text-slate-700"
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {badge}
        </div>
        <div className="flex items-center gap-2">
          {/* Récapitulatif toujours visible à droite du titre */}
          {summary && (
            <div className="text-[10px] font-normal normal-case text-slate-400">
              {summary}
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="pt-2 animate-in slide-in-from-top-2">{children}</div>
      )}
    </div>
  );
};
