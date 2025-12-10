/**
 * Composant Header de l'application
 * Affiche le titre et le bouton de reset
 */

import React from "react";
import { Home, RotateCcw } from "lucide-react";
import { IconButton } from "../ui/Button";

interface HeaderProps {
  /** Callback pour réinitialiser les données */
  onReset: () => void;
}

/**
 * Header principal avec titre et actions
 * Affiche le titre en ligne avec le bouton reset
 */
export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
        <Home className="w-6 h-6 text-blue-600" />
        Simulateur Immo
      </h1>
      <IconButton
        icon={<RotateCcw className="w-4 h-4" />}
        onClick={onReset}
        variant="danger"
        title="Réinitialiser"
      />
    </div>
  );
};
