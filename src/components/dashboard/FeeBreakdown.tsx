import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { formatCurrency } from "../../lib/utils/format";

const colors = ["#3b82f6", "#22c55e", "#f97316", "#e11d48"];

export function FeeBreakdown({ data }: { data: { name: string; value: number }[] }) {
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
          <p className="section-title">Fee Composition</p>
          <p className="text-xs text-slate-400">Split by fee type</p>
        </div>
      </CardHeader>
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
              itemStyle={itemStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
