import { Card, CardBody } from "../ui/Card";

export function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-2">
      <CardBody>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </CardBody>
    </Card>
  );
}
