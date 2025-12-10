/**
 * Composant Button avec variantes
 */

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  /** Contenu du bouton */
  children: React.ReactNode;
  /** Callback de clic */
  onClick?: () => void;
  /** Variante de style */
  variant?: ButtonVariant;
  /** Bouton désactivé */
  disabled?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** Titre pour l'accessibilité */
  title?: string;
  /** Type de bouton */
  type?: 'button' | 'submit' | 'reset';
}

/** Styles par variante */
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
  secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  danger: 'text-slate-400 hover:text-red-500 hover:bg-red-50',
  ghost: 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
};

/**
 * Bouton avec variantes de style
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  title,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-4 py-2 rounded-lg font-semibold transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

interface IconButtonProps {
  /** Icône à afficher */
  icon: React.ReactNode;
  /** Callback de clic */
  onClick?: () => void;
  /** Variante de style */
  variant?: ButtonVariant;
  /** Titre pour l'accessibilité */
  title?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Bouton icône compact
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'ghost',
  title,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded-full transition-colors
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};
