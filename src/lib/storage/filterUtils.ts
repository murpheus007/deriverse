import type { FilterState } from "../../types/filters";
import type { FillFilters, TradeFill } from "../../types/trades";

export function mapUiFiltersToFillFilters(filters: FilterState, accountId?: string | null): FillFilters {
  return {
    from: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
    to: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
    symbol: filters.symbol === "all" ? undefined : filters.symbol,
    marketType: filters.marketType === "all" ? undefined : filters.marketType,
    side: filters.side === "all" ? undefined : filters.side,
    accountId: accountId ?? undefined,
    limit: 10000
  };
}

export function applyFillFiltersLocal(fills: TradeFill[], filters: FillFilters): TradeFill[] {
  return fills.filter((fill) => {
    const ts = new Date(fill.ts).getTime();
    const fromOk = filters.from ? ts >= new Date(filters.from).getTime() : true;
    const toOk = filters.to ? ts <= new Date(filters.to).getTime() : true;
    const symbolOk = filters.symbol ? fill.symbol === filters.symbol : true;
    const marketOk = filters.marketType ? fill.marketType === filters.marketType : true;
    const sideOk = filters.side ? fill.side === filters.side : true;
    const accountOk = filters.accountId ? fill.accountId === filters.accountId : true;
    const orderOk = filters.orderType ? fill.orderType === filters.orderType : true;
    return fromOk && toOk && symbolOk && marketOk && sideOk && accountOk && orderOk;
  });
}
