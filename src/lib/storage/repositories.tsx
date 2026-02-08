import { createContext, useContext, useEffect, useMemo } from "react";
import type { Account, ImportRow } from "../../types/db";
import type {
  FillAnnotation,
  FillFilters,
  TradeFill,
  TradeFillInsert
} from "../../types/trades";
import type { JournalEntry, JournalEntryUpsert } from "../../types/journal";
import { supabase, supabaseEnabled } from "../supabase/client";
import { useAuth } from "../../app/authProvider";
import { createLocalRepository } from "./localRepository";
import { createSupabaseRepository } from "./supabaseRepository";
import { readStorage } from "./localStorage";
import { generateMockFills } from "../../data/mock";

export interface StorageRepository {
  getAccounts(): Promise<Account[]>;
  addAccount(input: { chain: "solana"; wallet_address: string; label?: string }): Promise<Account>;
  getFills(filters: FillFilters): Promise<TradeFill[]>;
  insertFills(
    importId: string | null,
    fills: TradeFillInsert[]
  ): Promise<{ inserted: number; skipped: number }>;
  insertFillsIdempotent(
    accountId: string | null,
    fills: TradeFillInsert[]
  ): Promise<{ inserted: number; skipped: number }>;
  getFillAnnotations(fillId: string): Promise<FillAnnotation | null>;
  upsertFillAnnotation(input: { fill_id: string; note?: string; tags?: string[] }): Promise<FillAnnotation>;
  listJournalEntries(): Promise<JournalEntry[]>;
  upsertJournalEntry(input: JournalEntryUpsert): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<void>;
  createImport(meta: {
    source_type: "csv" | "manual" | "mock" | "indexer" | "api";
    source_label?: string;
    file_hash?: string;
    account_id?: string | null;
    wallet_id?: string | null;
  }): Promise<ImportRow>;
  markImportStatus(importId: string, status: "processed" | "failed"): Promise<void>;
  updateAccountSyncState(
    accountId: string,
    patch: {
      last_synced_at?: string | null;
      last_synced_sig?: string | null;
      sync_status?: "idle" | "syncing" | "ok" | "error";
      sync_error?: string | null;
    }
  ): Promise<void>;
}

export type RepositoryMode = "local" | "supabase";

type StorageContextValue = {
  repository: StorageRepository;
  mode: RepositoryMode;
};

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { userId, linkedWallets } = useAuth();
  const hasLinkedWallet = linkedWallets.length > 0;
  const mode: RepositoryMode =
    supabaseEnabled && supabase && hasLinkedWallet ? "supabase" : "local";

  const repository = useMemo<StorageRepository>(() => {
    const getUserId = () => userId;
    if (mode === "supabase" && supabase) {
      return createSupabaseRepository(supabase, getUserId);
    }
    return createLocalRepository(getUserId);
  }, [mode, userId]);

  useEffect(() => {
    if (mode !== "local") return;
    const seededFlag = localStorage.getItem("da_demo_seeded");
    if (seededFlag === "1") return;
    const existing = readStorage<TradeFill[]>("da_fills", []);
    if (existing.length > 0) {
      localStorage.setItem("da_demo_seeded", "1");
      return;
    }

    const seed = generateMockFills(50).map((fill) => ({
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
      raw: { source: "demo" },
      tags: [...(fill.tags ?? []), "demo"]
    }));

    (async () => {
      const importRow = await repository.createImport({
        source_type: "mock",
        source_label: "Demo seed"
      });
      await repository.insertFills(importRow.id, seed);
      await repository.markImportStatus(importRow.id, "processed");
      localStorage.setItem("da_demo_seeded", "1");
    })();
  }, [mode, repository]);

  return (
    <StorageContext.Provider value={{ repository, mode }}>{children}</StorageContext.Provider>
  );
}

export function useStorageRepository() {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("StorageProvider is missing");
  }
  return ctx;
}
