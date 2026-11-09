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
  { id: "overtrading", label: "No Overtrading" },
  { id: "fomo", label: "No FOMO" },
  { id: "revenge", label: "No Revenge Trades" },
  { id: "entry_confirmation", label: "Entry with Full Confirmation" },
  { id: "journal", label: "Journal Every Trade" },
] as const;

export const emptyChecklist = (): Record<string, boolean> =>
  Object.fromEntries(CHECKLIST.map((c) => [c.id, false]));
