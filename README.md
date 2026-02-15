# Deriverse Analytics

Wallet-aware trading analytics dashboard for Solana.  
The app supports two runtime modes:

- **Demo mode (default first run):** seeds local mock fills and runs fully from localStorage.
- **Wallet-linked mode:** uses Supabase anon auth + wallet signature verification + RLS-scoped data.

## What Is In This Repo

- React 19 + Vite + TypeScript
- Tailwind-based component styling
- TanStack Query + TanStack Table
- Supabase repositories + Edge Functions for wallet link flow
- SQL migrations for wallet auth/linking and mock import source support

## Current Route Map

- Public: `/connect`
- App shell: `/`, `/trades`, `/journal`, `/portfolio`, `/calendar`, `/settings`

## Project Structure

```text
src/
  app/                    # providers, auth context, router, shell
  components/             # UI + feature components
  pages/                  # route pages
  lib/
    analytics/            # pure analytics and derived-trade logic
    storage/              # local + supabase repositories
    sync/                 # mock sync provider pipeline
    supabase/             # typed supabase client
supabase/
  config.toml             # edge function config (verify_jwt flags)
  functions/
    create-nonce/
    verify-wallet-link/
migrations/
  2026_02_07_imports_mock_source.sql
  2026_02_08_wallet_auth.sql
```

## Prerequisites

- Node.js 20+
- npm 10+
- (Optional) Supabase CLI 2.75+
- Phantom wallet extension/app for wallet-link flow

## Local Setup (Demo Mode Only)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create env file:

   ```bash
   cp .env.example .env
   ```

3. Start dev server:

   ```bash
   npm run dev
   ```

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are empty, the app runs local-only.

## Supabase Setup (Wallet Link + RLS Data)

### 1) Create project and enable anonymous auth

- Supabase Dashboard -> **Authentication** -> **Providers** -> enable **Anonymous Sign-Ins**.

### 2) Apply migrations

Run these SQL files in order (SQL editor or migration tool):

1. `migrations/2026_02_07_imports_mock_source.sql`
2. `migrations/2026_02_08_wallet_auth.sql`

`2026_02_08_wallet_auth.sql` assumes base tables already exist:

- `accounts`
- `fills`
- `imports`
- `journal_entries`
- `fill_annotations`

If those tables are not present yet, apply your base schema first.

### 3) Configure frontend env

Set these in `.env` (from `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SOLANA_RPC_URL` (optional override; defaults to Solana devnet)
- `VITE_DEMO_MODE` (`1` keeps demo seeding behavior when not linked)

### 4) Configure Edge Functions

`supabase/config.toml` already contains:

```toml
[functions.create-nonce]
verify_jwt = false

[functions.verify-wallet-link]
verify_jwt = false
```

Create a local function env file if needed:

```bash
cp supabase/.env.example supabase/.env
```

`verify-wallet-link` expects `SERVICE_ROLE_KEY` in function secrets.

Set secrets in your Supabase project:

```bash
supabase secrets set SERVICE_ROLE_KEY=your_service_role_key --project-ref <project_ref>
```

### 5) Deploy Edge Functions

```bash
supabase functions deploy create-nonce --project-ref <project_ref>
supabase functions deploy verify-wallet-link --project-ref <project_ref>
```

### 6) Validate flow

1. Open app and click **Connect Wallet**.
2. Connect Phantom.
3. Sign nonce message.
4. Confirm linked wallet appears in Settings and app data loads/scopes correctly.

## Quality Commands

```bash
npm run lint
npm run test:run
npm run build
```

## Notes For New Developers

- Storage mode is selected automatically in `src/lib/storage/repositories.tsx`.
- Demo seed inserts **100 mock fills** once per browser profile (`da_demo_seeded`).
- Wallet linking logic lives in:
  - client: `src/app/authProvider.tsx`
  - server: `supabase/functions/create-nonce/index.ts`
  - server: `supabase/functions/verify-wallet-link/index.ts`
- Theme toggle and wallet/session controls are in `src/pages/SettingsPage.tsx`.

## Troubleshooting

- **`401 Invalid JWT` on `create-nonce`:**
  - enable Anonymous Sign-Ins in Supabase Auth,
  - verify frontend URL/anon key values,
  - redeploy functions after config changes.

- **Function deploy fails with config parse errors:**
  - keep function config only in `supabase/config.toml`,
  - use `[functions.<name>] verify_jwt = false` blocks (not legacy nested formats).

- **Wallet signs but link fails:**
  - ensure `SERVICE_ROLE_KEY` secret is set,
  - confirm wallet address in request matches signing wallet,
  - check Edge Function logs in Supabase dashboard.
