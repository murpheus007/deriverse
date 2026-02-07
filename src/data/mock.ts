import type { TradeFill, MarketType, OrderType, FeeType, TradeSide } from "../types/trades";

const symbols = ["DRV/USDC", "SOL/USDC", "JUP/USDC", "BONK/USDC", "RNDR/USDC"];
const marketTypes: MarketType[] = ["spot", "perp", "options"];
const orderTypes: OrderType[] = ["market", "limit", "stop", "other"];
const feeTypes: FeeType[] = ["maker", "taker", "funding", "other"];
const sides: TradeSide[] = ["long", "short"];

function randItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateMockFills(tradeCount = 40): TradeFill[] {
  const now = Date.now();
  const fills: TradeFill[] = [];

  for (let i = 0; i < tradeCount; i += 1) {
    const symbol = randItem(symbols);
    const marketType = randItem(marketTypes);
    const side = randItem(sides);
    const orderType = randItem(orderTypes);
    const feeType = randItem(feeTypes);
    const qty = Number(randBetween(0.5, 6).toFixed(2));
    const entryPrice = Number(randBetween(0.4, 18).toFixed(2));
    const exitPrice = Number((entryPrice * randBetween(0.85, 1.25)).toFixed(2));
    const entryTs = new Date(now - randBetween(1, 30) * 24 * 60 * 60 * 1000).toISOString();
    const closeTs = new Date(new Date(entryTs).getTime() + randBetween(5, 240) * 60 * 1000).toISOString();

    const entryFee = Number(randBetween(0.01, 0.2).toFixed(4));
    const exitFee = Number(randBetween(0.01, 0.2).toFixed(4));

    fills.push({
      id: `fill-${i + 1}-entry`,
      ts: entryTs,
      symbol,
      marketType,
      side,
      qty,
      price: entryPrice,
      fee: entryFee,
      feeType,
      orderType,
      txSig: `tx-${i + 1}-a`,
      tags: ["seed", "entry"]
    });
    fills.push({
      id: `fill-${i + 1}-exit`,
      ts: closeTs,
      symbol,
      marketType,
      side,
      qty,
      price: exitPrice,
      fee: exitFee,
      feeType,
      orderType: randItem(orderTypes),
      txSig: `tx-${i + 1}-b`,
      tags: ["seed", "exit"]
    });
  }

  return fills.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}
