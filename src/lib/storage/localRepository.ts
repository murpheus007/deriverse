import type { StorageRepository } from "./repositories";
import { readStorage, writeStorage } from "./localStorage";
import type { Account, ImportRow } from "../../types/db";
import type { FillAnnotation, FillFilters, TradeFill, TradeFillInsert } from "../../types/trades";
import type { JournalEntry, JournalEntryUpsert } from "../../types/journal";
import { applyFillFiltersLocal } from "./filterUtils";
import { buildEventId } from "../sync/hash";

const ACCOUNTS_KEY = "da_accounts";
const IMPORTS_KEY = "da_imports";
const FILLS_KEY = "da_fills";
const ANNOTATIONS_KEY = "da_annotations";
const JOURNAL_KEY = "da_journal_entries";

const buildId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

type AnnotationStore = Record<string, FillAnnotation>;

export function createLocalRepository(getUserId: () => string | null): StorageRepository {
  return {
    async getAccounts() {
      return readStorage<Account[]>(ACCOUNTS_KEY, []);
    },
    async addAccount(input) {
      const userId = getUserId() ?? "local-user";
      const accounts = readStorage<Account[]>(ACCOUNTS_KEY, []);
      const exists = accounts.some(
        (acc) => acc.chain === input.chain && acc.walletAddress === input.wallet_address
      );
      if (exists) {
        throw new Error("Wallet already linked to another profile.");
      }
      const next: Account = {
        id: buildId("acct"),
        userId,
        chain: input.chain,
        walletAddress: input.wallet_address,
        label: input.label ?? null,
        createdAt: new Date().toISOString(),
        lastSyncedAt: null,
        lastSyncedSig: null,
        syncStatus: "idle",
        syncError: null,
        updatedAt: new Date().toISOString()
      };
      writeStorage(ACCOUNTS_KEY, [next, ...accounts]);
      return next;
    },
    async getFills(filters: FillFilters) {
      const fills = readStorage<TradeFill[]>(FILLS_KEY, []);
      const filtered = applyFillFiltersLocal(fills, filters);
      const sorted = filtered.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      const limit = filters.limit ?? 10000;
      const offset = filters.offset ?? 0;
      return sorted.slice(offset, offset + limit);
    },
    async insertFills(importId: string | null, fills: TradeFillInsert[]) {
      const existing = readStorage<TradeFill[]>(FILLS_KEY, []);
      const keySet = new Set(
        existing.map((fill) => `${fill.accountId}-${fill.txSig}-${fill.eventId ?? ""}`)
      );
      let inserted = 0;
      let skipped = 0;
      const next = [...existing];
      fills.forEach((fill) => {
        const eventId = fill.eventId ?? buildEventId(fill);
        const key = `${fill.accountId}-${fill.txSig}-${eventId}`;
        if (keySet.has(key)) {
          skipped += 1;
          return;
        }
        keySet.add(key);
        inserted += 1;
        next.push({
          id: buildId("fill"),
          importId,
          accountId: fill.accountId ?? null,
          ts: fill.ts,
          symbol: fill.symbol,
          marketType: fill.marketType,
          side: fill.side,
          qty: fill.qty,
          price: fill.price,
          fee: fill.fee,
          feeType: fill.feeType,
          orderType: fill.orderType,
          txSig: fill.txSig,
          eventId,
          raw: fill.raw ?? null,
          tags: fill.tags ?? []
        });
      });
      writeStorage(FILLS_KEY, next);
      return { inserted, skipped };
    },
    async insertFillsIdempotent(accountId, fills) {
      const withAccount = fills.map((fill) => ({ ...fill, accountId }));
      const importId = withAccount[0]?.importId ?? null;
      return this.insertFills(importId, withAccount);
    },
    async getFillAnnotations(fillId) {
      const store = readStorage<AnnotationStore>(ANNOTATIONS_KEY, {});
      return store[fillId] ?? null;
    },
    async upsertFillAnnotation(input) {
      const store = readStorage<AnnotationStore>(ANNOTATIONS_KEY, {});
      const userId = getUserId() ?? "local-user";
      const current = store[input.fill_id];
      const now = new Date().toISOString();
      const next: FillAnnotation = {
        id: current?.id ?? buildId("annotation"),
        fillId: input.fill_id,
        userId,
        note: input.note ?? null,
        tags: input.tags ?? [],
        createdAt: current?.createdAt ?? now,
        updatedAt: now
      };
      const updated = { ...store, [input.fill_id]: next };
      writeStorage(ANNOTATIONS_KEY, updated);
      return next;
    },
    async listJournalEntries() {
      return readStorage<JournalEntry[]>(JOURNAL_KEY, []);
    },
    async upsertJournalEntry(input: JournalEntryUpsert) {
      const entries = readStorage<JournalEntry[]>(JOURNAL_KEY, []);
      const now = new Date().toISOString();
      const nextEntry: JournalEntry = {
        id: input.id ?? buildId("journal"),
        createdAt: input.id ? entries.find((e) => e.id === input.id)?.createdAt ?? now : now,
        tradeRef: input.tradeRef,
        accountId: input.accountId ?? null,
        title: input.title,
        strategyTag: input.strategyTag,
        mood: input.mood,
        mistakes: input.mistakes,
        lessons: input.lessons,
        screenshotUrls: input.screenshotUrls,
        customTags: input.customTags
      };
      const exists = entries.some((entry) => entry.id === nextEntry.id);
      const next = exists
        ? entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))
        : [nextEntry, ...entries];
      writeStorage(JOURNAL_KEY, next);
      return nextEntry;
    },
    async deleteJournalEntry(id) {
      const entries = readStorage<JournalEntry[]>(JOURNAL_KEY, []);
      writeStorage(
        JOURNAL_KEY,
        entries.filter((entry) => entry.id !== id)
      );
    },
    async createImport(meta) {
      const userId = getUserId() ?? "local-user";
      const imports = readStorage<ImportRow[]>(IMPORTS_KEY, []);
      const next: ImportRow = {
        id: buildId("import"),
        userId,
        sourceType: meta.source_type,
        sourceLabel: meta.source_label ?? null,
        fileHash: meta.file_hash ?? null,
        accountId: meta.account_id ?? null,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      writeStorage(IMPORTS_KEY, [next, ...imports]);
      return next;
    },
    async markImportStatus(importId, status) {
      const imports = readStorage<ImportRow[]>(IMPORTS_KEY, []);
      const next = imports.map((row) =>
        row.id === importId ? { ...row, status } : row
      );
      writeStorage(IMPORTS_KEY, next);
    },
    async updateAccountSyncState(accountId, patch) {
      const accounts = readStorage<Account[]>(ACCOUNTS_KEY, []);
      const next = accounts.map((acct) =>
        acct.id === accountId
          ? {
              ...acct,
              lastSyncedAt: patch.last_synced_at ?? acct.lastSyncedAt ?? null,
              lastSyncedSig: patch.last_synced_sig ?? acct.lastSyncedSig ?? null,
              syncStatus: patch.sync_status ?? acct.syncStatus ?? "idle",
              syncError: patch.sync_error ?? acct.syncError ?? null,
              updatedAt: new Date().toISOString()
            }
          : acct
      );
      writeStorage(ACCOUNTS_KEY, next);
    }
  };
}
