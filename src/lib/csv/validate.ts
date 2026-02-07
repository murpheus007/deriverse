import { z } from "zod";
import type { TradeFillInsert } from "../../types/trades";
import { parseCsv } from "./csv";

const tradeFillSchema = z.object({
  id: z.string().optional(),
  ts: z.string().datetime(),
  symbol: z.string().min(1),
  marketType: z.enum(["spot", "perp", "options"]),
  side: z.enum(["long", "short"]),
  qty: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  fee: z.coerce.number().nonnegative(),
  feeType: z.enum(["maker", "taker", "funding", "other"]),
  orderType: z.enum(["market", "limit", "stop", "other"]),
  txSig: z.string().min(1),
  tags: z.string().optional().default("")
});

export type CsvError = {
  row: number;
  field: string;
  message: string;
};

export type CsvValidationResult = {
  fills: TradeFillInsert[];
  errors: CsvError[];
};

export function parseTradeFillsCsv(text: string): CsvValidationResult {
  const { rows } = parseCsv(text);
  const fills: TradeFillInsert[] = [];
  const errors: CsvError[] = [];

  rows.forEach((row, idx) => {
    const result = tradeFillSchema.safeParse(row);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push({
          row: idx + 2,
          field: issue.path.join("."),
          message: issue.message
        });
      });
      return;
    }
    const data = result.data;
    fills.push({
      ts: data.ts,
      symbol: data.symbol,
      marketType: data.marketType,
      side: data.side,
      qty: data.qty,
      price: data.price,
      fee: data.fee,
      feeType: data.feeType,
      orderType: data.orderType,
      txSig: data.txSig,
      tags: data.tags ? data.tags.split("|").map((tag) => tag.trim()).filter(Boolean) : []
    });
  });

  return { fills, errors };
}

export function buildCsvTemplate(): string {
  return [
    "id,ts,symbol,marketType,side,qty,price,fee,feeType,orderType,txSig,tags",
    "fill-1,2026-01-15T14:12:00.000Z,DRV/USDC,perp,long,2.5,8.32,0.12,taker,market,abc123,breakout|core"
  ].join("\n");
}
