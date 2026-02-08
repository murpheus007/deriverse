import type { Cursor, FetchedFill } from "./types";
import { buildEventId } from "./hash";

export interface TradeSyncProvider {
  fetchNewFills(
    walletAddress: string,
    cursor: Cursor
  ): Promise<{ fills: FetchedFill[]; nextCursor: Cursor }>;
}

function seededValue(seed: string, index: number) {
  let hash = 5381;
  const raw = `${seed}-${index}`;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return Math.abs(hash) % 1000;
}

const symbols = ["SOL/USDC", "DRV/USDC", "JUP/USDC", "BONK/USDC", "RNDR/USDC"];
const marketTypes: Array<"spot" | "perp" | "options"> = ["spot", "perp", "options"];
const sides: Array<"long" | "short"> = ["long", "short"];
const orderTypes: Array<"market" | "limit" | "stop" | "other"> = ["market", "limit", "stop", "other"];
const feeTypes: Array<"maker" | "taker" | "funding" | "other"> = ["maker", "taker", "funding", "other"];

function seededPick<T>(items: T[], seed: string, index: number): T {
  return items[seededValue(seed, index) % items.length];
}

export class MockSyncProvider implements TradeSyncProvider {
  async fetchNewFills(walletAddress: string, cursor: Cursor) {
    const spreadDays = 21;
    const baseTime = cursor.lastSyncedAt
      ? new Date(cursor.lastSyncedAt).getTime()
      : Date.now() - spreadDays * 24 * 60 * 60 * 1000;
    const tradeCount = 12 + (seededValue(walletAddress, 7) % 9);
    const fills: FetchedFill[] = [];
    let currentTime = baseTime;

    for (let i = 0; i < tradeCount; i += 1) {
      const gapMinutes = 45 + (seededValue(walletAddress, i + 17) % (24 * 60));
      currentTime += gapMinutes * 60_000;
      const entryTs = new Date(currentTime).toISOString();
      const durationMinutes = 5 + (seededValue(walletAddress, i + 33) % 240);
      const exitTs = new Date(currentTime + durationMinutes * 60_000).toISOString();
      const symbol = seededPick(symbols, walletAddress, i + 1);
      const side = seededPick(sides, walletAddress, i + 3);
      const marketType = seededPick(marketTypes, walletAddress, i + 5);
      const qtySeed = seededValue(walletAddress, i) / 1000;
      const priceSeed = seededValue(walletAddress, i + 7) / 1000;
      const feeSeed = seededValue(walletAddress, i + 13) / 1000;
      const qty = Number((0.5 + qtySeed * 3).toFixed(2));
      const entryPrice = Number((2 + priceSeed * 48).toFixed(2));
      const drift = ((seededValue(walletAddress, i + 21) % 200) - 100) / 1000;
      const exitPrice = Number((entryPrice * (1 + drift)).toFixed(2));
      const entryFee = Number((0.01 + feeSeed * 0.24).toFixed(4));
      const exitFee = Number((0.01 + (feeSeed * 0.19 + 0.01)).toFixed(4));
      const baseSig = `${walletAddress.slice(0, 6)}-${entryTs}-${i}`;
      const entrySig = `${baseSig}-a`;
      const exitSig = `${baseSig}-b`;
      const entryEventId = buildEventId({ txSig: entrySig, ts: entryTs, symbol, qty, price: entryPrice });
      const exitEventId = buildEventId({ txSig: exitSig, ts: exitTs, symbol, qty, price: exitPrice });

      fills.push({
        account_id: "",
        ts: entryTs,
        symbol,
        market_type: marketType,
        side,
        qty,
        price: entryPrice,
        fee: entryFee,
        fee_type: seededPick(feeTypes, walletAddress, i + 11),
        order_type: seededPick(orderTypes, walletAddress, i + 9),
        tx_sig: entrySig,
        event_id: entryEventId,
        raw: { source: "mock", walletAddress, leg: "entry" },
        tags: ["sync", "mock", "entry"]
      });

      fills.push({
        account_id: "",
        ts: exitTs,
        symbol,
        market_type: marketType,
        side,
        qty,
        price: exitPrice,
        fee: exitFee,
        fee_type: seededPick(feeTypes, walletAddress, i + 19),
        order_type: seededPick(orderTypes, walletAddress, i + 23),
        tx_sig: exitSig,
        event_id: exitEventId,
        raw: { source: "mock", walletAddress, leg: "exit" },
        tags: ["sync", "mock", "exit"]
      });
    }

    const last = fills[fills.length - 1];
    const nextCursor: Cursor = {
      lastSyncedAt: last?.ts,
      lastSyncedSig: last?.tx_sig
    };

    return { fills, nextCursor };
  }
}
