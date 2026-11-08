# Graph Report - trading-journal  (2026-11-08)

## Corpus Check
- Corpus is ~15,924 words - fits in a single context window. You may not need a graph.

## Summary
- 317 nodes · 862 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- PDF Report Kit
- Analytics Page
- App Shell & Layout
- Trade Form & Combobox
- Dev Dependencies
- Accounts Manager
- Runtime Dependencies
- TypeScript Config
- PWA & Next
- Vitest Setup
- Tailwind Config
- NPM Scripts
- Next Config
- PostCSS Config

## God Nodes (most connected - your core abstractions)
1. `cn()` - 36 edges
2. `PdfCanvas` - 27 edges
3. `AnalyticsPage()` - 23 edges
4. `Combobox()` - 21 edges
5. `react` - 20 edges
6. `TradeForm()` - 18 edges
7. `downloadReportPdf()` - 18 edges
8. `Button` - 16 edges
9. `renderOverview()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AnalyticsPage()` --calls--> `useAccounts()`  [EXTRACTED]
  src/app/analytics/page.tsx → src/components/accounts-provider.tsx
- `AnalyticsPage()` --calls--> `Combobox()`  [EXTRACTED]
  src/app/analytics/page.tsx → src/components/ui/combobox.tsx
- `AnalyticsPage()` --calls--> `downloadReportPdf()`  [EXTRACTED]
  src/app/analytics/page.tsx → src/lib/pdf-report.ts
- `AnalyticsPage()` --calls--> `cn()`  [EXTRACTED]
  src/app/analytics/page.tsx → src/lib/utils.ts
- `saveReport()` --calls--> `downloadReportPdf()`  [EXTRACTED]
  src/app/analytics/page.tsx → src/lib/pdf-report.ts

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "PDF Report Kit"
Cohesion: 0.09
Nodes (39): jspdf@^4.2.1, jspdf, Bar, Cell, cellText(), COLORS, Column, PAGE (+31 more)

### Community 1 - "Analytics Page"
Cohesion: 0.08
Nodes (52): date-fns, AnalyticsPage(), exportCsv(), saveReport(), Card(), CHART_OPTIONS, ChartView, Donut() (+44 more)

### Community 2 - "App Shell & Layout"
Cohesion: 0.11
Nodes (30): lucide-react, react, @supabase/supabase-js, metadata, RootLayout(), viewport, AccountSwitcher(), AccountsContext (+22 more)

### Community 3 - "Trade Form & Combobox"
Cohesion: 0.18
Nodes (22): Segmented(), TradeForm(), submit(), Combobox(), ComboboxOption, ComboboxProps, Dot(), Command (+14 more)

### Community 4 - "Dev Dependencies"
Cohesion: 0.11
Nodes (26): devDependencies, autoprefixer@^10.4.20, jsdom@^29.1.1, postcss@^8.4.49, prettier@^3.9.10, prettier-plugin-tailwindcss@^0.8.1, @testing-library/dom@^10.4.2, @testing-library/react@^16.3.3 (+18 more)

### Community 5 - "Accounts Manager"
Cohesion: 0.18
Nodes (15): AccountEditor(), AccountRow(), AccountsManager(), ColorPicker(), Ctx, Dialog, DialogContent(), DialogDescription (+7 more)

### Community 6 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, cmdk@^1.1.1, date-fns@^4.1.0, lucide-react@^0.468.0, @radix-ui/react-dialog@^1.1.4, @radix-ui/react-popover@^1.3.1 (+11 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "PWA & Next"
Cohesion: 0.29
Nodes (3): next@^16.0.0, next, ALLOWED_SIZES

### Community 9 - "Vitest Setup"
Cohesion: 0.29
Nodes (6): vite-tsconfig-paths@^6.1.1, @vitejs/plugin-react@^6.2.1, vitest@^4.1.12, vite-tsconfig-paths, @vitejs/plugin-react, vitest

### Community 10 - "Tailwind Config"
Cohesion: 0.33
Nodes (5): tailwindcss-animate@^1.0.7, tailwindcss@^3.4.17, tailwindcss, tailwindcss-animate, config

### Community 11 - "NPM Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, start, test, typecheck

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App Shell & Layout` to `Analytics Page`, `Trade Form & Combobox`, `Dev Dependencies`, `Accounts Manager`, `Runtime Dependencies`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `PDF Report Kit` be split into smaller, more focused modules?**
  _Cohesion score 0.08548168249660787 - nodes in this community are weakly interconnected._
- **Why does `downloadReportPdf()` connect `PDF Report Kit` to `Analytics Page`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `Analytics Page` be split into smaller, more focused modules?**
  _Cohesion score 0.08090957165520889 - nodes in this community are weakly interconnected._
- **Should `App Shell & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.10963455149501661 - nodes in this community are weakly interconnected._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._