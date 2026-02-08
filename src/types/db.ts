export type Account = {
  id: string;
  userId: string;
  chain: "solana";
  walletAddress: string;
  label?: string | null;
  createdAt: string;
  lastSyncedAt?: string | null;
  lastSyncedSig?: string | null;
  syncStatus?: "idle" | "syncing" | "ok" | "error";
  syncError?: string | null;
  updatedAt?: string;
};

export type Wallet = {
  id: string;
  address: string;
  createdAt: string;
};

export type UserWallet = {
  userId: string;
  walletId: string;
  label?: string | null;
  isPrimary: boolean;
  createdAt: string;
};

export type LinkedWallet = {
  walletId: string;
  address: string;
  label?: string | null;
  isPrimary: boolean;
};

export type ImportRow = {
  id: string;
  userId: string;
  sourceType: "csv" | "manual" | "mock" | "indexer" | "api";
  sourceLabel?: string | null;
  fileHash?: string | null;
  accountId?: string | null;
  walletId?: string | null;
  status: "pending" | "processed" | "failed";
  createdAt: string;
};

