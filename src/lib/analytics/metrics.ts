import type { TradeFill, DerivedTrade, OrderType } from "../../types/trades";
import { dayKey, weekdayKey, hourKey } from "../utils/dates";
import { safeDiv, toMoney, fromMoney, addMoney } from "../utils/money";

export type EquityPoint = { ts: string; equity: number };
export type DrawdownPoint = { ts: string; drawdown: number; drawdownPct: number };

export function totalPnL(trades: DerivedTrade[]) {
  const total = trades.reduce((acc, trade) => addMoney(acc, toMoney(trade.pnl)), { raw: 0 });
  const totalEntry = trades.reduce(
    (acc, trade) => addMoney(acc, toMoney(trade.entryPrice * trade.qty)),
    { raw: 0 }
  );
  return {
    pnl: fromMoney(total),
    pnlPct: totalEntry.raw === 0 ? 0 : total.raw / totalEntry.raw
  };
}

export function equityCurve(trades: DerivedTrade[]): EquityPoint[] {
  let equity = 0;
  return trades
    .slice()
    .sort((a, b) => new Date(a.closeTs).getTime() - new Date(b.closeTs).getTime())
    .map((trade) => {
      equity += trade.pnl;
      return { ts: trade.closeTs, equity: Number(equity.toFixed(6)) };
    });
}

export function drawdownSeries(equity: EquityPoint[]): { series: DrawdownPoint[]; maxDrawdown: number } {
  let peak = 0;
  let maxDrawdown = 0;
  const series = equity.map((point) => {
    peak = Math.max(peak, point.equity);
    const drawdown = point.equity - peak;
    const drawdownPct = peak === 0 ? 0 : drawdown / peak;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
    return { ts: point.ts, drawdown, drawdownPct };
  });
  return { series, maxDrawdown };
}

export function volumeAndFees(fills: TradeFill[]) {
  const volume = fills.reduce((acc, fill) => acc + fill.qty * fill.price, 0);
  const feeTotal = fills.reduce((acc, fill) => acc + fill.fee, 0);
  const feeBreakdown = fills.reduce<Record<string, number>>((acc, fill) => {
    acc[fill.feeType] = (acc[fill.feeType] || 0) + fill.fee;
    return acc;
  }, {});
  return { volume, feeTotal, feeBreakdown };
}

export function winLossStats(trades: DerivedTrade[]) {
  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const winRate = safeDiv(wins.length, trades.length);
  const avgWin = safeDiv(wins.reduce((sum, trade) => sum + trade.pnl, 0), wins.length);
  const avgLoss = safeDiv(losses.reduce((sum, trade) => sum + trade.pnl, 0), losses.length);
  const largestWin = wins.reduce((max, trade) => Math.max(max, trade.pnl), 0);
  const largestLoss = losses.reduce((min, trade) => Math.min(min, trade.pnl), 0);

  return {
    tradeCount: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss
  };
}

export function averageDuration(trades: DerivedTrade[]) {
  const total = trades.reduce((sum, trade) => sum + trade.durationSec, 0);
  return safeDiv(total, trades.length);
}

export function longShortRatio(trades: DerivedTrade[]) {
  const longCount = trades.filter((trade) => trade.side === "long").length;
  const shortCount = trades.filter((trade) => trade.side === "short").length;
  return {
    longCount,
    shortCount,
    ratio: shortCount === 0 ? longCount : longCount / shortCount,
    bias: longCount === shortCount ? "balanced" : longCount > shortCount ? "long" : "short"
  };
}

export function orderTypePerformance(trades: DerivedTrade[]) {
  const empty: Record<OrderType, { trades: number; wins: number; pnl: number; fees: number }> = {
    market: { trades: 0, wins: 0, pnl: 0, fees: 0 },
    limit: { trades: 0, wins: 0, pnl: 0, fees: 0 },
    stop: { trades: 0, wins: 0, pnl: 0, fees: 0 },
    other: { trades: 0, wins: 0, pnl: 0, fees: 0 }
  };

  trades.forEach((trade) => {
    (Object.keys(trade.orderTypeMix) as OrderType[]).forEach((type) => {
      const weight = trade.orderTypeMix[type];
      if (weight <= 0) return;
      empty[type].trades += 1;
      empty[type].pnl += trade.pnl;
      empty[type].fees += trade.totalFees;
      if (trade.pnl > 0) empty[type].wins += 1;
    });
  });

  return empty;
}

export function timePerformance(trades: DerivedTrade[]) {
  const daily: Record<string, number> = {};
  const weekday: Record<string, number> = {};
  const hour: Record<string, number> = {};

  trades.forEach((trade) => {
    const day = dayKey(trade.closeTs);
    const week = weekdayKey(trade.closeTs);
    const hourKeyName = hourKey(trade.closeTs);
    daily[day] = (daily[day] || 0) + trade.pnl;
    weekday[week] = (weekday[week] || 0) + trade.pnl;
    hour[hourKeyName] = (hour[hourKeyName] || 0) + trade.pnl;
  });

  return { daily, weekday, hour };
}

export function symbolBreakdown(trades: DerivedTrade[]) {
  const map: Record<string, { pnl: number; wins: number; trades: number; volume: number; fees: number }> = {};
  trades.forEach((trade) => {
    if (!map[trade.symbol]) {
      map[trade.symbol] = { pnl: 0, wins: 0, trades: 0, volume: 0, fees: 0 };
    }
    map[trade.symbol].pnl += trade.pnl;
    map[trade.symbol].trades += 1;
    map[trade.symbol].volume += trade.entryPrice * trade.qty;
    map[trade.symbol].fees += trade.totalFees;
    if (trade.pnl > 0) map[trade.symbol].wins += 1;
  });

  return Object.entries(map).map(([symbol, data]) => ({
    symbol,
    pnl: data.pnl,
    winRate: safeDiv(data.wins, data.trades),
    volume: data.volume,
    fees: data.fees,
    trades: data.trades
  }));
}
