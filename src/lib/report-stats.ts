import { summarize, type Summary } from "./stats";
import type { Trade } from "./types";

export function sortChronological(trades: Trade[]): Trade[] {
  return [...trades].sort(
    (a, b) =>
      a.trade_date.localeCompare(b.trade_date) ||
      a.created_at.localeCompare(b.created_at),
  );
}

/** Largest peak-to-trough fall of the running P/L (returned as a positive number). */
export function maxDrawdown(chronological: Trade[]): number {
  let running = 0;
  let peak = 0;
  let worst = 0;
  for (const t of chronological) {
    running += t.pnl;
    peak = Math.max(peak, running);
    worst = Math.max(worst, peak - running);
  }
  return worst;
}

export function longestStreaks(chronological: Trade[]): {
  win: number;
  loss: number;
} {
  let win = 0;
  let loss = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const t of chronological) {
    curWin = t.result === "win" ? curWin + 1 : 0;
    curLoss = t.result === "loss" ? curLoss + 1 : 0;
    win = Math.max(win, curWin);
    loss = Math.max(loss, curLoss);
  }
  return { win, loss };
}

/** Average planned reward:risk from entry / stop-loss / take-profit, or null if none are complete. */
export function avgPlannedRR(trades: Trade[]): number | null {
  const ratios = trades.flatMap((t) => {
    if (
      t.entry_price === null ||
      t.stop_loss === null ||
      t.take_profit === null
    )
      return [];
    const risk = Math.abs(t.entry_price - t.stop_loss);
    return risk === 0 ? [] : [Math.abs(t.take_profit - t.entry_price) / risk];
  });
  return ratios.length
    ? ratios.reduce((s, r) => s + r, 0) / ratios.length
    : null;
}

export interface GroupSummary {
  key: string;
  summary: Summary;
}

function groupSummaries(
  trades: Trade[],
  keyOf: (t: Trade) => string,
): GroupSummary[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) map.set(keyOf(t), [...(map.get(keyOf(t)) ?? []), t]);
  return [...map.entries()]
    .map(([key, list]) => ({ key, summary: summarize(list) }))
    .sort(
      (a, b) =>
        b.summary.total - a.summary.total || b.summary.net - a.summary.net,
    );
}

export const bySymbol = (trades: Trade[]) =>
  groupSummaries(trades, (t) => t.symbol.trim().toUpperCase() || "—");
export const byDirection = (trades: Trade[]) =>
  groupSummaries(trades, (t) => (t.direction === "buy" ? "Buy" : "Sell"));
