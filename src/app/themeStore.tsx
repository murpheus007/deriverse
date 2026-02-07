import { createContext, useContext, useEffect } from "react";
import { create } from "zustand";

type Theme = "dark" | "light";

type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("da_theme") as Theme) || "dark",
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("da_theme", next);
      return { theme: next };
    })
}));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const store = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (store.theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [store.theme]);

  return <ThemeContext.Provider value={store}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("ThemeProvider is missing");
  }
  return ctx;
}
