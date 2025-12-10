/**
 * Composant Tabs pour la navigation entre vues
 */

import React from 'react';

interface Tab<T extends string> {
  /** Identifiant unique */
  id: T;
  /** Label affiché */
  label: string;
  /** Icône optionnelle */
  icon?: React.ReactNode;
}

interface TabsProps<T extends string> {
  /** Liste des onglets */
  tabs: Tab<T>[];
  /** Onglet actif */
  activeTab: T;
  /** Callback de changement */
  onChange: (tab: T) => void;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant de navigation par onglets
 */
export const Tabs = <T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabsProps<T>): React.ReactElement => {
  return (
    <div className={`bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all
            flex items-center justify-center gap-2
            ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
