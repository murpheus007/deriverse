# Deriverse Analytics

A production-quality trading analytics and journal dashboard for the Deriverse Solana ecosystem. This build prioritizes correctness, auditability, and a pluggable ingestion pipeline while keeping the UI fast and deterministic.

## Bounty Alignment
Implemented features mapped to the requested scope:
- PnL tracking + charts + drawdown overlay
- Volume + fees + fee composition breakdown
- Win rate, trade count, avg win/loss, largest win/loss
- Long/short ratio and directional bias
- Average trade duration (derived round-trips)
- Time-based performance (daily + hourly)
- Trade history table + annotations
- Order type performance
- Filters: symbol, date range, market type, side, account

## Accuracy & Methodology
- Idempotent ingestion enforced by unique key: `(account_id, tx_sig, event_id)`.
- Deterministic money math via utility helpers to avoid floating drift.
- Realized PnL is computed from derived round-trip trades grouped from fills.
- Limitation: mock provider uses synthetic fills; no live funding settlement unless included in data.

## Security
- Supabase anonymous sessions power RLS (`auth.uid()`).
- Wallet linking requires a signed nonce (no seed phrases or private keys).
- RLS enforced tables for all user data.

## Innovation
- Pluggable `TradeSyncProvider` architecture for ingestion.
- Mock provider demonstrates the full pipeline and DB persistence.
- Cursor fields (`last_synced_at`, `last_synced_sig`) support incremental sync without UI changes.

## Architecture
```
UI
 └─ Query/State (TanStack Query + Zustand)
     └─ Repository (Supabase | Local)
         ├─ Analytics (pure functions)
         └─ Ingestion (CSV | Mock Sync)
```

## Getting Started
```bash
npm install
npm run dev
```

## Supabase Setup (Wallet Auth + Data)
1. Create a Supabase project.
2. Apply SQL migrations in `/migrations`.
3. Add environment values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy Edge Functions:
   - `supabase/functions/create-nonce`
   - `supabase/functions/verify-wallet-link`
5. In Supabase Functions env, set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Run the app and connect a wallet at `/connect`.

## Wallet Connect + Sync (Mock Provider)
- Visit `/connect` to link a Solana wallet by signing a nonce.
- Enable sync for the linked wallet in Settings.
- Sync inserts are labeled as `source_type = 'mock'` in `imports` for auditability.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build
- `npm run lint` - lint code
- `npm run format` - format code
- `npm run test` - run vitest in watch mode
- `npm run test:run` - run tests once

## Architecture Notes
- **Repository provider**: `src/lib/storage` exposes a provider-backed `StorageRepository` interface and swaps between localStorage and Supabase automatically based on env vars.
- **Auth**: `src/app/authProvider.tsx` ensures an anonymous Supabase session and links wallets via edge functions.
- **Analytics engine**: `src/lib/analytics` contains pure functions for metrics and breakdowns. All analytics are deterministic and derived from fills.
- **CSV import**: `src/lib/csv` handles parsing and validation with Zod and returns detailed error reports.
- **Mock data**: `src/data/mock.ts` generates realistic fill pairs for quick demos.
- **Design system**: `src/components/ui` includes reusable cards, inputs, buttons, badges, and drawers.

## Local Persistence (fallback)
- When Supabase env vars are missing, the app falls back to localStorage (`da_fills`, `da_journal`, `da_annotations`).

## Future Work (Not in Scope)
- Replace mock sync with a real Deriverse event decoder or indexer pipeline.
- Add pagination for large fills datasets.
- Materialize derived trades server-side for analytics at scale.
