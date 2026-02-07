import { describe, expect, it } from "vitest";
import { deriveTradesFromFills } from "../lib/analytics/deriveTrades";
import { totalPnL, drawdownSeries, winLossStats, timePerformance, symbolBreakdown } from "../lib/analytics/metrics";
import type { TradeFill } from "../types/trades";

const fills: TradeFill[] = [
  {
    id: "1",
    ts: "2026-01-01T10:00:00.000Z",
    symbol: "DRV/USDC",
    marketType: "perp",
    side: "long",
    qty: 2,
    price: 10,
    fee: 0.1,
    feeType: "taker",
    orderType: "market",
    txSig: "tx-1",
    tags: []
  },
  {
    id: "2",
    ts: "2026-01-01T12:00:00.000Z",
    symbol: "DRV/USDC",
    marketType: "perp",
    side: "long",
    qty: 2,
    price: 12,
    fee: 0.1,
    feeType: "taker",
    orderType: "limit",
    txSig: "tx-2",
    tags: []
  },
  {
    id: "3",
    ts: "2026-01-02T10:00:00.000Z",
    symbol: "SOL/USDC",
    marketType: "spot",
    side: "short",
    qty: 1,
    price: 8,
    fee: 0.05,
    feeType: "maker",
    orderType: "limit",
    txSig: "tx-3",
    tags: []
  },
  {
    id: "4",
    ts: "2026-01-02T11:00:00.000Z",
    symbol: "SOL/USDC",
    marketType: "spot",
    side: "short",
    qty: 1,
    price: 9,
    fee: 0.05,
    feeType: "maker",
    orderType: "limit",
    txSig: "tx-4",
    tags: []
  }
];

describe("analytics", () => {
  it("derives trades from fills", () => {
    const trades = deriveTradesFromFills(fills);
    expect(trades.length).toBe(2);
  });

  it("computes total PnL and pct", () => {
    const trades = deriveTradesFromFills(fills);
    const pnl = totalPnL(trades);
    expect(pnl.pnl).toBeCloseTo(2.7, 2);
    expect(pnl.pnlPct).toBeGreaterThan(0);
  });

  it("computes drawdown series", () => {
    const trades = deriveTradesFromFills(fills);
    const equity = trades.map((trade) => ({ ts: trade.closeTs, equity: trade.pnl }));
    const drawdown = drawdownSeries(equity);
    expect(drawdown.series.length).toBe(2);
  });

  it("computes win rate", () => {
    const trades = deriveTradesFromFills(fills);
    const stats = winLossStats(trades);
    expect(stats.tradeCount).toBe(2);
    expect(stats.winRate).toBeGreaterThan(0);
  });

  it("creates time performance buckets", () => {
    const trades = deriveTradesFromFills(fills);
    const perf = timePerformance(trades);
    expect(Object.keys(perf.daily).length).toBeGreaterThan(0);
  });

  it("builds symbol breakdown", () => {
    const trades = deriveTradesFromFills(fills);
    const breakdown = symbolBreakdown(trades);
    expect(breakdown.length).toBe(2);
  });
});
