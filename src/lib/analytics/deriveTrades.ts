import type { TradeFill, DerivedTrade, OrderType } from "../../types/trades";
import { durationSeconds } from "../utils/dates";
import { buildDerivedId } from "../storage/ids";
import { toMoney, fromMoney, addMoney, subMoney } from "../utils/money";

const orderTypeInit: Record<OrderType, number> = {
  market: 0,
  limit: 0,
  stop: 0,
  other: 0
};

export function deriveTradesFromFills(fills: TradeFill[]): DerivedTrade[] {
  const grouped: Record<string, TradeFill[]> = {};
  fills.forEach((fill) => {
    const key = `${fill.symbol}-${fill.side}`;
    grouped[key] = grouped[key] ? [...grouped[key], fill] : [fill];
  });

  const derived: DerivedTrade[] = [];

  Object.values(grouped).forEach((group) => {
    const sorted = [...group].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    for (let i = 0; i + 1 < sorted.length; i += 2) {
      const entry = sorted[i];
      const exit = sorted[i + 1];
      const qty = Math.min(entry.qty, exit.qty);
      const entryNotional = toMoney(entry.price * qty);
      const exitNotional = toMoney(exit.price * qty);
      const feeTotal = addMoney(toMoney(entry.fee), toMoney(exit.fee));
      const pnlRaw =
        entry.side === "long"
          ? subMoney(exitNotional, entryNotional)
          : subMoney(entryNotional, exitNotional);
      const pnl = subMoney(pnlRaw, feeTotal);
      const returnPct = entryNotional.raw === 0 ? 0 : pnl.raw / entryNotional.raw;

      const orderMix: Record<OrderType, number> = { ...orderTypeInit };
      orderMix[entry.orderType] += 1;
      orderMix[exit.orderType] += 1;

      const openTs = entry.ts;
      const closeTs = exit.ts;
      const id = buildDerivedId({ openTs, closeTs, symbol: entry.symbol, side: entry.side });

      derived.push({
        id,
        openTs,
        closeTs,
        symbol: entry.symbol,
        side: entry.side,
        entryPrice: entry.price,
        exitPrice: exit.price,
        qty,
        pnl: fromMoney(pnl),
        returnPct,
        durationSec: durationSeconds(openTs, closeTs),
        totalFees: fromMoney(feeTotal),
        orderTypeMix: orderMix
      });
    }
  });

  return derived.sort((a, b) => new Date(a.closeTs).getTime() - new Date(b.closeTs).getTime());
}
