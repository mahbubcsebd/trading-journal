export type TradeType = "scalping" | "intraday" | "swing";
export type Direction = "buy" | "sell";
export type Result = "win" | "loss" | "breakeven";

export interface Trade {
  id: string;
  trade_date: string; // yyyy-MM-dd
  symbol: string;
  trade_type: TradeType;
  direction: Direction;
  lot_size: number;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  exit_price: number | null;
  result: Result;
  pnl: number; // positive for win, negative for loss
  checklist: Record<string, boolean>;
  notes: string | null;
  created_at: string;
}

export type TradeInput = Omit<Trade, "id" | "created_at">;

export const TRADE_TYPES: { value: TradeType; label: string; hint: string }[] = [
  { value: "scalping", label: "Scalping", hint: "Minutes" },
  { value: "intraday", label: "Intraday", hint: "Same day" },
  { value: "swing", label: "Swing", hint: "Days" },
];
