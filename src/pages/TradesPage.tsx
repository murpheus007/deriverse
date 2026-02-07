import { useMemo, useState } from "react";
import { useFills, useFillAnnotation, useUpsertFillAnnotation } from "../lib/storage/hooks";
import { useFilterState } from "../lib/utils/filters";
import { FiltersBar } from "../components/dashboard/FiltersBar";
import { TradesTable, TradeTableMode } from "../components/trades/TradesTable";
import { TradeDetailsDrawer } from "../components/trades/TradeDetailsDrawer";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { deriveTradesFromFills, applyDerivedFilters } from "../lib/analytics";
import type { TradeFill } from "../types/trades";
import { mapUiFiltersToFillFilters } from "../lib/storage/filterUtils";
import { useActiveAccountStore } from "../lib/storage/activeAccount";

export function TradesPage() {
  const { filters, updateFilters, resetFilters } = useFilterState();
  const [mode, setMode] = useState<TradeTableMode>("fills");
  const [search, setSearch] = useState("");
  const [activeFill, setActiveFill] = useState<TradeFill | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
  const { data: activeAnnotation } = useFillAnnotation(activeFill?.id ?? "");
  const upsertAnnotation = useUpsertFillAnnotation();

  const symbols = useMemo(() => Array.from(new Set(fills.map((fill) => fill.symbol))), [fills]);
  const derived = useMemo(() => deriveTradesFromFills(fills), [fills]);
  const filteredDerived = useMemo(() => applyDerivedFilters(derived, filters), [derived, filters]);
  const pagedDerived = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDerived.slice(start, start + pageSize);
  }, [filteredDerived, page]);
  const canGoNext =
    mode === "fills"
      ? fills.length === pageSize
      : page * pageSize < filteredDerived.length;

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
      <div className="card min-w-0 overflow-x-hidden p-4">
        <TradesTable
          fills={fills}
          derived={pagedDerived}
          mode={mode}
          search={search}
          onRowClick={(row) => {
            if (row.rowType === "fill") {
              setActiveFill(row);
            }
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
      <TradeDetailsDrawer
        open={Boolean(activeFill)}
        onClose={() => setActiveFill(null)}
        trade={activeFill}
        annotation={activeAnnotation ? { notes: activeAnnotation.note ?? "", tags: activeAnnotation.tags } : null}
        onSave={(notes, tags) => {
          if (!activeFill) return;
          upsertAnnotation.mutate({ fill_id: activeFill.id, note: notes, tags });
          setActiveFill(null);
        }}
      />
    </div>
  );
}
