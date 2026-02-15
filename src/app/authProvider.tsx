import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "../lib/supabase/client";
import type { LinkedWallet } from "../types/db";

type NonceResponse = {
  nonce: string;
  message: string;
  expires_at: string;
};

type VerifyResponse = {
  wallet_id: string;
  address: string;
  label: string | null;
  is_primary: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  authEnabled: boolean;
  linkedWallets: LinkedWallet[];
  primaryWallet: LinkedWallet | null;
  ensureSession: () => Promise<Session | null>;
  refreshLinkedWallets: () => Promise<void>;
  createNonce: (walletAddress: string) => Promise<NonceResponse>;
  verifyWalletLink: (input: {
    walletAddress: string;
    nonce: string;
    message: string;
    signature: string;
  }) => Promise<LinkedWallet>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = useRef(false);
  const lastUserRef = useRef<string | null>(null);
  const lastFetchRef = useRef(0);

  const ensureSession = useCallback(async () => {
    if (!supabaseEnabled || !supabase) {
      return null;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession((prev) =>
        prev?.access_token === data.session?.access_token ? prev : data.session
      );
      return data.session;
    }
    const { data: anonData, error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw new Error(error.message);
    }
    setSession((prev) =>
      prev?.access_token === anonData.session?.access_token ? prev : anonData.session ?? null
    );
    return anonData.session ?? null;
  }, []);

  const fetchLinkedWallets = useCallback(async (userId: string) => {
    if (!supabaseEnabled || !supabase) {
      setLinkedWallets([]);
      return;
    }
    if (!userId) {
      setLinkedWallets([]);
      return;
    }

    const now = Date.now();
    if (fetchingRef.current) return;
    if (lastUserRef.current === userId && now - lastFetchRef.current < 1500) return;

    fetchingRef.current = true;
    lastUserRef.current = userId;
    lastFetchRef.current = now;

    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("wallet_id,label,is_primary, wallets:wallets(address)")
        .eq("user_id", userId);
      if (error) {
        setLinkedWallets([]);
        return;
      }

      const rows = (data ?? []) as Array<{
        wallet_id: string;
        label: string | null;
        is_primary: boolean;
        wallets?: { address: string } | null;
      }>;

      const mapped = rows
        .filter((row) => row.wallets?.address)
        .map((row) => ({
          walletId: row.wallet_id,
          address: row.wallets?.address ?? "",
          label: row.label ?? null,
          isPrimary: row.is_primary
        }));

      setLinkedWallets((prev) => {
        const same =
          prev.length === mapped.length &&
          prev.every((wallet, idx) => wallet.walletId === mapped[idx]?.walletId);
        return same ? prev : mapped;
      });
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refreshLinkedWallets = useCallback(async () => {
    if (!supabaseEnabled || !supabase) {
      setLinkedWallets([]);
      return;
    }
    const currentSession = session ?? (await ensureSession());
    const userId = currentSession?.user?.id;
    if (!userId) {
      setLinkedWallets([]);
      return;
    }
    await fetchLinkedWallets(userId);
  }, [session, ensureSession, fetchLinkedWallets]);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    ensureSession()
      .then((sess) => {
        const userId = sess?.user?.id;
        if (userId) {
          return fetchLinkedWallets(userId);
        }
        return undefined;
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const userId = newSession?.user?.id;
      if (userId) {
        fetchLinkedWallets(userId);
      } else {
        setLinkedWallets([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [ensureSession, fetchLinkedWallets]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const userId = user?.id ?? (supabaseEnabled ? null : "local-user");
    const primaryWallet = linkedWallets.find((wallet) => wallet.isPrimary) ?? linkedWallets[0] ?? null;

    return {
      session,
      user,
      userId,
      isLoading,
      authEnabled: supabaseEnabled,
      linkedWallets,
      primaryWallet,
      ensureSession,
      refreshLinkedWallets,
      createNonce: async (walletAddress: string) => {
        if (!supabaseEnabled || !supabase) {
          throw new Error("Supabase is not configured.");
        }
        await ensureSession();
        const { data, error } = await supabase.functions.invoke("create-nonce", {
          body: { wallet_address: walletAddress }
        });
        if (error) {
          throw new Error(error.message);
        }
        return data as NonceResponse;
      },
      verifyWalletLink: async ({ walletAddress, nonce, message, signature }) => {
        if (!supabaseEnabled || !supabase) {
          throw new Error("Supabase is not configured.");
        }
        await ensureSession();
        const { data, error } = await supabase.functions.invoke("verify-wallet-link", {
          body: { wallet_address: walletAddress, nonce, message, signature }
        });
        if (error) {
          throw new Error(error.message);
        }
        const payload = data as VerifyResponse;
        const linked: LinkedWallet = {
          walletId: payload.wallet_id,
          address: payload.address,
          label: payload.label ?? null,
          isPrimary: payload.is_primary
        };
        await refreshLinkedWallets();
        return linked;
      },
      signOut: async () => {
        if (!supabaseEnabled || !supabase) return;
        await supabase.auth.signOut();
        setLinkedWallets([]);
      }
    };
  }, [session, linkedWallets, isLoading, ensureSession, refreshLinkedWallets]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthProvider is missing");
  }
  return ctx;
}
