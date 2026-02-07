import { useMemo } from "react";
import { useFills } from "../lib/storage/hooks";
import { useFilterState } from "../lib/utils/filters";
import { deriveTradesFromFills, applyDerivedFilters } from "../lib/analytics";
import { totalPnL, equityCurve, drawdownSeries, volumeAndFees, winLossStats, symbolBreakdown, timePerformance } from "../lib/analytics";
import { formatCurrency, formatPct, formatNumber } from "../lib/utils/format";
import { FiltersBar } from "../components/dashboard/FiltersBar";
import { KpiCard } from "../components/dashboard/KpiCard";
import { PnlChart } from "../components/dashboard/PnlChart";
import { TimeChart } from "../components/dashboard/TimeChart";
import { FeeBreakdown } from "../components/dashboard/FeeBreakdown";
import { SymbolTable } from "../components/dashboard/SymbolTable";
import { mapUiFiltersToFillFilters } from "../lib/storage/filterUtils";
import { useActiveAccountStore } from "../lib/storage/activeAccount";

export function DashboardPage() {
  const { filters, updateFilters, resetFilters } = useFilterState();
  const { accountId } = useActiveAccountStore();
  const fillFilters = useMemo(
    () => mapUiFiltersToFillFilters(filters, accountId),
    [filters, accountId]
  );
  const { data: fills = [] } = useFills(fillFilters);

  const symbols = useMemo(() => Array.from(new Set(fills.map((fill) => fill.symbol))), [fills]);
  const derived = useMemo(() => deriveTradesFromFills(fills), [fills]);
  const filteredDerived = useMemo(() => applyDerivedFilters(derived, filters), [derived, filters]);

  const pnl = totalPnL(filteredDerived);
  const equity = equityCurve(filteredDerived);
  const drawdown = drawdownSeries(equity);
  const volumeFees = volumeAndFees(fills);
  const wins = winLossStats(filteredDerived);
  const symbolsTable = symbolBreakdown(filteredDerived).sort((a, b) => b.pnl - a.pnl);
  const timePerf = timePerformance(filteredDerived);

  const daily = Object.entries(timePerf.daily).map(([key, value]) => ({ key, value }));
  const hourly = Object.entries(timePerf.hour).map(([key, value]) => ({ key, value }));

  const feeData = Object.entries(volumeFees.feeBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <FiltersBar filters={filters} onChange={updateFilters} onReset={resetFilters} symbols={symbols} />
      <div className="grid gap-4 2xl:grid-cols-5">
        <KpiCard label="Total PnL" value={formatCurrency(pnl.pnl)} sub={formatPct(pnl.pnlPct)} />
        <KpiCard label="Win Rate" value={formatPct(wins.winRate)} sub={`${wins.wins}/${wins.tradeCount} trades`} />
        <KpiCard label="Trades" value={formatNumber(wins.tradeCount)} sub={`${wins.wins} wins`} />
        <KpiCard label="Fees" value={formatCurrency(volumeFees.feeTotal)} sub="All fee types" />
        <KpiCard label="Max Drawdown" value={formatCurrency(drawdown.maxDrawdown)} sub="Peak to trough" />
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <PnlChart equity={equity} drawdown={drawdown.series} />
        <TimeChart daily={daily} hourly={hourly} />
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <FeeBreakdown data={feeData} />
        <SymbolTable rows={symbolsTable} />
      </div>
    </div>
  );
}
