"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthPoint = {
  label: string;
  ingresos: number; // pesos
  gastos: number; // pesos
};

function formatAxis(value: number): string {
  return `$${value.toLocaleString("es-MX")}`;
}

export function IncomeSpendingChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={formatAxis}
            width={70}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number"
                ? `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                : value
            }
          />
          <Legend />
          <Bar
            dataKey="ingresos"
            name="Ingresos"
            fill="#16a34a"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="gastos"
            name="Gastos"
            fill="#dc2626"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
