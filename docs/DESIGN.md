# Design
Calm, simple journal UI. Tokens live in `tailwind.config.ts` + `src/app/globals.css` (CSS variables: background, foreground, primary, muted, card, input, profit/loss colors).

## Layout
- Sticky blurred header (brand "Lubna Rahman / Trading Journal", nav, theme toggle, sign out)
- Content `max-w-5xl`, `px-4 sm:px-6`; mobile bottom tab nav

## Components
- `src/components/ui/{button,input,dialog}.tsx` — base primitives
- `trade-card.tsx`, `trade-form.tsx`, `app-shell.tsx`

## Patterns
- Rounded-xl controls, `shadow-soft`, `text-muted-foreground` for secondary text
- Profit/loss via `pnlColor` / `formatPnl` in `src/lib/utils.ts`
- Dark mode: `dark` class on html, persisted in localStorage

## Don'ts
- No hardcoded colors; use tokens

## Trade card (src/components/trade-card.tsx)
- Win = green, loss = red: tinted gradient bg, coloured border, P/L pill, numbered badge (1,2,3…). No top strip (rejected).
- Multiple trades per day: header "Add trade" + dashed "Add another trade" under list.

## Accounts
- Header: pill `<select>` (colour dot) + gear -> AccountsManager dialog. Each account has a hex colour (ACCOUNT_COLORS in src/lib/accounts.ts).
- "All accounts" view shows account chip on trade cards and a "By account" card in analytics.

## PDF report (src/lib/pdf-kit.ts)
- A4, 40pt margins, dark navy banner + violet accent, light tint tiles, navy table headers, zebra rows, "Page x of y" footer.
- Colours are RGB constants in `COLORS` (mirror app tokens: violet primary, green win, red loss).
