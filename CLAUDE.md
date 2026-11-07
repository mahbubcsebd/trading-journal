# Trading Journal

Personal trading journal for Lubna Rahman: log trades, rules checklist, analytics.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind 3, Radix Dialog, Supabase (optional; local-storage fallback), npm

## Commands

- dev: npm run dev
- build: npm run build
- typecheck: npm run typecheck
- test (one file): npm run test -- <path>

## Structure

- src/app — pages (journal `/`, `/analytics`), layout
- src/components — app-shell, trade-form, trade-card, providers, ui/
- src/lib — stats, types, supabase client, utils
- supabase/schema.sql — DB schema

## Conventions

- `@/` alias for src; client components use trades-provider (`useTrades`)
- Multi-account: `accounts-provider` (CRUD, active account, `useScopedTrades`); every trade has `account_id`. Seeded: Lubna Rahman, Mahbubur Rahman.
- Header switcher + manager dialog in app-shell; run supabase/schema.sql again to upgrade DB

- Auth: single owner. Cloud mode asks password only (email = NEXT_PUBLIC_OWNER_EMAIL); password lives in Supabase Auth, never in code.
- PWA: src/app/manifest.ts, src/app/pwa-icon/route.tsx (PNG icons), public/sw.js, install-button.tsx

@docs/DESIGN.md

<!-- claude-kit:setup v1 -->
