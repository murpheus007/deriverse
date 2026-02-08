import { useEffect, useMemo, useState } from "react";
import { useFills } from "../lib/storage/hooks";
import { useActiveAccountStore } from "../lib/storage/activeAccount";
import { deriveTradesFromFills } from "../lib/analytics";
import { timePerformance, winLossStats } from "../lib/analytics/metrics";
import { dayKey, formatDate } from "../lib/utils/dates";
import { formatCurrency } from "../lib/utils/format";
import { Card, CardBody, CardHeader } from "../components/ui/Card";

function buildMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells: Array<{ key: string; label: string } | null> = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    cells.push({ key: dayKey(current.toISOString()), label: `${day}` });
  }
  return cells;
}

export function CalendarPage() {
  const { accountId } = useActiveAccountStore();
  const { data: fills = [] } = useFills({ accountId, limit: 10000 });
  const trades = useMemo(() => deriveTradesFromFills(fills), [fills]);
  const perf = useMemo(() => timePerformance(trades), [trades]);

  const latestTs = useMemo(() => {
    const latestTrade = trades
      .slice()
      .sort((a, b) => new Date(b.closeTs).getTime() - new Date(a.closeTs).getTime())[0];
    return latestTrade?.closeTs ?? fills[0]?.ts ?? new Date().toISOString();
  }, [trades, fills]);

  const latestDay = useMemo(() => dayKey(latestTs), [latestTs]);
  const [selectedDay, setSelectedDay] = useState(latestDay);

  useEffect(() => {
    setSelectedDay(latestDay);
  }, [latestDay]);

  const dayPnl = perf.daily;
  const monthDate = useMemo(() => new Date(latestTs), [latestTs]);
  const monthCells = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const monthKey = useMemo(() => latestDay.slice(0, 7), [latestDay]);
  const hasMonthData = useMemo(
    () => Object.keys(dayPnl).some((key) => key.startsWith(monthKey)),
    [dayPnl, monthKey]
  );

  const dayTrades = useMemo(
    () => trades.filter((trade) => dayKey(trade.closeTs) === selectedDay),
    [trades, selectedDay]
  );
  const dayStats = useMemo(() => winLossStats(dayTrades), [dayTrades]);
  const dayTotal = dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <p className="section-title">Performance Calendar</p>
            <p className="text-xs text-slate-400">Daily PnL heatmap from derived trades.</p>
          </div>
        </CardHeader>
        <CardBody>
          {!hasMonthData && (
            <p className="mb-4 text-xs text-slate-400">
              No trades for this month yet. Calendar shows the latest trade month.
            </p>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: "rgba(16, 185, 129, 0.7)" }}
              />
              Profit day
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.7)" }}
              />
              Loss day
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm border"
                style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
              />
              No trades
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold">
                {day}
              </div>
            ))}
            {monthCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }
              const pnl = dayPnl[cell.key] ?? 0;
              const isSelected = selectedDay === cell.key;
              const intensity = Math.min(Math.abs(pnl) / 250, 1);
              const base = pnl > 0 ? "16, 185, 129" : "239, 68, 68";
              const bgColor =
                pnl === 0 ? "var(--surface-muted)" : `rgba(${base}, ${0.35 + intensity * 0.6})`;
              const borderColor =
                pnl === 0 ? "var(--border)" : `rgba(${base}, ${0.65 + intensity * 0.25})`;
              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDay(cell.key)}
                  style={{ backgroundColor: bgColor, borderColor }}
                  className={`h-10 rounded-md border text-sm font-semibold transition ${
                    pnl === 0 ? "text-slate-500" : "text-white"
                  } ${
                    isSelected ? "ring-2 ring-brand-500/70" : "hover:ring-1 hover:ring-slate-500"
                  }`}
                >
                  {cell.label}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <p className="section-title">{formatDate(selectedDay)}</p>
            <p className="text-xs text-slate-400">Daily breakdown for selected session.</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="label">Net PnL</p>
              <p className={`text-lg font-semibold ${dayTotal >= 0 ? "text-profit" : "text-loss"}`}>
                {formatCurrency(dayTotal)}
              </p>
            </div>
            <div>
              <p className="label">Trades</p>
              <p className="text-lg font-semibold text-slate-100">{dayStats.tradeCount}</p>
            </div>
            <div>
              <p className="label">Win Rate</p>
              <p className="text-lg font-semibold text-slate-100">
                {Math.round(dayStats.winRate * 100)}%
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            {dayTrades.length === 0 && <p>No trades recorded for this day.</p>}
            {dayTrades.slice(0, 8).map((trade) => (
              <div
                key={trade.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/60 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-slate-100">{trade.symbol}</p>
                  <p className="text-xs text-slate-400">
                    {trade.side.toUpperCase()} · {trade.qty} @ {trade.entryPrice.toFixed(2)}
                  </p>
                </div>
                <div className={trade.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {formatCurrency(trade.pnl)}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
