"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeCard } from "@/components/trade-card";
import { TradeForm } from "@/components/trade-form";
import { useTrades } from "@/components/trades-provider";
import { summarize } from "@/lib/stats";
import type { Trade } from "@/lib/types";
import { cn, formatPnl, pnlColor } from "@/lib/utils";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export default function JournalPage() {
  const { trades, loading, addTrade, updateTrade, deleteTrade } = useTrades();
  const [date, setDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);

  // Set the date on the client (avoids server/browser timezone mismatch). Supports /?d=2026-11-05
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("d");
    setDate(d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : iso(new Date()));
  }, []);

  const dayTrades = useMemo(() => trades.filter((t) => t.trade_date === date), [trades, date]);
  const s = useMemo(() => summarize(dayTrades), [dayTrades]);

  if (!date) return null;

  const today = iso(new Date());
  const isToday = date === today;
  const shift = (n: number) => setDate(iso(addDays(parseISO(date), n)));

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Date navigation */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isToday ? "Today" : format(parseISO(date), "EEEE")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {format(parseISO(date), "d MMMM yyyy")}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <label className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-input bg-card hover:bg-muted">
            <CalendarDays className="h-4 w-4" />
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Pick a date"
            />
          </label>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={openNew} className="ml-1">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add trade</span>
          </Button>
          {!isToday && (
            <Button variant="secondary" size="sm" onClick={() => setDate(today)} className="ml-1 hidden sm:inline-flex">
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Trades" value={String(s.total)} />
        <Stat label="Success" value={String(s.wins)} className="text-win" />
        <Stat label="Failed" value={String(s.losses)} className="text-loss" />
        <Stat label="Net P/L" value={s.total ? formatPnl(s.net) : "—"} className={pnlColor(s.net)} />
      </div>

      {/* Trades */}
      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading your trades…</p>
      ) : dayTrades.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Plus className="h-6 w-6" />
          </div>
          <p className="font-medium">No trades on this day</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Add a trade and tick off the rules you followed.
          </p>
          <Button className="mt-5" onClick={openNew}>
            <Plus className="h-4 w-4" /> Add trade
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {dayTrades.map((t, i) => (
            <TradeCard
              key={t.id}
              index={i + 1}
              trade={t}
              onEdit={() => {
                setEditing(t);
                setFormOpen(true);
              }}
              onDelete={() => {
                if (window.confirm(`Delete this ${t.symbol} trade? This cannot be undone.`)) deleteTrade(t.id);
              }}
            />
          ))}
          <button
            onClick={openNew}
            className="flex w-full items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-border py-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Add another trade
          </button>
        </div>
      )}

      {/* Floating add button */}
      {dayTrades.length > 0 && (
        <button
          onClick={openNew}
          aria-label="Add trade"
          className={cn(
            "fixed bottom-24 right-5 z-20 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95",
            "md:bottom-8 md:right-8 md:h-auto md:w-auto md:gap-2 md:px-6 md:py-3.5 md:rounded-2xl md:flex md:items-center md:text-sm md:font-medium"
          )}
        >
          <Plus className="h-6 w-6 md:h-4 md:w-4" />
          <span className="hidden md:inline">Add trade</span>
        </button>
      )}

      <TradeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        defaultDate={date}
        onSave={(input, id) => (id ? updateTrade(id, input) : addTrade(input))}
      />
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums tracking-tight", className)}>{value}</p>
    </div>
  );
}
