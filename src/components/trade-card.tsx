"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHECKLIST } from "@/lib/checklist";
import { disciplineOf } from "@/lib/stats";
import { TRADE_TYPES, type Account, type Trade } from "@/lib/types";
import { cn, formatPnl, pnlColor } from "@/lib/utils";

const glow = {
  win: "from-win/[0.22] via-win/[0.06]",
  loss: "from-loss/[0.22] via-loss/[0.06]",
  breakeven: "from-muted-foreground/[0.08] via-transparent",
};
const pill = {
  win: "bg-win/12 text-win ring-win/30",
  loss: "bg-loss/12 text-loss ring-loss/30",
  breakeven: "bg-muted text-muted-foreground ring-border",
};
const edge = { win: "bg-win", loss: "bg-loss", breakeven: "bg-muted-foreground/40" };
const dot = { win: "bg-win", loss: "bg-loss", breakeven: "bg-muted-foreground/50" };
const border = { win: "border-win/40", loss: "border-loss/40", breakeven: "border-border/70" };
const text = { win: "text-win", loss: "text-loss", breakeven: "text-muted-foreground" };
const label = { win: "Success", loss: "Failed", breakeven: "Breakeven" };

export function TradeCard({
  trade: t,
  index,
  account,
  onEdit,
  onDelete,
}: {
  trade: Trade;
  index?: number;
  account?: Account;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const done = CHECKLIST.filter((c) => t.checklist?.[c.id]).length;
  const full = disciplineOf(t) === 1;
  const typeLabel = TRADE_TYPES.find((x) => x.value === t.trade_type)?.label;

  const levels = [
    { k: "Lot", v: t.lot_size },
    { k: "Entry", v: t.entry_price },
    { k: "SL", v: t.stop_loss },
    { k: "TP", v: t.take_profit },
    { k: "Exit", v: t.exit_price },
  ].filter((x) => x.v !== null && x.v !== undefined);

  return (
    <article className={cn("group relative overflow-hidden rounded-[22px] border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_12px_32px_-16px_hsl(var(--foreground)/0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_hsl(var(--foreground)/0.05),0_22px_44px_-18px_hsl(var(--foreground)/0.28)]", border[t.result])}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent", glow[t.result])} />
      <span className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl", edge[t.result])} />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {index !== undefined && (
                <span className={cn("grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold ring-1 ring-inset", pill[t.result])}>
                  {index}
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-tight">{t.symbol}</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset",
                  t.direction === "buy" ? "bg-win/10 text-win ring-win/25" : "bg-loss/10 text-loss ring-loss/25"
                )}
              >
                {t.direction === "buy" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {t.direction}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{typeLabel}</span>
              {account && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-border">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: account.color }} />
                  {account.name}
                </span>
              )}
            </div>
            <p className={cn("mt-1.5 flex items-center gap-1.5 text-xs font-semibold", text[t.result])}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dot[t.result])} />
              {label[t.result]}
            </p>
          </div>
          <div className={cn("shrink-0 rounded-2xl px-3.5 py-1.5 text-right text-xl font-bold tabular-nums tracking-tight ring-1 ring-inset sm:text-2xl", pill[t.result])}>
            {t.result === "breakeven" ? "$0.00" : formatPnl(t.pnl)}
          </div>
        </div>

        {levels.length > 0 && (
          <dl className="mt-5 grid grid-cols-3 divide-x divide-border/60 rounded-2xl bg-card/70 py-3 ring-1 ring-inset ring-border/60 backdrop-blur sm:grid-cols-5">
            {levels.map((l) => (
              <div key={l.k} className="px-4">
                <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{l.k}</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums">{l.v}</dd>
              </div>
            ))}
          </dl>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="mt-5 flex w-full items-center gap-3 text-left"
          aria-expanded={open}
        >
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/70">
            <div
              className={cn("h-full rounded-full transition-all", full ? "bg-win" : "bg-primary")}
              style={{ width: `${(done / CHECKLIST.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {done}/{CHECKLIST.length} rules
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {CHECKLIST.map((c) => {
              const on = !!t.checklist?.[c.id];
              return (
                <li key={c.id} className={cn("flex items-center gap-2 text-sm", on ? "text-foreground" : "text-muted-foreground")}>
                  {on ? <Check className="h-4 w-4 text-win" strokeWidth={3} /> : <X className="h-4 w-4 text-loss/70" />}
                  {c.label}
                </li>
              );
            })}
          </ul>
        )}

        {t.notes && (
          <p className="mt-5 border-l-2 border-primary/30 pl-4 text-sm italic leading-relaxed text-muted-foreground">
            {t.notes}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-1 border-t border-border/60 pt-4">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-loss hover:bg-loss/10 hover:text-loss">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
