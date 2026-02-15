import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStorageRepository } from "./repositories";
import { useAuth } from "../../app/authProvider";
import type { FillFilters, TradeFillInsert } from "../../types/trades";
import type { JournalEntryUpsert } from "../../types/journal";

export const queryKeys = {
  accounts: (userId: string | null) => ["accounts", userId] as const,
  fills: (userId: string | null, filters: FillFilters) => ["fills", userId, filters] as const,
  fillAnnotation: (userId: string | null, fillId: string) =>
    ["fill-annotation", userId, fillId] as const,
  journal: (userId: string | null) => ["journal", userId] as const
};

export function useAccounts() {
  const { repository } = useStorageRepository();
  const { userId, authEnabled } = useAuth();
  return useQuery({
    queryKey: queryKeys.accounts(userId),
    queryFn: () => repository.getAccounts(),
    enabled: authEnabled ? Boolean(userId) : true
  });
}

export function useAddAccount() {
  const { repository } = useStorageRepository();
  const { userId } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { chain: "solana"; wallet_address: string; label?: string }) =>
      repository.addAccount(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.accounts(userId) })
  });
}

export function useFills(filters: FillFilters) {
  const { repository } = useStorageRepository();
  const { userId, authEnabled } = useAuth();
  return useQuery({
    queryKey: queryKeys.fills(userId, filters),
    queryFn: () => repository.getFills(filters),
    enabled: authEnabled ? Boolean(userId) : true
  });
}

export function useImportCsv() {
  const { repository } = useStorageRepository();
  const { userId } = useAuth();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fills,
      meta
    }: {
      fills: TradeFillInsert[];
      meta: {
        source_type: "csv" | "manual" | "mock" | "indexer" | "api";
        source_label?: string;
        file_hash?: string;
        account_id?: string | null;
        wallet_id?: string | null;
      };
    }) => {
      const importRow = await repository.createImport(meta);
      try {
        const withImport = fills.map((fill) => ({ ...fill, importId: importRow.id }));
        const result = await repository.insertFillsIdempotent(meta.account_id ?? null, withImport);
        await repository.markImportStatus(importRow.id, "processed");
        return { importRow, ...result };
      } catch (error) {
        await repository.markImportStatus(importRow.id, "failed");
        throw error;
      }
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fills", userId] });
    }
  });
}

export function useFillAnnotation(fillId: string) {
  const { repository } = useStorageRepository();
  const { userId, authEnabled } = useAuth();
  return useQuery({
    queryKey: queryKeys.fillAnnotation(userId, fillId),
    queryFn: () => repository.getFillAnnotations(fillId),
    enabled: Boolean(fillId) && (authEnabled ? Boolean(userId) : true)
  });
}

export function useUpsertFillAnnotation() {
  const { repository } = useStorageRepository();
  const { userId } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { fill_id: string; note?: string; tags?: string[] }) =>
      repository.upsertFillAnnotation(input),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: queryKeys.fillAnnotation(userId, variables.fill_id) });
    }
  });
}

export function useJournalEntries() {
  const { repository } = useStorageRepository();
  const { userId, authEnabled } = useAuth();
  return useQuery({
    queryKey: queryKeys.journal(userId),
    queryFn: () => repository.listJournalEntries(),
    enabled: authEnabled ? Boolean(userId) : true
  });
}

export function useUpsertJournalEntry() {
  const { repository } = useStorageRepository();
  const { userId } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: JournalEntryUpsert) => repository.upsertJournalEntry(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.journal(userId) })
  });
}

export function useDeleteJournalEntry() {
  const { repository } = useStorageRepository();
  const { userId } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.deleteJournalEntry(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.journal(userId) })
  });
}

