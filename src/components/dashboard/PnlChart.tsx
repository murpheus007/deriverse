import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { Card, CardBody, CardHeader } from "../ui/Card";
import type { EquityPoint } from "../../lib/analytics/metrics";
import type { DrawdownPoint } from "../../lib/analytics/metrics";
import { formatCurrency } from "../../lib/utils/format";

export function PnlChart({ equity, drawdown }: { equity: EquityPoint[]; drawdown: DrawdownPoint[] }) {
  const data = equity.map((point, idx) => ({
    ts: point.ts,
    equity: point.equity,
    drawdown: drawdown[idx]?.drawdown ?? 0
  }));
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
          <p className="section-title">PnL Curve</p>
          <p className="text-xs text-slate-400">Realized equity + drawdown overlay</p>
        </div>
      </CardHeader>
      <CardBody className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="ts" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(value) => new Date(value).toLocaleString()}
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
              itemStyle={itemStyle}
            />
            <Legend />
            <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="drawdown" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
