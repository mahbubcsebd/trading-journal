"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { numOrNull } from "@/lib/utils";
import type { Trade, TradeInput } from "@/lib/types";

interface Ctx {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  addTrade: (input: TradeInput) => Promise<boolean>;
  updateTrade: (id: string, input: TradeInput) => Promise<boolean>;
  deleteTrade: (id: string) => Promise<boolean>;
  /** Remove every trade that belongs to an account (used when the account is deleted). */
  purgeAccount: (accountId: string) => Promise<boolean>;
}

const TradesContext = createContext<Ctx | null>(null);
const NO_DATABASE = "Database is not connected. Check the Supabase settings.";

function normalize(r: Record<string, unknown>): Trade {
  return {
    id: String(r.id),
    account_id: String(r.account_id ?? ""),
    trade_date: String(r.trade_date),
    symbol: String(r.symbol ?? ""),
    trade_type: r.trade_type as Trade["trade_type"],
    direction: r.direction as Trade["direction"],
    lot_size: Number(r.lot_size ?? 0),
    entry_price: numOrNull(r.entry_price),
    stop_loss: numOrNull(r.stop_loss),
    take_profit: numOrNull(r.take_profit),
    exit_price: numOrNull(r.exit_price),
    result: r.result as Trade["result"],
    pnl: Number(r.pnl ?? 0),
    checklist: (r.checklist as Record<string, boolean>) ?? {},
    notes: (r.notes as string) ?? null,
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

function sortTrades(list: Trade[]): Trade[] {
  return [...list].sort((a, b) =>
    a.trade_date === b.trade_date
      ? b.created_at.localeCompare(a.created_at)
      : b.trade_date.localeCompare(a.trade_date),
  );
}

/** All trades live in Supabase; nothing is stored on this device. */
export function TradesProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sb) {
      setError(NO_DATABASE);
      setLoading(false);
      return;
    }
    const { data, error } = await sb
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setTrades(sortTrades((data ?? []).map(normalize)));
    }
    setLoading(false);
  }, [sb]);

  // Initial load + keep every device in sync
  useEffect(() => {
    refresh();
    if (!sb) return;
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    const channel = sb
      .channel("trades-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      sb.removeChannel(channel);
    };
  }, [sb, refresh]);

  /** Runs a write, reports any error, then reloads from the database. */
  const write = useCallback(
    async (
      run: (
        client: NonNullable<typeof sb>,
      ) => PromiseLike<{ error: { message: string } | null }>,
    ) => {
      if (!sb) {
        setError(NO_DATABASE);
        return false;
      }
      const { error } = await run(sb);
      if (error) {
        setError(error.message);
        return false;
      }
      await refresh();
      return true;
    },
    [sb, refresh],
  );

  const addTrade = useCallback(
    (input: TradeInput) => write((c) => c.from("trades").insert(input)),
    [write],
  );

  const updateTrade = useCallback(
    (id: string, input: TradeInput) =>
      write((c) => c.from("trades").update(input).eq("id", id)),
    [write],
  );

  const deleteTrade = useCallback(
    (id: string) => write((c) => c.from("trades").delete().eq("id", id)),
    [write],
  );

  const purgeAccount = useCallback(
    (accountId: string) =>
      write((c) => c.from("trades").delete().eq("account_id", accountId)),
    [write],
  );

  const value = useMemo<Ctx>(
    () => ({
      trades,
      loading,
      error,
      addTrade,
      updateTrade,
      deleteTrade,
      purgeAccount,
    }),
    [trades, loading, error, addTrade, updateTrade, deleteTrade, purgeAccount],
  );

  return (
    <TradesContext.Provider value={value}>{children}</TradesContext.Provider>
  );
}

export function useTrades() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error("useTrades must be used inside TradesProvider");
  return ctx;
}
