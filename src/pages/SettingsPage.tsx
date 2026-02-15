import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Toast } from "../components/ui/Toast";
import { Toggle } from "../components/ui/Toggle";
import {
  useAccounts,
  useAddAccount,
  useFills,
  useImportCsv,
  useJournalEntries
} from "../lib/storage/hooks";
import { generateMockFills } from "../data/mock";
import { parseTradeFillsCsv, buildCsvTemplate } from "../lib/csv/validate";
import { useStorageRepository } from "../lib/storage/repositories";
import { useAuth } from "../app/authProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useActiveAccountStore } from "../lib/storage/activeAccount";
import { MockSyncProvider } from "../lib/sync/provider";
import { runAccountSync } from "../lib/sync/runSync";
import { formatDateTime } from "../lib/utils/dates";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeStore } from "../app/themeStore";

export function SettingsPage() {
  const { repository } = useStorageRepository();
  const { signOut, primaryWallet, linkedWallets } = useAuth();
  const { data: fills = [] } = useFills({ limit: 10000 });
  const { data: journal = [] } = useJournalEntries();
  const { data: accounts = [] } = useAccounts();
  const queryClient = useQueryClient();
  const addAccount = useAddAccount();
  const importCsv = useImportCsv();
  const { disconnect } = useWallet();
  const { accountId, setAccountId } = useActiveAccountStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [csvErrors, setCsvErrors] = useState<{ row: number; field: string; message: string }[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [accountLabel, setAccountLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  const handleSeed = () => {
    const seeded = generateMockFills(40);
    importCsv.mutate({
      fills: seeded.map((fill) => ({
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
        tags: fill.tags,
        accountId,
        walletId: primaryWallet?.walletId ?? null
      })),
      meta: { source_type: "manual", source_label: "seed", account_id: accountId, wallet_id: primaryWallet?.walletId ?? null }
    });
  };

  const handleExport = () => {
    repository.getFills({ limit: 10000 }).then((allFills) => {
      const payload = { fills: allFills, journal };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `deriverse-export-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleCsv = async (file: File) => {
    const text = await file.text();
    const result = parseTradeFillsCsv(text);
    setFileName(file.name);
    setCsvErrors(result.errors);
    if (result.errors.length === 0) {
      setCsvErrors([]);
      importCsv.mutate(
        {
          fills: result.fills.map((fill) => ({ ...fill, accountId, walletId: primaryWallet?.walletId ?? null })),
          meta: { source_type: "csv", source_label: file.name, account_id: accountId, wallet_id: primaryWallet?.walletId ?? null }
        },
        {
          onSuccess: (summary) => {
            setMessage(`Imported ${summary.inserted} fills (${summary.skipped} skipped).`);
          },
          onError: (err) => {
            setError(err instanceof Error ? err.message : "Import failed.");
          }
        }
      );
    }
  };

  const template = useMemo(() => buildCsvTemplate(), []);
  const walletAddress = primaryWallet?.address ?? null;
  const linkedAddresses = useMemo(() => new Set(accounts.map((acct) => acct.walletAddress)), [accounts]);
  const linkedAccount = accounts.find((acct) => acct.walletAddress === walletAddress) ?? null;
  const activeAccount = accounts.find((acct) => acct.id === accountId);
  const shortAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;
  const walletIdByAddress = useMemo(
    () => new Map(linkedWallets.map((wallet) => [wallet.address, wallet.walletId])),
    [linkedWallets]
  );
  const statusClasses = (status?: string | null) => {
    switch (status) {
      case "syncing":
        return "border-blue-400/50 text-blue-200";
      case "ok":
        return "border-emerald-400/50 text-emerald-200";
      case "error":
        return "border-rose-400/50 text-rose-200";
      default:
        return "border-slate-400/40 text-slate-300";
    }
  };

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <p className="section-title">Wallets & Sync</p>
            <p className="text-xs text-slate-400">Link wallets for sync and filtering.</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {walletAddress && (
            <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
              {!linkedAccount?.label && (
                <div className="w-full md:max-w-xs">
                  <p className="label">Label (optional)</p>
                  <Input value={accountLabel} onChange={(event) => setAccountLabel(event.target.value)} />
                </div>
              )}
              <Button
                variant="secondary"
                className="w-full md:w-auto"
                onClick={() =>
                  addAccount.mutate(
                    { chain: "solana", wallet_address: walletAddress, label: accountLabel || undefined },
                    {
                      onSuccess: (account) => {
                        setMessage(`Wallet ${account.walletAddress} linked for sync.`);
                        setAccountLabel("");
                      },
                      onError: (err) => setError(err instanceof Error ? err.message : "Failed to link wallet.")
                    }
                  )
                }
                disabled={linkedAddresses.has(walletAddress)}
              >
                {linkedAddresses.has(walletAddress) ? "Wallet linked" : "Enable sync for this wallet"}
              </Button>
            </div>
          )}
          <div>
            <p className="label">Linked Wallets</p>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              {accounts.length === 0 && <span>No wallets linked yet.</span>}
              {accounts.map((account) => (
                <div key={account.id} className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-800/60 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 break-words">
                      {account.label ?? shortAddress(account.walletAddress)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Last synced: {account.lastSyncedAt ? formatDateTime(account.lastSyncedAt) : "Never"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`badge ${statusClasses(account.syncStatus ?? "idle")}`}>
                        {account.syncStatus ?? "idle"}
                      </span>
                      {account.syncError && <span className="text-rose-200">{account.syncError}</span>}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full md:w-auto"
                    onClick={async () => {
                      setSyncingAccountId(account.id);
                      try {
                        const provider = new MockSyncProvider();
                        const walletId = walletIdByAddress.get(account.walletAddress) ?? null;
                        const result = await runAccountSync(account, provider, repository, walletId);
                        setMessage(`Synced ${result.inserted} fills (${result.skipped} skipped).`);
                        await queryClient.invalidateQueries({ queryKey: ["accounts"] });
                        await queryClient.invalidateQueries({ queryKey: ["fills"] });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Sync failed.");
                      } finally {
                        setSyncingAccountId(null);
                      }
                    }}
                    disabled={syncingAccountId === account.id}
                  >
                    {syncingAccountId === account.id ? "Syncing..." : "Sync now"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Set active wallet for filtering</p>
            <Select value={accountId ?? ""} onChange={(event) => setAccountId(event.target.value || null)}>
              <option value="">All wallets</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label ?? account.walletAddress}
                </option>
              ))}
            </Select>
            {activeAccount && (
              <p className="mt-1 text-xs text-slate-400 break-words">
                Active: {activeAccount.label ?? activeAccount.walletAddress}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <p className="section-title">Data Management</p>
            <p className="text-xs text-slate-400">Import, export, and seed data</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button onClick={handleSeed} className="w-full sm:w-auto">Seed Mock Fills</Button>
            <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">Export JSON</Button>
          </div>
          <div
            className={`rounded-xl border border-dashed p-5 transition ${
              isDragging ? "border-brand-400 bg-brand-500/10" : "border-slate-700 bg-slate-900/60"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) handleCsv(file);
            }}
          >
            <p className="text-sm text-slate-300">CSV Import</p>
            <p className="text-xs text-slate-500">Expected headers:</p>
            <p
              className="mt-1 break-all rounded-md border px-2 py-1 font-mono text-[11px] leading-relaxed"
              style={{
                background: "var(--surface-muted)",
                color: "var(--text)",
                borderColor: "var(--border)"
              }}
            >
              {template.split("\n")[0]}
            </p>
            <div className="mt-3 flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
              <Input type="file" accept=".csv" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleCsv(file);
              }} />
              {fileName && <p className="break-all text-xs text-slate-400">Loaded: {fileName}</p>}
            </div>
          </div>
          {csvErrors.length > 0 && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
              <p className="text-sm font-semibold text-rose-200">CSV Errors</p>
              <ul className="mt-2 space-y-1 text-xs text-rose-100">
                {csvErrors.slice(0, 8).map((error) => (
                  <li key={`${error.row}-${error.field}`}>Row {error.row} - {error.field}: {error.message}</li>
                ))}
                {csvErrors.length > 8 && <li>+ {csvErrors.length - 8} more...</li>}
              </ul>
            </div>
          )}
          {message && <Toast variant="success" message={message} onClose={() => setMessage(null)} />}
          {error && <Toast variant="error" message={error} onClose={() => setError(null)} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <p className="section-title">Preferences</p>
            <p className="text-xs text-slate-400">Local-only settings</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="label">Theme</p>
              <Toggle label="Dark Mode" checked={theme === "dark"} onChange={toggleTheme} />
            </div>
            <div>
              <p className="label">Linked wallets</p>
              <p className="text-sm text-slate-300">{linkedWallets.length} connected</p>
            </div>
            <div>
              <p className="label">Journal entries</p>
              <p className="text-sm text-slate-300">{journal.length} entries stored</p>
            </div>
            <div>
              <p className="label">Fills stored</p>
              <p className="text-sm text-slate-300">{fills.length} fills stored</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
