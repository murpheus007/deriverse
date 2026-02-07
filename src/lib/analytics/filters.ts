import type { TradeFill, DerivedTrade } from "../../types/trades";
import type { FilterState } from "../../types/filters";

export function applyFillFilters(fills: TradeFill[], filters: FilterState) {
  return fills.filter((fill) => {
    const ts = new Date(fill.ts).getTime();
    const startOk = filters.startDate ? ts >= new Date(filters.startDate).getTime() : true;
    const endOk = filters.endDate ? ts <= new Date(filters.endDate).getTime() : true;
    const symbolOk = filters.symbol === "all" ? true : fill.symbol === filters.symbol;
    const marketOk = filters.marketType === "all" ? true : fill.marketType === filters.marketType;
    const sideOk = filters.side === "all" ? true : fill.side === filters.side;
    const searchOk = filters.search
      ? `${fill.symbol} ${fill.txSig}`.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    return startOk && endOk && symbolOk && marketOk && sideOk && searchOk;
  });
}

export function applyDerivedFilters(trades: DerivedTrade[], filters: FilterState) {
  return trades.filter((trade) => {
    const ts = new Date(trade.closeTs).getTime();
    const startOk = filters.startDate ? ts >= new Date(filters.startDate).getTime() : true;
    const endOk = filters.endDate ? ts <= new Date(filters.endDate).getTime() : true;
    const symbolOk = filters.symbol === "all" ? true : trade.symbol === filters.symbol;
    const sideOk = filters.side === "all" ? true : trade.side === filters.side;
    return startOk && endOk && symbolOk && sideOk;
  });
}
