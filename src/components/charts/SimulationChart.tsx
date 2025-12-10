/**
 * Composant graphique de simulation
 * Affiche l'évolution du patrimoine ou des coûts mensuels
 * Optimisé pour une meilleure ergonomie et présentation
 */

import React from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import type { ActiveTab, GraphScale, SimulationResult } from "../../types";
import { formatAxisValue } from "../../utils/formatters";
import { Card } from "../ui/Card";

interface SimulationChartProps {
  /** Onglet actif */
  activeTab: ActiveTab;
  /** Échelle du graphique */
  graphScale: GraphScale;
  /** Utiliser l'échelle logarithmique sur l'axe Y */
  isLogScale: boolean;
  /** Données de simulation */
  simulationData: SimulationResult;
  /** Année cible pour la ligne de référence */
  targetYear: number;
  /** Date d'achat pour calculer la position "Aujourd'hui" */
  purchaseDate?: string;
  /** Callback pour changer l'échelle */
  onScaleChange: (scale: GraphScale) => void;
  /** Callback pour changer le mode d'échelle Y */
  onLogScaleChange: (isLog: boolean) => void;
  /** Callback pour changer l'année cible via le curseur */
  onTargetYearChange?: (year: number) => void;
}

/**
 * Tooltip personnalisé avec meilleure présentation
 * Traduit les noms de dataKey en labels français
 * Filtre les doublons (Area et Line ont le même dataKey)
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{
    name: string;
    dataKey?: string;
    value: number;
    color: string;
  }>;
  label?: string | number;
  graphScale: GraphScale;
}> = ({ active, payload, label, graphScale }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  /** Mapping des dataKeys vers des labels français */
  const labelMap: Record<string, string> = {
    ownerWealth: "Propriétaire",
    tenantWealth: "Locataire",
    monthlyCostOwner: "Coût Propriétaire",
    monthlyCostTenant: "Coût Locataire",
  };

  const timeLabel = graphScale === "years" ? `Année ${label}` : `Mois ${label}`;

  // Filtrer pour ne garder qu'une entrée par dataKey (évite les doublons Area/Line)
  const seenDataKeys = new Set<string>();
  const uniquePayload = payload.filter((entry) => {
    if (!entry.dataKey) return false;
    const key = entry.dataKey.toString();
    if (seenDataKeys.has(key)) return false;
    seenDataKeys.add(key);
    return true;
  });

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200">
      <p className="text-xs font-semibold text-slate-600 mb-2 pb-1 border-b border-slate-100">
        {timeLabel}
      </p>
      {uniquePayload.map((entry, index) => {
        const displayName = entry.dataKey
          ? labelMap[entry.dataKey.toString()] || entry.name
          : entry.name;

        return (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-sm py-0.5"
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{displayName}</span>
            </span>
            <span className="font-bold text-slate-800">
              {entry.value.toLocaleString()} €
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Graphique principal de la simulation
 * Améliorations ergonomiques :
 * - Marges réduites pour maximiser l'espace graphique
 * - Tooltip personnalisé plus lisible
 * - Grille plus légère
 * - Zone colorée sous les courbes pour meilleure lisibilité
 */
export const SimulationChart: React.FC<SimulationChartProps> = ({
  activeTab,
  graphScale,
  isLogScale,
  simulationData,
  targetYear,
  purchaseDate,
  onScaleChange,
  onLogScaleChange,
  onTargetYearChange,
}) => {
  const data =
    graphScale === "years"
      ? simulationData.yearlyData
      : simulationData.monthlyData;
  const xDataKey = graphScale === "years" ? "year" : "month";
  const curveType = "monotone"; // Toujours lissé pour meilleure lisibilité
  const referenceX = graphScale === "years" ? targetYear : targetYear * 12;

  /**
   * Calcul du temps écoulé depuis la date d'achat
   * Retourne la position sur l'axe X et le label formaté
   */
  const todayInfo = React.useMemo(() => {
    if (!purchaseDate) return null;

    const purchase = new Date(purchaseDate);
    const today = new Date();
    const diffMs = today.getTime() - purchase.getTime();

    // Si la date d'achat est dans le futur, ne pas afficher
    if (diffMs < 0) return null;

    const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    // Position sur l'axe X selon l'échelle
    const xPosition =
      graphScale === "years" ? years + months / 12 : totalMonths;

    // Label formaté "X ans et Y mois" ou simplement selon les valeurs
    let label = "";
    if (years > 0 && months > 0) {
      label = `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
    } else if (years > 0) {
      label = `${years} an${years > 1 ? "s" : ""}`;
    } else {
      label = `${months} mois`;
    }

    return { xPosition, label };
  }, [purchaseDate, graphScale]);

  /** Handler pour le clic sur le graphique - déplace le curseur */
  const handleChartClick = (
    chartState: { activeLabel?: string | number } | null
  ): void => {
    if (!chartState?.activeLabel || !onTargetYearChange) return;

    const clickedValue = Number(chartState.activeLabel);
    if (isNaN(clickedValue)) return;

    // Convertir en années si on est en mode mois
    const newYear =
      graphScale === "years"
        ? Math.max(1, Math.min(25, clickedValue))
        : Math.max(1, Math.min(25, Math.round(clickedValue / 12)));

    onTargetYearChange(newYear);
  };

  return (
    <Card
      className="h-[420px] relative overflow-hidden"
      data-testid="simulation-chart"
    >
      {/* Header compact */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-slate-700">
            {activeTab === "wealth"
              ? "Évolution du Patrimoine Net"
              : "Coût Mensuel Moyen"}
          </h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={isLogScale}
                onChange={(e) => onLogScaleChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              Log
            </label>
            <ScaleToggle scale={graphScale} onChange={onScaleChange} />
          </div>
        </div>
      </div>

      {/* Graphique avec marges optimisées */}
      <div className="px-2 pb-2" style={{ height: "calc(100% - 52px)" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 15, left: 5, bottom: 20 }}
            onClick={onTargetYearChange ? handleChartClick : undefined}
            style={{ cursor: onTargetYearChange ? "crosshair" : "default" }}
          >
            {/* Grille légère */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
              strokeOpacity={0.8}
            />

            {/* Axe X compact */}
            <XAxis
              dataKey={xDataKey}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickMargin={8}
            />

            {/* Axe Y avec formatage - optionnellement logarithmique */}
            <YAxis
              tickFormatter={formatAxisValue}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              width={45}
              domain={["auto", "auto"]}
              scale={isLogScale ? "log" : "auto"}
              allowDataOverflow={isLogScale}
            />

            {/* Tooltip personnalisé - curseur désactivé pour éviter la ligne blanche */}
            <Tooltip
              content={<CustomTooltip graphScale={graphScale} />}
              cursor={false}
              isAnimationActive={false}
            />

            {/* Légende personnalisée - filtre les Area (qui n'ont pas de prop name) */}
            <Legend
              verticalAlign="bottom"
              height={28}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingTop: "8px",
                fontSize: "12px",
              }}
              payload={
                activeTab === "wealth"
                  ? [
                      {
                        value: "Propriétaire",
                        type: "circle",
                        color: "#10b981",
                      },
                      { value: "Locataire", type: "circle", color: "#ef4444" },
                    ]
                  : [
                      {
                        value: "Coût Propriétaire",
                        type: "circle",
                        color: "#10b981",
                      },
                      {
                        value: "Coût Locataire",
                        type: "circle",
                        color: "#ef4444",
                      },
                    ]
              }
            />

            {/* Ligne de référence pour l'année cible */}
            <ReferenceLine
              x={referenceX}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: `${targetYear} ans`,
                position: "insideBottomRight",
                fill: "#3b82f6",
                fontSize: 11,
                fontWeight: 600,
                offset: 10,
              }}
            />

            {/* Ligne de référence "Aujourd'hui" - position depuis date d'achat */}
            {todayInfo && todayInfo.xPosition > 0 && (
              <ReferenceLine
                x={todayInfo.xPosition}
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="none"
                label={{
                  value: `Aujourd'hui (${todayInfo.label})`,
                  position: "insideTopLeft",
                  fill: "#f59e0b",
                  fontSize: 10,
                  fontWeight: 600,
                  offset: 5,
                }}
              />
            )}

            {activeTab === "wealth" ? (
              <>
                {/* Ligne propriétaire */}
                <Line
                  type={curveType}
                  dataKey="ownerWealth"
                  name="Propriétaire"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                />
                {/* Ligne locataire */}
                <Line
                  type={curveType}
                  dataKey="tenantWealth"
                  name="Locataire"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#ef4444" }}
                />
              </>
            ) : (
              <>
                {/* Ligne propriétaire - coût mensuel */}
                <Line
                  type={curveType}
                  dataKey="monthlyCostOwner"
                  name="Coût Propriétaire"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                />
                {/* Ligne locataire - loyer */}
                <Line
                  type={curveType}
                  dataKey="monthlyCostTenant"
                  name="Coût Locataire"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#ef4444" }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

interface ScaleToggleProps {
  scale: GraphScale;
  onChange: (scale: GraphScale) => void;
}

/**
 * Bascule compacte entre échelle années/mois
 */
const ScaleToggle: React.FC<ScaleToggleProps> = ({ scale, onChange }) => {
  return (
    <div className="flex bg-slate-100 rounded-md p-0.5 text-xs">
      <button
        onClick={() => onChange("years")}
        className={`px-2 py-1 rounded transition-all ${
          scale === "years"
            ? "bg-white shadow-sm text-blue-600 font-semibold"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Années
      </button>
      <button
        onClick={() => onChange("months")}
        className={`px-2 py-1 rounded transition-all ${
          scale === "months"
            ? "bg-white shadow-sm text-blue-600 font-semibold"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Mois
      </button>
    </div>
  );
};
