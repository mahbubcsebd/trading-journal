// The rules Lubna ticks off on every trade.
// To change a rule, edit the label here. Keep each `id` the same so old trades stay intact.
export const CHECKLIST = [
  { id: "candle", label: "Candle Confirmation" },
  { id: "mss", label: "Wait for MSS" },
  { id: "displacement", label: "Wait for Displacement" },
  { id: "htfpoi", label: "HTF POI" },
  { id: "bias", label: "Follow Bias" },
  { id: "stoploss", label: "Use Stoploss" },
  { id: "rr", label: "RR - 1:3" },
  { id: "journal", label: "Journal Every Trade" },
] as const;

export const emptyChecklist = (): Record<string, boolean> =>
  Object.fromEntries(CHECKLIST.map((c) => [c.id, false]));
