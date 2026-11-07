"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISODay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrades } from "@/components/trades-provider";
import { byType, disciplineSplit, groupByDate, inRange, ruleAdherence, summarize } from "@/lib/stats";
import { CHECKLIST } from "@/lib/checklist";
import { TRADE_TYPES } from "@/lib/types";
import { cn, formatPnl, pnlColor } from "@/lib/utils";

type Period = "week" | "month";
const iso = (d: Date) => format(d, "yyyy-MM-dd");

export default function AnalyticsPage() {
  const { trades, loading } = useTrades();
  const [period, setPeriod] = useState<Period>("week");
  const [anchor, setAnchor] = useState<Date | null>(null);

  useEffect(() => setAnchor(new Date()), []);

  const range = useMemo(() => {
    if (!anchor) return null;
    const from = period === "week" ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfMonth(anchor);
    const to = period === "week" ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfMonth(anchor);
    return { from, to, days: eachDayOfInterval({ start: from, end: to }) };
  }, [anchor, period]);

  const scoped = useMemo(() => (range ? inRange(trades, iso(range.from), iso(range.to)) : []), [trades, range]);
  const s = useMemo(() => summarize(scoped), [scoped]);
  const byDay = useMemo(() => groupByDate(scoped), [scoped]);
  const types = useMemo(() => byType(scoped), [scoped]);
  const rules = useMemo(() => ruleAdherence(scoped), [scoped]);
  const split = useMemo(() => disciplineSplit(scoped), [scoped]);

  if (!anchor || !range) return null;

  const label =
    period === "week"
      ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")}`
      : format(range.from, "MMMM yyyy");

  const move = (dir: 1 | -1) => setAnchor(period === "week" ? addWeeks(anchor, dir) : addMonths(anchor, dir));

  const dayNet = range.days.map((d) => ({
    date: d,
    key: iso(d),
    net: (byDay[iso(d)] ?? []).reduce((a, t) => a + t.pnl, 0),
    count: (byDay[iso(d)] ?? []).length,
  }));
  const maxAbs = Math.max(1, ...dayNet.map((d) => Math.abs(d.net)));

  function exportCsv() {
    const head = ["date", "symbol", "type", "direction", "lot", "entry", "stop_loss", "take_profit", "exit", "result", "pnl", "rules_followed", "notes"];
    const rows = [...trades].reverse().map((t) =>
      [
        t.trade_date,
        t.symbol,
        t.trade_type,
        t.direction,
        t.lot_size,
        t.entry_price ?? "",
        t.stop_loss ?? "",
        t.take_profit ?? "",
        t.exit_price ?? "",
        t.result,
        t.pnl,
        CHECKLIST.filter((c) => t.checklist?.[c.id]).length + "/" + CHECKLIST.length,
        `"${(t.notes ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trading-journal-${iso(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Analytics</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{label}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "h-9 rounded-lg px-4 text-sm font-medium capitalize transition-all",
                  period === p ? "bg-card shadow-soft" : "text-muted-foreground"
                )}
              >
                {p === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {/* Success rate + key numbers */}
          <section className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-3xl border bg-card p-6 shadow-soft">
              <Donut wins={s.wins} losses={s.losses} rate={s.winRate} />
              <p className="mt-3 text-sm font-medium">Success rate</p>
              <p className="text-xs text-muted-foreground">
                {s.wins} success · {s.losses} failed{s.breakeven ? ` · ${s.breakeven} breakeven` : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Card label="Total trades" value={String(s.total)} />
              <Card label="Net P/L" value={s.total ? formatPnl(s.net) : "—"} className={pnlColor(s.net)} />
              <Card label="Rules followed" value={s.total ? `${Math.round(s.discipline)}%` : "—"} hint="average" />
              <Card label="Avg win" value={s.wins ? formatPnl(s.avgWin) : "—"} className="text-win" />
              <Card label="Avg loss" value={s.losses ? formatPnl(-s.avgLoss) : "—"} className="text-loss" />
              <Card
                label="Profit factor"
                value={s.profitFactor === null ? "—" : s.profitFactor.toFixed(2)}
                hint="win ÷ loss"
              />
            </div>
          </section>

          {/* Daily P/L */}
          <section className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="mb-5 text-sm font-semibold">Daily result</h2>
            <div className="flex h-44 items-stretch gap-[3px] sm:gap-1.5">
              {dayNet.map((d) => (
                <div key={d.key} className="flex min-w-0 flex-1 flex-col" title={`${format(d.date, "d MMM")}: ${d.count ? formatPnl(d.net) : "no trades"}`}>
                  <div className="flex flex-1 items-end">
                    {d.net > 0 && <div className="w-full rounded-t-md bg-win" style={{ height: `${(d.net / maxAbs) * 100}%`, minHeight: 4 }} />}
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex flex-1 items-start">
                    {d.net < 0 && <div className="w-full rounded-b-md bg-loss" style={{ height: `${(Math.abs(d.net) / maxAbs) * 100}%`, minHeight: 4 }} />}
                  </div>
                  <p className="mt-2 truncate text-center text-[10px] text-muted-foreground">
                    {period === "week" ? format(d.date, "EEE") : format(d.date, "d")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Calendar */}
          <section className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">{period === "week" ? "This week" : "Calendar"}</h2>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
              {Array.from({ length: getISODay(range.from) - 1 }).map((_, i) => (
                <div key={`b${i}`} />
              ))}
              {dayNet.map((d) => (
                <Link
                  key={d.key}
                  href={`/?d=${d.key}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-transform hover:scale-[1.04]",
                    d.count === 0 && "border-transparent bg-muted/50 text-muted-foreground",
                    d.count > 0 && d.net > 0 && "border-win/30 bg-win/15 text-win",
                    d.count > 0 && d.net < 0 && "border-loss/30 bg-loss/15 text-loss",
                    d.count > 0 && d.net === 0 && "bg-muted"
                  )}
                >
                  <span className="text-xs font-semibold sm:text-sm">{format(d.date, "d")}</span>
                  {d.count > 0 && (
                    <span className="hidden text-[10px] font-medium sm:block">{d.count} trade{d.count > 1 ? "s" : ""}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>

          {/* By type + rules */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="mb-4 text-sm font-semibold">By trade type</h2>
              <div className="space-y-4">
                {types.map(({ type, summary }) => (
                  <div key={type}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium">{TRADE_TYPES.find((t) => t.value === type)?.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {summary.total} trades ·{" "}
                        <span className={pnlColor(summary.net)}>{summary.total ? formatPnl(summary.net) : "—"}</span>
                      </span>
                    </div>
                    <Meter pct={summary.winRate} color="bg-win" empty={summary.total === 0} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {summary.total ? `${Math.round(summary.winRate)}% success` : "No trades"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="mb-4 text-sm font-semibold">Rule discipline</h2>
              <div className="space-y-2.5">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <span className="w-36 shrink-0 truncate text-muted-foreground">{r.label}</span>
                    <div className="flex-1">
                      <Meter pct={r.pct} color={r.pct >= 80 ? "bg-win" : r.pct >= 50 ? "bg-primary" : "bg-loss"} empty={s.total === 0} />
                    </div>
                    <span className="w-9 text-right text-xs font-medium tabular-nums">{s.total ? `${Math.round(r.pct)}%` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Insight */}
          {s.total > 0 && (
            <section className="rounded-3xl border bg-primary/[0.07] p-5 sm:p-6">
              <h2 className="text-sm font-semibold">Do the rules pay off?</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Insight title="All rules followed" n={split.full.total} rate={split.full.winRate} net={split.full.net} />
                <Insight title="Some rules skipped" n={split.partial.total} rate={split.partial.winRate} net={split.partial.net} />
              </div>
            </section>
          )}

          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Download backup (CSV)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl", className)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Meter({ pct, color, empty }: { pct: number; color: string; empty?: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      {!empty && <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />}
    </div>
  );
}

function Insight({ title, n, rate, net }: { title: string; n: number; rate: number; net: number }) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {n === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">No trades</p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{Math.round(rate)}% <span className="text-sm font-normal text-muted-foreground">success</span></p>
          <p className="text-xs text-muted-foreground">
            {n} trade{n > 1 ? "s" : ""} · <span className={pnlColor(net)}>{formatPnl(net)}</span>
          </p>
        </>
      )}
    </div>
  );
}

function Donut({ wins, losses, rate }: { wins: number; losses: number; rate: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const has = wins + losses > 0;
  const winLen = has ? (wins / (wins + losses)) * c : 0;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="14" className="stroke-muted" />
        {has && (
          <>
            <circle cx="70" cy="70" r={r} fill="none" strokeWidth="14" className="stroke-loss" strokeDasharray={c} strokeDashoffset={0} />
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              strokeWidth="14"
              strokeLinecap="butt"
              className="stroke-win transition-all duration-700"
              strokeDasharray={`${winLen} ${c}`}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">{has ? `${Math.round(rate)}%` : "—"}</span>
      </div>
    </div>
  );
}
