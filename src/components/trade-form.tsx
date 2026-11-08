"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ALL_ACCOUNTS, useAccounts } from "@/components/accounts-provider";
import { CHECKLIST, emptyChecklist } from "@/lib/checklist";
import {
  TRADE_TYPES,
  type Direction,
  type Result,
  type Trade,
  type TradeInput,
  type TradeType,
} from "@/lib/types";
import { cn, numOrNull } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Trade | null;
  defaultDate: string;
  onSave: (input: TradeInput, id?: string) => Promise<boolean>;
}

const SYMBOL_OPTIONS = [
  "XAUUSD",
  "XAGUSD",
  "BTCUSD",
  "ETHUSD",
  "US30",
  "USOIL",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "GBPJPY",
  "EURJPY",
].map((s) => ({ value: s, label: s }));

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; tone?: string }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-all",
            value === o.value
              ? cn("bg-card shadow-soft", o.tone ?? "text-foreground")
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TradeForm({
  open,
  onOpenChange,
  initial,
  defaultDate,
  onSave,
}: Props) {
  const { accounts, activeId } = useAccounts();
  const defaultAccountId =
    activeId === ALL_ACCOUNTS ? (accounts[0]?.id ?? "") : activeId;
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [date, setDate] = useState(defaultDate);
  const [symbol, setSymbol] = useState("");
  const [symbolError, setSymbolError] = useState(false);
  const [type, setType] = useState<TradeType>("intraday");
  const [direction, setDirection] = useState<Direction>("buy");
  const [lot, setLot] = useState("");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [exit, setExit] = useState("");
  const [result, setResult] = useState<Result>("win");
  const [amount, setAmount] = useState("");
  const [checks, setChecks] =
    useState<Record<string, boolean>>(emptyChecklist());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset the form each time it opens
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setAccountId(initial.account_id);
      setDate(initial.trade_date);
      setSymbol(initial.symbol);
      setType(initial.trade_type);
      setDirection(initial.direction);
      setLot(String(initial.lot_size));
      setEntry(initial.entry_price?.toString() ?? "");
      setSl(initial.stop_loss?.toString() ?? "");
      setTp(initial.take_profit?.toString() ?? "");
      setExit(initial.exit_price?.toString() ?? "");
      setResult(initial.result);
      setAmount(initial.pnl ? String(Math.abs(initial.pnl)) : "");
      setChecks({ ...emptyChecklist(), ...initial.checklist });
      setNotes(initial.notes ?? "");
    } else {
      setAccountId(defaultAccountId);
      setDate(defaultDate);
      setSymbol("");
      setType("intraday");
      setDirection("buy");
      setLot("");
      setEntry("");
      setSl("");
      setTp("");
      setExit("");
      setResult("win");
      setAmount("");
      setChecks(emptyChecklist());
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaultDate]);

  const done = CHECKLIST.filter((c) => checks[c.id]).length;
  const allDone = done === CHECKLIST.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim()) {
      setSymbolError(true);
      return;
    }
    setBusy(true);
    const abs = Math.abs(Number(amount) || 0);
    const input: TradeInput = {
      account_id: accountId,
      trade_date: date,
      symbol: symbol.trim().toUpperCase(),
      trade_type: type,
      direction,
      lot_size: Number(lot) || 0,
      entry_price: numOrNull(entry),
      stop_loss: numOrNull(sl),
      take_profit: numOrNull(tp),
      exit_price: numOrNull(exit),
      result,
      pnl: result === "win" ? abs : result === "loss" ? -abs : 0,
      checklist: checks,
      notes: notes.trim() || null,
    };
    const ok = await onSave(input, initial?.id);
    setBusy(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="border-b px-6 pb-4 pt-6">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {initial ? "Edit trade" : "New trade"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
              Tick every rule you followed, then fill in the trade.
            </DialogDescription>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* 0. Account */}
            <section>
              <Label htmlFor="account">Account</Label>
              <Combobox
                id="account"
                options={accounts.map((a) => ({
                  value: a.id,
                  label: a.name,
                  color: a.color,
                }))}
                value={accountId}
                onChange={setAccountId}
                placeholder="Select account"
                aria-label="Account"
              />
            </section>

            {/* 1. Checklist */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <Label className="mb-0">Rules followed</Label>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    allDone ? "text-win" : "text-muted-foreground",
                  )}
                >
                  {done}/{CHECKLIST.length}
                </span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    allDone ? "bg-win" : "bg-primary",
                  )}
                  style={{ width: `${(done / CHECKLIST.length) * 100}%` }}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CHECKLIST.map((c) => {
                  const on = !!checks[c.id];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setChecks((s) => ({ ...s, [c.id]: !on }))}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all active:scale-[0.98]",
                        on
                          ? "border-win/40 bg-win/10 font-medium"
                          : "bg-card hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                          on ? "border-win bg-win text-white" : "border-input",
                        )}
                      >
                        {on && (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        )}
                      </span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Trade type + direction */}
            <section className="space-y-4">
              <div>
                <Label>Trade type</Label>
                <Segmented
                  value={type}
                  onChange={setType}
                  options={TRADE_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="symbol">Pair / symbol</Label>
                  <Combobox
                    id="symbol"
                    allowCustom
                    options={SYMBOL_OPTIONS}
                    value={symbol}
                    onChange={(v) => {
                      setSymbol(v);
                      setSymbolError(false);
                    }}
                    normalizeCustom={(raw) => raw.trim().toUpperCase()}
                    placeholder="XAUUSD"
                    searchPlaceholder="Search or type a pair…"
                    aria-label="Pair / symbol"
                    className={symbolError ? "border-loss" : undefined}
                  />
                  {symbolError && (
                    <p className="mt-1 text-xs text-loss">
                      Pick or type a pair.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Direction</Label>
                <Segmented
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { value: "buy", label: "Buy", tone: "text-win" },
                    { value: "sell", label: "Sell", tone: "text-loss" },
                  ]}
                />
              </div>
            </section>

            {/* 3. Numbers */}
            <section className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="lot">Lot size</Label>
                <Input
                  id="lot"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  placeholder="0.10"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="entry">Entry</Label>
                <Input
                  id="entry"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="exit">Exit</Label>
                <Input
                  id="exit"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={exit}
                  onChange={(e) => setExit(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sl">Stop loss</Label>
                <Input
                  id="sl"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={sl}
                  onChange={(e) => setSl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tp">Take profit</Label>
                <Input
                  id="tp"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={tp}
                  onChange={(e) => setTp(e.target.value)}
                />
              </div>
            </section>

            {/* 4. Result */}
            <section className="space-y-4">
              <div>
                <Label>Result</Label>
                <Segmented
                  value={result}
                  onChange={setResult}
                  options={[
                    { value: "win", label: "Success", tone: "text-win" },
                    { value: "loss", label: "Failed", tone: "text-loss" },
                    { value: "breakeven", label: "Breakeven" },
                  ]}
                />
              </div>
              {result !== "breakeven" && (
                <div>
                  <Label htmlFor="amount">
                    {result === "win" ? "Profit ($)" : "Loss ($)"}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Why did you take this trade? What did you learn?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </section>
          </div>

          <div className="flex gap-3 border-t bg-card px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-[2]"
              disabled={busy || !accountId}
            >
              {busy ? "Saving…" : initial ? "Save changes" : "Save trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
