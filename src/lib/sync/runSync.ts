import type { Account } from "../../types/db";
import type { StorageRepository } from "../storage/repositories";
import type { TradeSyncProvider } from "./provider";
import { MockSyncProvider } from "./provider";
import type { Cursor } from "./types";

export async function runAccountSync(
  account: Account,
  provider: TradeSyncProvider,
  repo: StorageRepository
): Promise<{ inserted: number; skipped: number; nextCursor: Cursor }> {
  await repo.updateAccountSyncState(account.id, { sync_status: "syncing", sync_error: null });
  let importRow: { id: string } | null = null;
  try {
    const isMock = provider instanceof MockSyncProvider;
    importRow = isMock
      ? await repo.createImport({
          source_type: "mock",
          source_label: "Mock Sync",
          account_id: account.id
        })
      : null;
    const { fills, nextCursor } = await provider.fetchNewFills(account.walletAddress, {
      lastSyncedAt: account.lastSyncedAt ?? undefined,
      lastSyncedSig: account.lastSyncedSig ?? undefined
    });

    const { inserted, skipped } = await repo.insertFillsIdempotent(
      account.id,
      fills.map((fill) => ({
        ts: fill.ts,
        symbol: fill.symbol,
        marketType: fill.market_type,
        side: fill.side,
        qty: fill.qty,
        price: fill.price,
        fee: fill.fee,
        feeType: fill.fee_type,
        orderType: fill.order_type,
        txSig: fill.tx_sig,
        eventId: fill.event_id,
        raw: fill.raw,
        tags: fill.tags,
        accountId: account.id,
        importId: importRow?.id ?? null
      }))
    );

    if (importRow) {
      await repo.markImportStatus(importRow.id, "processed");
    }

    await repo.updateAccountSyncState(account.id, {
      sync_status: "ok",
      last_synced_at: nextCursor.lastSyncedAt ?? null,
      last_synced_sig: nextCursor.lastSyncedSig ?? null,
      sync_error: null
    });

    return { inserted, skipped, nextCursor };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    await repo.updateAccountSyncState(account.id, {
      sync_status: "error",
      sync_error: message
    });
    if (importRow) {
      try {
        await repo.markImportStatus(importRow.id, "failed");
      } catch {
        // ignore secondary failures
      }
    }
    throw error;
  }
}
