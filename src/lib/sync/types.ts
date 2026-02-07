export type Cursor = {
  lastSyncedAt?: string;
  lastSyncedSig?: string;
};

export type FetchedFill = {
  account_id: string;
  ts: string;
  symbol: string;
  market_type: "spot" | "perp" | "options";
  side: "long" | "short";
  qty: number;
  price: number;
  fee: number;
  fee_type: "maker" | "taker" | "funding" | "other";
  order_type: "market" | "limit" | "stop" | "other";
  tx_sig: string;
  event_id: string;
  raw: Record<string, unknown>;
  tags: string[];
};
