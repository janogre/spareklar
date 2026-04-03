"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { SpendingCategory } from "@/lib/claude";

const CATEGORY_COLORS: Record<string, string> = {
  electricity: "#EAB308",
  loans: "#3B82F6",
  mobile: "#A855F7",
  insurance: "#22C55E",
  subscriptions: "#EC4899",
  savings: "#10B981",
  credit_card: "#F97316",
  food: "#84CC16",
  other: "#6B7280",
};

const DEFAULT_COLOR = "#6B7280";

function getColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

function prepareData(breakdown: SpendingCategory[]): SpendingCategory[] {
  if (breakdown.length <= 8) return breakdown;

  const top7 = breakdown.slice(0, 7);
  const rest = breakdown.slice(7);
  const annetAmount = rest.reduce((sum, c) => sum + c.amountNOK, 0);
  const annetPct = rest.reduce((sum, c) => sum + c.percentage, 0);

  return [
    ...top7,
    {
      category: "other",
      labelNO: "Annet",
      amountNOK: Math.round(annetAmount),
      percentage: Math.round(annetPct),
    },
  ];
}

interface Props {
  data: SpendingCategory[];
  totalMonthlySpendNOK: number;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function ExpenseChart({ data, totalMonthlySpendNOK }: Props) {
  const isMobile = useIsMobile();
  if (!data || data.length === 0) return null;

  const chartData = prepareData(data);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm max-w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900">Utgiftsoversikt</h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">
          {totalMonthlySpendNOK.toLocaleString("nb-NO")} kr/mnd
        </span>
      </div>
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy={isMobile ? "40%" : "50%"}
            innerRadius="50%"
            outerRadius="75%"
            dataKey="amountNOK"
            nameKey="labelNO"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.category)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number"
                ? `${value.toLocaleString("nb-NO")} kr`
                : String(value),
              name,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            layout={isMobile ? "vertical" : "horizontal"}
            align={isMobile ? "center" : "center"}
            verticalAlign={isMobile ? "bottom" : "bottom"}
            formatter={(value: string) => (
              <span style={{ fontSize: 11, color: "#4B5563" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
