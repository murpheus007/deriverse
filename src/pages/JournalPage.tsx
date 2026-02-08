import { useMemo, useState } from "react";
import { useFills, useJournalEntries, useUpsertJournalEntry } from "../lib/storage/hooks";
import { JournalForm } from "../components/journal/JournalForm";
import { JournalList } from "../components/journal/JournalList";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { JournalEntry, JournalEntryUpsert } from "../types/journal";
import { useAuth } from "../app/authProvider";
import { useActiveAccountStore } from "../lib/storage/activeAccount";

export function JournalPage() {
  const { accountId } = useActiveAccountStore();
  const { data: fills = [] } = useFills({ accountId, limit: 10000 });
  const { data: entries = [] } = useJournalEntries();
  const saveJournal = useUpsertJournalEntry();
  const { primaryWallet } = useAuth();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState("");

  const scopedEntries = useMemo(() => {
    const walletId = primaryWallet?.walletId ?? null;
    if (accountId) {
      return entries.filter((entry) => {
        if (entry.accountId) return entry.accountId === accountId;
        return walletId ? entry.walletId === walletId : true;
      });
    }
    if (walletId) {
      return entries.filter((entry) => entry.walletId === walletId || entry.walletId == null);
    }
    return entries;
  }, [entries, accountId, primaryWallet]);

  const filteredEntries = useMemo(() => {
    if (!search) return scopedEntries;
    const term = search.toLowerCase();
    return scopedEntries.filter((entry) =>
      `${entry.title} ${entry.strategyTag} ${entry.mood} ${entry.customTags.join(" ")}`
        .toLowerCase()
        .includes(term)
    );
  }, [scopedEntries, search]);

  const handleSave = (entry: JournalEntryUpsert) => {
    saveJournal.mutate({ ...entry, walletId: primaryWallet?.walletId ?? null });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-title">Journal</p>
          <p className="text-xs text-slate-400">Document your trades and improve discipline.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing({
            id: "",
            createdAt: "",
            tradeRef: undefined,
            accountId: null,
            title: "",
            strategyTag: "",
            mood: "",
            mistakes: "",
            lessons: "",
            screenshotUrls: [],
            customTags: []
          })}>New Entry</Button>
          <div className=" max-w-xs">
            <Input placeholder="Search journal" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
      </div>

      {editing && (
        <JournalForm
          fills={fills}
          initial={editing.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <JournalList entries={filteredEntries} onEdit={(entry) => setEditing(entry)} />
    </div>
  );
}
