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

const symbols = ["SOL/USDC", "DRV/USDC", "JUP/USDC", "BONK/USDC"];

export class MockSyncProvider implements TradeSyncProvider {
  async fetchNewFills(walletAddress: string, cursor: Cursor) {
    const baseTime = cursor.lastSyncedAt ? new Date(cursor.lastSyncedAt).getTime() : Date.now() - 3600_000;
    const count = 20;
    const fills: FetchedFill[] = [];

    for (let i = 0; i < count; i += 1) {
      const ts = new Date(baseTime + (i + 1) * 60_000).toISOString();
      const symbol = symbols[i % symbols.length];
      const side = i % 2 === 0 ? "long" : "short";
      const marketType = i % 3 === 0 ? "spot" : "perp";
      const qtySeed = seededValue(walletAddress, i) / 1000;
      const priceSeed = seededValue(walletAddress, i + 7) / 1000;
      const feeSeed = seededValue(walletAddress, i + 13) / 1000;
      const qty = Number((0.5 + qtySeed * 3).toFixed(2));
      const price = Number((2 + priceSeed * 48).toFixed(2));
      const fee = Number((0.01 + feeSeed * 0.24).toFixed(4));
      const txSig = `${walletAddress.slice(0, 6)}-${ts}-${i}`;
      const event_id = buildEventId({ txSig, ts, symbol, qty, price });

      fills.push({
        account_id: "",
        ts,
        symbol,
        market_type: marketType,
        side,
        qty,
        price,
        fee,
        fee_type: "taker",
        order_type: i % 2 === 0 ? "market" : "limit",
        tx_sig: txSig,
        event_id,
        raw: { source: "mock", walletAddress },
        tags: ["sync", "mock"]
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
