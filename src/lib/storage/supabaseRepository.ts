import type { StorageRepository } from "./repositories";
import type { TypedSupabaseClient } from "../supabase/client";
import type { Account, ImportRow } from "../../types/db";
import type { FillAnnotation, FillFilters, TradeFill, TradeFillInsert } from "../../types/trades";
import type { JournalEntry, JournalEntryUpsert } from "../../types/journal";
import type { Database } from "../../types/supabase";
import { buildEventId } from "../sync/hash";

const BATCH_SIZE = 500;

function requireUserId(getUserId: () => string | null): string {
  const userId = getUserId();
  if (!userId) {
    throw new Error("You must be signed in to access this data.");
  }
  return userId;
}

function mapFillRow(row: Database["public"]["Tables"]["fills"]["Row"]): TradeFill {
  return {
    id: row.id,
    ts: row.ts,
    symbol: row.symbol,
    marketType: row.market_type,
    side: row.side,
    qty: row.qty,
    price: row.price,
    fee: row.fee,
    feeType: row.fee_type,
    orderType: row.order_type,
    txSig: row.tx_sig,
    eventId: row.event_id,
    raw: row.raw,
    tags: row.tags ?? [],
    importId: row.import_id,
    accountId: row.account_id
  };
}

function mapAccountRow(row: Database["public"]["Tables"]["accounts"]["Row"]): Account {
  return {
    id: row.id,
    userId: row.user_id,
    chain: row.chain,
    walletAddress: row.wallet_address,
    label: row.label,
    createdAt: row.created_at,
    lastSyncedAt: row.last_synced_at,
    lastSyncedSig: row.last_synced_sig,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
    updatedAt: row.updated_at
  };
}

function mapImportRow(row: Database["public"]["Tables"]["imports"]["Row"]): ImportRow {
  return {
    id: row.id,
    userId: row.user_id,
    sourceType: row.source_type,
    sourceLabel: row.source_label,
    fileHash: row.file_hash,
    accountId: row.account_id,
    status: row.status,
    createdAt: row.created_at
  };
}

