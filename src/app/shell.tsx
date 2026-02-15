import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useThemeStore } from "./themeStore";
import { WalletStatusPill } from "../components/ui/WalletStatusPill";
import { useStorageRepository } from "../lib/storage/repositories";
import { useAuth } from "./authProvider";
import { useAccounts } from "../lib/storage/hooks";
import { useActiveAccountStore } from "../lib/storage/activeAccount";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/trades", label: "Trades" },
  { to: "/journal", label: "Journal" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/calendar", label: "Calendar" },
  { to: "/settings", label: "Settings" }
];

export function AppShell() {
  const { theme } = useThemeStore();
  const { mode } = useStorageRepository();
  const { primaryWallet } = useAuth();
  const { data: accounts = [] } = useAccounts();
  const { accountId, setAccountId } = useActiveAccountStore();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "1";
  const navigate = useNavigate();
  const [showConnectHint, setShowConnectHint] = useState(false);

  useEffect(() => {
    if (accounts.length === 0) {
      if (accountId) setAccountId(null);
      return;
    }
    const currentExists = accountId ? accounts.some((acct) => acct.id === accountId) : false;
    if (accountId && !currentExists) {
      const match = primaryWallet
        ? accounts.find((acct) => acct.walletAddress === primaryWallet.address)
        : null;
      setAccountId(match?.id ?? null);
      return;
    }
    if (!accountId && primaryWallet) {
      const match = accounts.find((acct) => acct.walletAddress === primaryWallet.address);
      if (match) {
        setAccountId(match.id);
      }
    }
  }, [accountId, primaryWallet, accounts, setAccountId]);

  useEffect(() => {
    if (primaryWallet) {
      localStorage.setItem("da_connect_hint_dismissed", "1");
      setShowConnectHint(false);
      return;
    }
    const dismissed = localStorage.getItem("da_connect_hint_dismissed") === "1";
    setShowConnectHint(!dismissed);
  }, [primaryWallet]);

  return (
    <div className="min-h-screen text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="container-app flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src="/deriverse-favicon.ico"
              alt="Deriverse logo"
              className="h-10 w-10 rounded-xl border border-slate-800/60 bg-white/5 p-1"
            />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Deriverse</p>
              <h1 className="text-2xl font-semibold">Deriverse Analytics</h1>
            </div>
            {demoMode && mode === "supabase" && (
              <span className="badge text-[11px] uppercase tracking-wide">Demo data enabled</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <WalletStatusPill />
          </div>
        </div>
      </header>
      {showConnectHint && (
        <div className="fixed left-3 right-3 top-20 z-50 rounded-lg border border-emerald-400/50 bg-emerald-500/15 p-3 text-xs text-emerald-900 shadow-lg backdrop-blur dark:text-emerald-100 sm:left-auto sm:right-6 sm:w-72">
          <div className="absolute -top-1 right-6 h-2 w-2 rotate-45 border-l border-t border-emerald-400/50 bg-emerald-500/15 sm:block" />
          <p className="font-semibold">Demo data loaded</p>
          <p className="mt-1 text-emerald-900/80 dark:text-emerald-100/80">
            You are viewing local mock trades. Connect a wallet to sync real activity.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              className="rounded-md border border-emerald-400/60 bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100"
              onClick={() => navigate("/connect")}
            >
              Connect wallet
            </button>
            <button
              className="text-xs text-emerald-900/70 dark:text-emerald-100/70"
              onClick={() => {
                localStorage.setItem("da_connect_hint_dismissed", "1");
                setShowConnectHint(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="container-app grid gap-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <div className="card px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Navigate</p>
            <nav className="mt-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? theme === "dark"
                          ? "bg-brand-500/20 text-brand-200"
                          : "bg-brand-500/15 text-brand-700"
                        : theme === "dark"
                          ? "text-slate-300 hover:bg-slate-800/70"
                          : "text-slate-700 hover:bg-slate-200/70"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="card px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>{mode === "supabase" ? "Supabase mode" : "Local storage mode"}</p>
              <p>Deriverse chain: Solana</p>
              <p>Latency: 42 ms</p>
            </div>
          </div>
        </aside>
        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
