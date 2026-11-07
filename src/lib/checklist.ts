// The rules Lubna ticks off on every trade.
// To change a rule, edit the label here. Keep each `id` the same so old trades stay intact.
export const CHECKLIST = [
  { id: "trend", label: "Follow Trend" },
  { id: "stoploss", label: "Use Stoploss" },
  { id: "risk", label: "Risk 1–2%" },
  { id: "overtrading", label: "Avoid Overtrading" },
  { id: "breakout", label: "Wait for Breakout" },
  { id: "volume", label: "Trade High Volume" },
  { id: "revenge", label: "No Revenge Trades" },
  { id: "journal", label: "Journal Every Trade" },
] as const;

export const emptyChecklist = (): Record<string, boolean> =>
  Object.fromEntries(CHECKLIST.map((c) => [c.id, false]));
