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
