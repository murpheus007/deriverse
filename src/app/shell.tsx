import { Outlet, NavLink } from "react-router-dom";
import { useThemeStore } from "./themeStore";
import { Toggle } from "../components/ui/Toggle";
import { Button } from "../components/ui/Button";
import { useAuth } from "./authProvider";
import { useStorageRepository } from "../lib/storage/repositories";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/trades", label: "Trades" },
  { to: "/journal", label: "Journal" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/settings", label: "Settings" }
];

export function AppShell() {
  const { theme, toggleTheme } = useThemeStore();
  const { signOut, authEnabled } = useAuth();
  const { mode } = useStorageRepository();
  const demoMode = import.meta.env.VITE_DEMO_MODE === "1";

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
            <Toggle
              label="Dark Mode"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            {authEnabled && (
              <Button variant="secondary" onClick={() => signOut()}>
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>
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
                    `rounded-xl px-3 py-2 text-sm font-medium transition ${
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
