/**
 * Composant Input avec label et slider optionnel
 * Style unifié pour tous les champs de saisie
 */

import React from 'react';

interface InputWithLabelProps {
  /** Label du champ */
  label: string;
  /** Valeur numérique */
  value: number;
  /** Callback de modification */
  onChange: (value: number) => void;
  /** Suffixe affiché (€, %, etc.) */
  suffix?: string;
  /** Pas d'incrémentation */
  step?: number;
  /** Valeur minimum */
  min?: number;
  /** Valeur maximum */
  max?: number;
  /** Afficher un slider */
  showSlider?: boolean;
  /** Classe CSS pour le conteneur */
  className?: string;
  /** Identifiant pour les tests */
  'data-testid'?: string;
}

/**
 * Input numérique avec label et slider optionnel
 */
export const InputWithLabel: React.FC<InputWithLabelProps> = ({
  label,
  value,
  onChange,
  suffix = '€',
  step = 500,
  min = 0,
  max,
  showSlider = true,
  className = '',
  'data-testid': testId,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={className} data-testid={testId}>
      <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
        <label className="text-sm font-bold text-slate-500">{label}</label>
        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInputChange}
            className="w-20 text-right font-mono text-sm outline-none text-slate-800"
            data-testid={testId ? `${testId}-input` : undefined}
          />
          <span className="text-sm font-bold text-slate-500">{suffix}</span>
        </div>
      </div>
      {showSlider && max !== undefined && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
          data-testid={testId ? `${testId}-slider` : undefined}
        />
      )}
    </div>
  );
};

interface CompactInputProps {
  /** Valeur numérique */
  value: number;
  /** Callback de modification */
  onChange: (value: number) => void;
  /** Suffixe affiché */
  suffix?: string;
  /** Pas d'incrémentation */
  step?: number | string;
  /** Largeur du champ */
  width?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Identifiant pour les tests */
  'data-testid'?: string;
}

/**
 * Input compact pour les formulaires denses
 */
export const CompactInput: React.FC<CompactInputProps> = ({
  value,
  onChange,
  suffix = '€',
  step = 1,
  width = 'w-full',
  className = '',
  'data-testid': testId,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={`flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 ${className}`} data-testid={testId}>
      <input
        type="number"
        step={step}
        value={value}
        onChange={handleChange}
        className={`${width} text-sm font-mono text-right outline-none text-slate-700`}
        data-testid={testId ? `${testId}-input` : undefined}
      />
      <span className="text-xs text-slate-400">{suffix}</span>
    </div>
  );
};