function mapAnnotationRow(row: Database["public"]["Tables"]["fill_annotations"]["Row"]): FillAnnotation {
  return {
    id: row.id,
    fillId: row.fill_id,
    userId: row.user_id,
    note: row.note ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapJournalRow(
  row: Database["public"]["Tables"]["journal_entries"]["Row"],
  assets: Database["public"]["Tables"]["journal_assets"]["Row"][]
): JournalEntry {
  const urls = assets.map((asset) => asset.url);
  return {
    id: row.id,
    createdAt: row.created_at,
    tradeRef: row.trade_ref ?? undefined,
    accountId: row.account_id ?? null,
    title: row.title,
    strategyTag: row.strategy_tag,
    mood: row.mood,
    mistakes: row.mistakes,
    lessons: row.lessons,
    screenshotUrls: urls,
    customTags: row.custom_tags ?? []
  };
}

export function createSupabaseRepository(
  supabase: TypedSupabaseClient,
  getUserId: () => string | null
): StorageRepository {
  return {
    async getAccounts() {
      const userId = requireUserId(getUserId);
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapAccountRow);
    },
    async addAccount(input) {
      const userId = requireUserId(getUserId);
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          chain: input.chain,
          wallet_address: input.wallet_address,
          label: input.label ?? null
        })
        .select("*")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Wallet already linked to another profile.");
        }
        throw new Error(error.message);
      }
      return mapAccountRow(data);
    },
    async getFills(filters) {
      const userId = requireUserId(getUserId);
      // Note: pagination can be added later via range() or cursor-based queries.
      let query = supabase
        .from("fills")
        .select("*")
        .eq("user_id", userId)
        .order("ts", { ascending: false });

      const limit = filters.limit ?? 10000;
      if (filters.offset !== undefined) {
        query = query.range(filters.offset, filters.offset + limit - 1);
      } else {
        query = query.limit(limit);
      }

      if (filters.from) query = query.gte("ts", filters.from);
      if (filters.to) query = query.lte("ts", filters.to);
      if (filters.symbol) query = query.eq("symbol", filters.symbol);
      if (filters.marketType) query = query.eq("market_type", filters.marketType);
      if (filters.side) query = query.eq("side", filters.side);
      if (filters.accountId) query = query.eq("account_id", filters.accountId);
      if (filters.orderType) query = query.eq("order_type", filters.orderType);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapFillRow);
    },
    async insertFills(importId, fills) {
      const userId = requireUserId(getUserId);
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < fills.length; i += BATCH_SIZE) {
        const batch = fills.slice(i, i + BATCH_SIZE).map((fill) => ({
          user_id: userId,
          import_id: importId,
          account_id: fill.accountId ?? null,
          ts: fill.ts,
          symbol: fill.symbol,
          market_type: fill.marketType,
          side: fill.side,
          qty: fill.qty,
          price: fill.price,
          fee: fill.fee,
          fee_type: fill.feeType,
          order_type: fill.orderType,
          tx_sig: fill.txSig,
          event_id: fill.eventId ?? buildEventId(fill),
          raw: fill.raw ?? null,
          tags: fill.tags ?? []
        }));

        const { error } = await supabase.from("fills").insert(batch);
        if (error) {
          throw new Error(error.message);
        }
        inserted += batch.length;
      }

      return { inserted, skipped };
    },
    async insertFillsIdempotent(accountId, fills) {
      const userId = requireUserId(getUserId);
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < fills.length; i += BATCH_SIZE) {
        const batch = fills.slice(i, i + BATCH_SIZE).map((fill) => ({
          user_id: userId,
          import_id: fill.importId ?? null,
          account_id: accountId,
          ts: fill.ts,
          symbol: fill.symbol,
          market_type: fill.marketType,
          side: fill.side,
          qty: fill.qty,
          price: fill.price,
          fee: fill.fee,
          fee_type: fill.feeType,
          order_type: fill.orderType,
          tx_sig: fill.txSig,
          event_id: fill.eventId ?? buildEventId(fill),
          raw: fill.raw ?? null,
          tags: fill.tags ?? []
        }));

        const { data, error } = await supabase
          .from("fills")
          .upsert(batch, {
            onConflict: "account_id,tx_sig,event_id",
            ignoreDuplicates: true
          })
          .select("id");
        if (error) throw new Error(error.message);
        const batchInserted = data?.length ?? 0;
        inserted += batchInserted;
        skipped += batch.length - batchInserted;
      }

      return { inserted, skipped };
    },
    async getFillAnnotations(fillId) {
      const userId = requireUserId(getUserId);
      const { data, error } = await supabase
        .from("fill_annotations")
        .select("*")
        .eq("user_id", userId)
        .eq("fill_id", fillId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapAnnotationRow(data) : null;
    },
    async upsertFillAnnotation(input) {
      const userId = requireUserId(getUserId);
      const { data, error } = await supabase
        .from("fill_annotations")
        .upsert({
          user_id: userId,
          fill_id: input.fill_id,
          note: input.note ?? null,
          tags: input.tags ?? [],
          updated_at: new Date().toISOString()
        }, { onConflict: "fill_id,user_id" })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapAnnotationRow(data);
    },
    async listJournalEntries() {
      const userId = requireUserId(getUserId);
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const entries = data ?? [];
      const ids = entries.map((row) => row.id);
      let assets: Database["public"]["Tables"]["journal_assets"]["Row"][] = [];
      if (ids.length > 0) {
        const assetsResponse = await supabase
          .from("journal_assets")
          .select("*")
          .eq("user_id", userId)
          .in("journal_entry_id", ids);
        if (assetsResponse.error) throw new Error(assetsResponse.error.message);
        assets = assetsResponse.data ?? [];
      }

      const assetsByEntry = new Map<string, Database["public"]["Tables"]["journal_assets"]["Row"][]>();
      assets.forEach((asset) => {
        const list = assetsByEntry.get(asset.journal_entry_id) ?? [];
        assetsByEntry.set(asset.journal_entry_id, [...list, asset]);
      });

      return entries.map((row) => mapJournalRow(row, assetsByEntry.get(row.id) ?? []));
    },
    async upsertJournalEntry(input) {
      const userId = requireUserId(getUserId);
      const payload: Database["public"]["Tables"]["journal_entries"]["Insert"] = {
        id: input.id,
        user_id: userId,
        account_id: input.accountId ?? null,
        trade_ref: input.tradeRef ?? null,
        title: input.title,
        strategy_tag: input.strategyTag,
        mood: input.mood,
        mistakes: input.mistakes,
        lessons: input.lessons,
        custom_tags: input.customTags ?? [],
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(payload)
        .select("*")
        .single();
      if (error) throw new Error(error.message);

      await supabase
        .from("journal_assets")
        .delete()
        .eq("user_id", userId)
        .eq("journal_entry_id", data.id);

      if (input.screenshotUrls.length > 0) {
        const assetRows = input.screenshotUrls.map((url) => ({
          user_id: userId,
          journal_entry_id: data.id,
          url
        }));
        const assetInsert = await supabase.from("journal_assets").insert(assetRows);
        if (assetInsert.error) throw new Error(assetInsert.error.message);
      }

      return mapJournalRow(data, input.screenshotUrls.map((url, idx) => ({
        id: `${data.id}-${idx}`,
        user_id: userId,
        journal_entry_id: data.id,
        url,
        created_at: data.created_at
      })));
    },
    async deleteJournalEntry(id) {
      const userId = requireUserId(getUserId);
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    async createImport(meta) {
      const userId = requireUserId(getUserId);
      const { data, error } = await supabase
        .from("imports")
        .insert({
          user_id: userId,
          source_type: meta.source_type,
          source_label: meta.source_label ?? null,
          file_hash: meta.file_hash ?? null,
          account_id: meta.account_id ?? null,
          status: "pending"
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapImportRow(data);
    },
    async markImportStatus(importId, status) {
      const userId = requireUserId(getUserId);
      const { error } = await supabase
        .from("imports")
        .update({ status })
        .eq("user_id", userId)
        .eq("id", importId);
      if (error) throw new Error(error.message);
    },
    async updateAccountSyncState(accountId, patch) {
      const userId = requireUserId(getUserId);
      const { error } = await supabase
        .from("accounts")
        .update({ ...patch })
        .eq("user_id", userId)
        .eq("id", accountId);
      if (error) throw new Error(error.message);
    }
  };
}
