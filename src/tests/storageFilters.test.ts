import { describe, expect, it } from "vitest";
import { mapUiFiltersToFillFilters, applyFillFiltersLocal } from "../lib/storage/filterUtils";
import type { FilterState } from "../types/filters";
import type { TradeFill } from "../types/trades";

const filters: FilterState = {
  startDate: "2026-01-01",
  endDate: "2026-01-10",
  symbol: "DRV/USDC",
  marketType: "perp",
  side: "long",
  search: ""
};

describe("storage filter utils", () => {
  it("maps UI filters to FillFilters", () => {
    const mapped = mapUiFiltersToFillFilters(filters, "acct-1");
    expect(mapped.symbol).toBe("DRV/USDC");
    expect(mapped.marketType).toBe("perp");
    expect(mapped.side).toBe("long");
    expect(mapped.accountId).toBe("acct-1");
  });

  it("filters fills locally", () => {
    const fills: TradeFill[] = [
      {
        id: "1",
        ts: "2026-01-05T10:00:00.000Z",
        symbol: "DRV/USDC",
        marketType: "perp",
        side: "long",
        qty: 1,
        price: 10,
        fee: 0.1,
        feeType: "taker",
        orderType: "market",
        txSig: "tx-1",
        tags: []
      },
      {
        id: "2",
        ts: "2026-01-05T10:00:00.000Z",
        symbol: "SOL/USDC",
        marketType: "spot",
        side: "short",
        qty: 1,
        price: 10,
        fee: 0.1,
        feeType: "taker",
        orderType: "market",
        txSig: "tx-2",
        tags: []
      }
    ];

    const filtered = applyFillFiltersLocal(fills, {
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-10T00:00:00.000Z",
      symbol: "DRV/USDC"
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].symbol).toBe("DRV/USDC");
  });

  it("filters by account and order type", () => {
    const fills: TradeFill[] = [
      {
        id: "1",
        ts: "2026-01-05T10:00:00.000Z",
        symbol: "DRV/USDC",
        marketType: "perp",
        side: "long",
        qty: 1,
        price: 10,
        fee: 0.1,
        feeType: "taker",
        orderType: "market",
        txSig: "tx-1",
        tags: [],
        accountId: "acct-1"
      },
      {
        id: "2",
        ts: "2026-01-05T10:00:00.000Z",
        symbol: "DRV/USDC",
        marketType: "perp",
        side: "long",
        qty: 1,
        price: 10,
        fee: 0.1,
        feeType: "taker",
        orderType: "limit",
        txSig: "tx-2",
        tags: [],
        accountId: "acct-2"
      }
    ];

    const filtered = applyFillFiltersLocal(fills, {
      accountId: "acct-1",
      orderType: "market"
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].accountId).toBe("acct-1");
  });
});
