export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          chain: "solana";
          wallet_address: string;
          label: string | null;
          created_at: string;
          last_synced_at: string | null;
          last_synced_sig: string | null;
          sync_status: "idle" | "syncing" | "ok" | "error";
          sync_error: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chain: "solana";
          wallet_address: string;
          label?: string | null;
          created_at?: string;
          last_synced_at?: string | null;
          last_synced_sig?: string | null;
          sync_status?: "idle" | "syncing" | "ok" | "error";
          sync_error?: string | null;
          updated_at?: string;
        };
        Update: {
          label?: string | null;
          last_synced_at?: string | null;
          last_synced_sig?: string | null;
          sync_status?: "idle" | "syncing" | "ok" | "error";
          sync_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      imports: {
        Row: {
          id: string;
          user_id: string;
          source_type: "csv" | "manual" | "mock" | "indexer" | "api";
          source_label: string | null;
          file_hash: string | null;
          account_id: string | null;
          status: "pending" | "processed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: "csv" | "manual" | "mock" | "indexer" | "api";
          source_label?: string | null;
          file_hash?: string | null;
          account_id?: string | null;
          status?: "pending" | "processed" | "failed";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "processed" | "failed";
        };
        Relationships: [];
      };
      fills: {
        Row: {
          id: string;
          user_id: string;
          import_id: string | null;
          account_id: string | null;
          ts: string;
          symbol: string;
          market_type: "spot" | "perp" | "options";
          side: "long" | "short";
          qty: number;
          price: number;
          fee: number;
          fee_type: "maker" | "taker" | "funding" | "other";
          order_type: "market" | "limit" | "stop" | "other";
          tx_sig: string;
          event_id: string;
          raw: unknown | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          import_id?: string | null;
          account_id?: string | null;
          ts: string;
          symbol: string;
          market_type: "spot" | "perp" | "options";
          side: "long" | "short";
          qty: number;
          price: number;
          fee: number;
          fee_type: "maker" | "taker" | "funding" | "other";
          order_type: "market" | "limit" | "stop" | "other";
          tx_sig: string;
          event_id: string;
          raw?: unknown | null;
          tags: string[];
          created_at?: string;
        };
        Update: {
          tags?: string[];
          raw?: unknown | null;
        };
        Relationships: [];
      };
      fill_annotations: {
        Row: {
          id: string;
          user_id: string;
          fill_id: string;
          note: string | null;
          tags: string[];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          fill_id: string;
          note?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          note?: string | null;
          tags?: string[];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          trade_ref: string | null;
          title: string;
          strategy_tag: string;
          mood: string;
          mistakes: string;
          lessons: string;
          custom_tags: string[];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          trade_ref?: string | null;
          title: string;
          strategy_tag: string;
          mood: string;
          mistakes: string;
          lessons: string;
          custom_tags?: string[];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          account_id?: string | null;
          trade_ref?: string | null;
          title?: string;
          strategy_tag?: string;
          mood?: string;
          mistakes?: string;
          lessons?: string;
          custom_tags?: string[];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      journal_assets: {
        Row: {
          id: string;
          user_id: string;
          journal_entry_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          journal_entry_id: string;
          url: string;
          created_at?: string;
        };
        Update: {
          url?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
