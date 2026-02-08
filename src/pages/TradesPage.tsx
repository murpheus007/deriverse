import { useEffect, useMemo, useState } from "react";
import { useFills, useFillAnnotation, useUpsertFillAnnotation } from "../lib/storage/hooks";
import { useFilterState } from "../lib/utils/filters";
import { FiltersBar } from "../components/dashboard/FiltersBar";
import { TradesTable, TradeTableMode } from "../components/trades/TradesTable";
import { TradeDetailsDrawer } from "../components/trades/TradeDetailsDrawer";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { deriveTradesFromFills, applyDerivedFilters } from "../lib/analytics";
import type { TradeFill, DerivedTrade } from "../types/trades";
import { formatCurrency, formatPct, formatNumber } from "../lib/utils/format";
import { formatDateTimeShort } from "../lib/utils/dates";
import { mapUiFiltersToFillFilters } from "../lib/storage/filterUtils";
import { useActiveAccountStore } from "../lib/storage/activeAccount";

export function TradesPage() {
  const { filters, updateFilters, resetFilters } = useFilterState();
  const [mode, setMode] = useState<TradeTableMode>("fills");
  const [search, setSearch] = useState("");
  const [activeTrade, setActiveTrade] = useState<TradeFill | DerivedTrade | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const { accountId } = useActiveAccountStore();
  const fillFilters = useMemo(() => {
    const base = mapUiFiltersToFillFilters(filters, accountId);
    if (mode === "derived") {
      return { ...base, limit: 10000, offset: 0 };
    }
    return {
      ...base,
      limit: pageSize,
      offset: (page - 1) * pageSize
    };
  }, [filters, accountId, page, mode]);
  const { data: fills = [] } = useFills(fillFilters);
  const activeFillId = activeTrade && "ts" in activeTrade ? activeTrade.id : "";
  const { data: activeAnnotation } = useFillAnnotation(activeFillId);
  const upsertAnnotation = useUpsertFillAnnotation();

  const symbols = useMemo(() => Array.from(new Set(fills.map((fill) => fill.symbol))), [fills]);
  const derived = useMemo(() => deriveTradesFromFills(fills), [fills]);
  const filteredDerived = useMemo(() => applyDerivedFilters(derived, filters), [derived, filters]);
  const searchLower = search.trim().toLowerCase();
  const listFills = useMemo(
    () =>
      searchLower
        ? fills.filter((fill) =>
            JSON.stringify(fill).toLowerCase().includes(searchLower)
          )
        : fills,
    [fills, searchLower]
  );
  const listDerived = useMemo(
    () =>
      searchLower
        ? filteredDerived.filter((trade) =>
            JSON.stringify(trade).toLowerCase().includes(searchLower)
          )
        : filteredDerived,
    [filteredDerived, searchLower]
  );
  const derivedForPaging = isCompact ? listDerived : filteredDerived;
  const pagedDerived = useMemo(() => {
    const start = (page - 1) * pageSize;
    return derivedForPaging.slice(start, start + pageSize);
  }, [derivedForPaging, page]);
  const canGoNext =
    mode === "fills"
      ? fills.length === pageSize
      : page * pageSize < derivedForPaging.length;

  return (
    <div className="space-y-6">
      <FiltersBar filters={filters} onChange={updateFilters} onReset={resetFilters} symbols={symbols} />
      <div className="card min-w-0 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "fills" ? "primary" : "secondary"}
            onClick={() => {
              setMode("fills");
              setPage(1);
            }}
          >
            Fills
          </Button>
          <Button
            variant={mode === "derived" ? "primary" : "secondary"}
            onClick={() => {
              setMode("derived");
              setPage(1);
            }}
          >
            Derived Trades
          </Button>
        </div>
        <div className="w-full max-w-sm">
          <Input placeholder="Search trades" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>
      {isCompact ? (
        <div className="card min-w-0 p-4">
          <div className="space-y-3">
            {mode === "fills" &&
              listFills.map((fill) => (
                <button
                  key={fill.id}
                  onClick={() => setActiveTrade(fill)}
                  className="w-full rounded-lg border border-slate-800/70 p-3 text-left transition hover:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{fill.symbol}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateTimeShort(fill.ts)} · {fill.marketType}
                      </p>
                    </div>
                    <span className={`badge ${fill.side === "long" ? "badge-positive" : "badge-negative"}`}>
                      {fill.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span>Qty: {formatNumber(fill.qty)}</span>
                    <span>Price: {formatCurrency(fill.price)}</span>
                    <span>Fee: {formatCurrency(fill.fee)}</span>
                  </div>
                </button>
              ))}

            {mode === "derived" &&
              pagedDerived.map((trade) => (
                <button
                  key={trade.id}
                  onClick={() => setActiveTrade(trade)}
                  className="w-full rounded-lg border border-slate-800/70 p-3 text-left transition hover:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{trade.symbol}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateTimeShort(trade.closeTs)} · {trade.side.toUpperCase()}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatCurrency(trade.pnl)}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span>Qty: {formatNumber(trade.qty)}</span>
                    <span>Return: {formatPct(trade.returnPct)}</span>
                    <span>Fees: {formatCurrency(trade.totalFees)}</span>
                  </div>
                </button>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card min-w-0 p-4">
          <TradesTable
            fills={fills}
            derived={pagedDerived}
            mode={mode}
            search={search}
            onRowClick={(row) => {
              setActiveTrade(row);
            }}
          />
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!canGoNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      <TradeDetailsDrawer
        open={Boolean(activeTrade)}
        onClose={() => setActiveTrade(null)}
        trade={activeTrade}
        annotation={activeAnnotation ? { notes: activeAnnotation.note ?? "", tags: activeAnnotation.tags } : null}
        onSave={(notes, tags) => {
          if (!activeTrade || !("ts" in activeTrade)) return;
          upsertAnnotation.mutate({ fill_id: activeTrade.id, note: notes, tags });
          setActiveTrade(null);
        }}
      />
    </div>
  );
}
