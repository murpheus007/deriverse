import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { FilterState } from "../../types/filters";
import type { MarketType, TradeSide } from "../../types/trades";

export function FiltersBar({ filters, onChange, onReset, symbols }: { filters: FilterState; onChange: (patch: Partial<FilterState>) => void; onReset: () => void; symbols: string[] }) {
  return (
    <div className="card p-4">
      <div className="grid gap-4 md:grid-cols-6">
        <div>
          <p className="label">Start Date</p>
          <Input type="date" value={filters.startDate ?? ""} onChange={(event) => onChange({ startDate: event.target.value || undefined })} />
        </div>
        <div>
          <p className="label">End Date</p>
          <Input type="date" value={filters.endDate ?? ""} onChange={(event) => onChange({ endDate: event.target.value || undefined })} />
        </div>
        <div>
          <p className="label">Symbol</p>
          <Select value={filters.symbol} onChange={(event) => onChange({ symbol: event.target.value })}>
            <option value="all">All</option>
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="label">Market</p>
          <Select
            value={filters.marketType}
            onChange={(event) => onChange({ marketType: event.target.value as MarketType | "all" })}
          >
            <option value="all">All</option>
            <option value="spot">Spot</option>
            <option value="perp">Perp</option>
            <option value="options">Options</option>
          </Select>
        </div>
        <div>
          <p className="label">Side</p>
          <Select value={filters.side} onChange={(event) => onChange({ side: event.target.value as TradeSide | "all" })}>
            <option value="all">All</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="secondary" onClick={onReset} className="w-full">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
