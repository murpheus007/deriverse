export type MarketType = "spot" | "perp" | "options";
export type TradeSide = "long" | "short";
export type FeeType = "maker" | "taker" | "funding" | "other";
export type OrderType = "market" | "limit" | "stop" | "other";

export type TradeFill = {
  id: string;
  ts: string;
  symbol: string;
  marketType: MarketType;
  side: TradeSide;
  qty: number;
  price: number;
  fee: number;
  feeType: FeeType;
  orderType: OrderType;
  txSig: string;
  eventId?: string;
  raw?: unknown | null;
  tags: string[];
  importId?: string | null;
  accountId?: string | null;
};

export type DerivedTrade = {
  id: string;
  openTs: string;
  closeTs: string;
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
  returnPct: number;
  durationSec: number;
  totalFees: number;
  orderTypeMix: Record<OrderType, number>;
  notes?: string;
};

export type FillFilters = {
  from?: string;
  to?: string;
  symbol?: string;
  marketType?: MarketType;
  side?: TradeSide;
  accountId?: string | null;
  orderType?: OrderType;
  limit?: number;
  offset?: number;
};

export type TradeFillInsert = {
  ts: string;
  symbol: string;
  marketType: MarketType;
  side: TradeSide;
  qty: number;
  price: number;
  fee: number;
  feeType: FeeType;
  orderType: OrderType;
  txSig: string;
  eventId?: string;
  raw?: unknown | null;
  tags: string[];
  importId?: string | null;
  accountId?: string | null;
};

export type FillAnnotation = {
  id: string;
  fillId: string;
  userId: string;
  note?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt?: string | null;
};
