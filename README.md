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
- Email OTP authentication via Supabase.
- RLS enforced tables for all user data.
- Wallet connect is read-only (address only). No private keys or seed phrases are stored.

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

## Supabase Setup (Auth + Data)
1. Create a Supabase project and enable Email OTP in Auth settings.
2. Add your environment values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Copy `.env.example` to `.env` and fill in values.
4. Run the app and sign in at `/login`.

## Wallet Connect + Sync (Mock Provider)
- Connect a Solana wallet (read-only address) in Settings.
- Link the wallet to your profile to enable sync + filtering.
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
- **Auth**: `src/app/authProvider.tsx` handles session state using Supabase email OTP.
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
