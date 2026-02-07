import { describe, expect, it } from "vitest";
import { createSupabaseRepository } from "../lib/storage/supabaseRepository";
import type { TypedSupabaseClient } from "../lib/supabase/client";

function createMockSupabase() {
  const inserted: Array<Record<string, unknown>> = [];

  const supabase = {
    from: (table: string) => {
      if (table === "fills") {
        return {
          insert: async (rows: Record<string, unknown>[]) => {
            inserted.push(...rows);
            return { error: null };
          }
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }
  };

  return { supabase, inserted };
}

describe("supabase repository mapping", () => {
  it("adds user_id and maps fill fields", async () => {
    const { supabase, inserted } = createMockSupabase();
    const repo = createSupabaseRepository(supabase as unknown as TypedSupabaseClient, () => "user-1");

    await repo.insertFills("import-1", [
      {
        ts: "2026-01-10T10:00:00.000Z",
        symbol: "DRV/USDC",
        marketType: "perp",
        side: "long",
        qty: 1,
        price: 10,
        fee: 0.1,
        feeType: "taker",
        orderType: "market",
        txSig: "tx-1",
        tags: ["test"],
        accountId: "acct-1"
      }
    ]);

    expect(inserted.length).toBe(1);
    expect(inserted[0].user_id).toBe("user-1");
    expect(inserted[0].market_type).toBe("perp");
    expect(inserted[0].order_type).toBe("market");
    expect(inserted[0].import_id).toBe("import-1");
  });
});
