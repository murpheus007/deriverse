import { create } from "zustand";

const STORAGE_KEY = "da_active_account";

type ActiveAccountState = {
  accountId: string | null;
  setAccountId: (id: string | null) => void;
};

export const useActiveAccountStore = create<ActiveAccountState>((set) => ({
  accountId: localStorage.getItem(STORAGE_KEY),
  setAccountId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ accountId: id });
  }
}));
