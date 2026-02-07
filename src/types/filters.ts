import type { MarketType, TradeSide } from "./trades";

export type FilterState = {
  startDate?: string;
  endDate?: string;
  symbol: string;
  marketType: MarketType | "all";
  side: TradeSide | "all";
  search: string;
};
