// The rules Lubna ticks off on every trade.
// To change a rule, edit the label here. Keep each `id` the same so old trades stay intact.
export const CHECKLIST = [
  { id: "candle", label: "Candle Confirmation" },
  { id: "mss", label: "MSS" },
  { id: "displacement", label: "Displacement" },
  { id: "htfpoi", label: "HTF POI" },
  { id: "bias", label: "Follow Bias" },
  { id: "stoploss", label: "Use Stoploss" },
  { id: "rr", label: "RR - 1:3" },
  { id: "entry_confirmation", label: "Entry with Full Confirmation" },
  { id: "journal", label: "Journal Every Trade" },
  // Keeps the old "overtrading" id so past trades that ticked it stay ticked.
  { id: "overtrading", label: "No FOMO, No Overtrading, No Revenge Trades" },
] as const;

export const emptyChecklist = (): Record<string, boolean> =>
  Object.fromEntries(CHECKLIST.map((c) => [c.id, false]));
