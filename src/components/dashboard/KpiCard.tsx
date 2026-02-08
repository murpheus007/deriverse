import { Card, CardBody } from "../ui/Card";

type Tone = "positive" | "negative" | "neutral";

export function KpiCard({
  label,
  value,
  sub,
  tone = "neutral"
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  const toneClass =
    tone === "positive" ? "text-profit" : tone === "negative" ? "text-loss" : "text-slate-100";

  return (
    <Card className="flex flex-col gap-2">
      <CardBody>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </CardBody>
    </Card>
  );
}
