/**
 * Tableau de détails à l'année cible
 * Compare les situations propriétaire vs locataire
 * Design compact et ergonomique
 */

import React from "react";
import { Home, Building, ArrowRight } from "lucide-react";
import type {
  ActiveTab,
  SimulationDataPoint,
  SimulationParams,
} from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { Card } from "../ui/Card";

interface DetailTableProps {
  /** Onglet actif */
  activeTab: ActiveTab;
  /** Année cible */
  targetYear: number;
  /** Données à l'année cible */
  targetData: SimulationDataPoint;
  /** Paramètres de simulation */
  params: SimulationParams;
}

/**
 * Tableau comparatif des détails propriétaire/locataire
 */
export const DetailTable: React.FC<DetailTableProps> = ({
  activeTab,
  targetYear,
  targetData,
  params,
}) => {
  return (
    <Card className="overflow-hidden" data-testid="detail-table">
      {/* Header compact avec année et info */}
      <div className="px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">
              {activeTab === "wealth"
                ? `Patrimoine après ${targetYear} ans`
                : `Coût moyen par mois`}
            </span>
            {activeTab === "wealth" && (
              <>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Vente à {formatCurrency(targetData.propertyValue)} €
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table comparative 3 colonnes */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left p-3 font-medium text-slate-600"></th>
              <th className="text-right p-3 font-medium text-amber-700">
                <div className="flex items-center justify-end gap-2">
                  <Building className="w-4 h-4" />
                  Location
                </div>
              </th>
              <th className="text-right p-3 font-medium text-emerald-700">
                <div className="flex items-center justify-end gap-2">
                  <Home className="w-4 h-4" />
                  Achat
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {activeTab === "wealth" ? (
              <>
                {/* Section propriétaire */}
                <TableRow
                  label="Valeur du bien"
                  locationValue={null}
                  achatValue={targetData.propertyValue}
                />
                <TableRow
                  label="Frais de vente"
                  locationValue={null}
                  achatValue={-Math.round(
                    (targetData.propertyValue * params.agencyFeesPercent) /
                      100 +
                      params.saleDiagnostics
                  )}
                />
                <TableRow
                  label="IRA (remb. anticipé)"
                  locationValue={null}
                  achatValue={targetData.earlyRepaymentFees > 0 ? -targetData.earlyRepaymentFees : null}
                />
                <TableRow
                  label="Remboursement banque"
                  locationValue={null}
                  achatValue={-targetData.debtRemaining}
                />
                <TableRow
                  label="Patrimoine immobilier net"
                  locationValue={null}
                  achatValue={targetData.ownerWealth}
                  isBold
                />
                {/* Section locataire */}
                <TableRow
                  label="Épargne totale"
                  locationValue={targetData.tenantWealth}
                  achatValue={null}
                />
                {/* Ligne totale */}
                <TableRow
                  label={`Patrimoine après ${targetYear} ans`}
                  locationValue={targetData.tenantWealth}
                  achatValue={targetData.ownerWealth}
                  isTotal
                />
              </>
            ) : (
              <>
                {/* Section propriétaire */}
                <TableRow
                  label="Frais initiaux"
                  locationValue={null}
                  achatValue={-Math.round(
                    params.propertyPrice +
                      params.notaryFees +
                      (targetData.propertyValue * params.agencyFeesPercent) /
                        100
                  )}
                />
                <TableRow
                  label="Charges récurrentes"
                  locationValue={null}
                  achatValue={-Math.round(
                    targetData.sunkCosts -
                      params.propertyTax * targetYear -
                      params.condoFees * 12 * targetYear +
                      params.propertyTax * targetYear +
                      params.condoFees * 12 * targetYear
                  )}
                />
                <TableRow
                  label="Récupéré vente"
                  locationValue={null}
                  achatValue={targetData.propertyValue}
                />
                <TableRow
                  label="Coût mensuel moyen"
                  locationValue={null}
                  achatValue={targetData.monthlyCostOwner}
                  isBold
                />
                {/* Section locataire */}
                <TableRow
                  label="Total loyers payés"
                  locationValue={-Math.round(
                    targetData.monthlyCostTenant * targetYear * 12
                  )}
                  achatValue={null}
                />
                <TableRow
                  label="Coût mensuel moyen"
                  locationValue={targetData.monthlyCostTenant}
                  achatValue={null}
                  isBold
                />
                {/* Comparaison */}
                <TableRow
                  label="Écart mensuel"
                  locationValue={null}
                  achatValue={
                    targetData.monthlyCostOwner - targetData.monthlyCostTenant
                  }
                  showSign
                />
                <TableRow
                  label={`Total sur ${targetYear} ans`}
                  locationValue={Math.round(
                    targetData.monthlyCostTenant * targetYear * 12
                  )}
                  achatValue={Math.round(
                    targetData.monthlyCostOwner * targetYear * 12
                  )}
                  isTotal
                />
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

/**
 * Ligne du tableau comparatif
 */
interface TableRowProps {
  label: string;
  locationValue: number | null;
  achatValue: number | null;
  isTotal?: boolean;
  isBold?: boolean;
  showSign?: boolean;
}

const TableRow: React.FC<TableRowProps> = ({
  label,
  locationValue,
  achatValue,
  isTotal = false,
  isBold = false,
  showSign = false,
}) => {
  const formatValue = (value: number | null) => {
    if (value === null) return "-";
    const absValue = Math.abs(value);
    const prefix = showSign
      ? value < 0
        ? "- "
        : "+ "
      : value < 0
      ? "- "
      : "";
    return `${prefix}${formatCurrency(absValue)} €`;
  };

  const getColorClass = (value: number | null) => {
    if (value === null) return "text-slate-400";
    if (showSign) {
      // Pour showSign: négatif = économie (vert), positif = perte (rouge)
      return value < 0 ? "text-emerald-600" : "text-rose-600";
    }
    if (isTotal || isBold) {
      return "font-bold text-slate-800";
    }
    // Couleur standard: négatif = rouge, positif = vert
    return value < 0 ? "text-rose-600" : "text-emerald-600";
  };

  return (
    <tr
      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
        isTotal ? "bg-slate-50 font-bold" : ""
      }`}
    >
      <th
        className={`text-left p-3 ${
          isTotal || isBold
            ? "font-bold text-slate-800"
            : "font-medium text-slate-600"
        }`}
        scope="row"
      >
        {label}
      </th>
      <td className={`text-right p-3 ${getColorClass(locationValue)}`}>
        {formatValue(locationValue)}
      </td>
      <td className={`text-right p-3 ${getColorClass(achatValue)}`}>
        {formatValue(achatValue)}
      </td>
    </tr>
  );
};
