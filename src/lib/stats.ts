import { CHECKLIST } from "./checklist";
import type { Trade, TradeType } from "./types";

export interface Summary {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number; // 0..100 (wins / (wins + losses))
  net: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number | null;
  discipline: number; // 0..100 average of checklist completion
}

export function disciplineOf(t: Trade): number {
  const done = CHECKLIST.filter((c) => t.checklist?.[c.id]).length;
  return done / CHECKLIST.length;
}

export function summarize(trades: Trade[]): Summary {
  const wins = trades.filter((t) => t.result === "win");
  const losses = trades.filter((t) => t.result === "loss");
  const breakeven = trades.filter((t) => t.result === "breakeven").length;
  const grossWin = wins.reduce((s, t) => s + Math.abs(t.pnl), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);
  const decided = wins.length + losses.length;
  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven,
    winRate: decided ? (wins.length / decided) * 100 : 0,
    net: trades.reduce((s, t) => s + t.pnl, 0),
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? null : null,
    discipline: trades.length
      ? (trades.reduce((s, t) => s + disciplineOf(t), 0) / trades.length) * 100
      : 0,
  };
}

export function inRange(trades: Trade[], from: string, to: string): Trade[] {
  return trades.filter((t) => t.trade_date >= from && t.trade_date <= to);
}

export function groupByDate(trades: Trade[]): Record<string, Trade[]> {
  const map: Record<string, Trade[]> = {};
  for (const t of trades) (map[t.trade_date] ||= []).push(t);
  return map;
}

export function byType(trades: Trade[]): { type: TradeType; summary: Summary }[] {
  return (["scalping", "intraday", "swing"] as TradeType[]).map((type) => ({
    type,
    summary: summarize(trades.filter((t) => t.trade_type === type)),
  }));
}

export function ruleAdherence(trades: Trade[]): { id: string; label: string; pct: number }[] {
  return CHECKLIST.map((c) => ({
    id: c.id,
    label: c.label,
    pct: trades.length
      ? (trades.filter((t) => t.checklist?.[c.id]).length / trades.length) * 100
      : 0,
  }));
}

/** Compare trades where every rule was followed vs the rest. */
export function disciplineSplit(trades: Trade[]) {
  const full = trades.filter((t) => disciplineOf(t) === 1);
  const partial = trades.filter((t) => disciplineOf(t) < 1);
  return { full: summarize(full), partial: summarize(partial) };
}
