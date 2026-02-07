import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { ThemeProvider } from "./themeStore";
import { AuthProvider } from "./authProvider";
import { StorageProvider } from "../lib/storage/repositories";
import { SolanaWalletProvider } from "../lib/solana/wallet";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SolanaWalletProvider>
          <StorageProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </StorageProvider>
        </SolanaWalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
