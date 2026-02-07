import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../lib/utils/format";

export type TimeSeries = { key: string; value: number }[];

export function TimeChart({ daily, hourly }: { daily: TimeSeries; hourly: TimeSeries }) {
  const [mode, setMode] = useState<"daily" | "hourly">("daily");
  const data = mode === "daily" ? daily : hourly;
  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "0.75rem",
    fontSize: "12px"
  } as const;
  const labelStyle = { color: "var(--text-strong)" } as const;
  const itemStyle = { color: "var(--text)" } as const;

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Time-based Performance</p>
          <p className="text-xs text-slate-400">PnL by day or hour</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "daily" ? "primary" : "secondary"} onClick={() => setMode("daily")}>Daily</Button>
          <Button variant={mode === "hourly" ? "primary" : "secondary"} onClick={() => setMode("hourly")}>Hour</Button>
        </div>
      </CardHeader>
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={0} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="key" padding={{ left: 0, right: 0 }} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
              itemStyle={itemStyle}
              cursor={{ fill: "transparent" }}
            />
            <Bar dataKey="value" barSize={10} radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.value >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
