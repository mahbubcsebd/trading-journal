"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, isCloud } from "@/lib/supabase";
import { numOrNull } from "@/lib/utils";
import type { Trade, TradeInput } from "@/lib/types";

interface Ctx {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  mode: "cloud" | "local";
  addTrade: (input: TradeInput) => Promise<boolean>;
  updateTrade: (id: string, input: TradeInput) => Promise<boolean>;
  deleteTrade: (id: string) => Promise<boolean>;
}

const TradesContext = createContext<Ctx | null>(null);
const LOCAL_KEY = "lubna-trades-v1";

function normalize(r: Record<string, unknown>): Trade {
  return {
    id: String(r.id),
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
      : b.trade_date.localeCompare(a.trade_date)
  );
}

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    if (sb) {
      const { data, error } = await sb.from("trades").select("*").order("trade_date", { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setTrades(sortTrades((data ?? []).map(normalize)));
      }
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        setTrades(sortTrades(raw ? (JSON.parse(raw) as Trade[]) : []));
      } catch {
        setTrades([]);
      }
    }
    loaded.current = true;
    setLoading(false);
  }, [sb]);

  // Initial load + keep phone/browser in sync
  useEffect(() => {
    refresh();
    if (!sb) return;
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    const channel = sb
      .channel("trades-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, () => refresh())
      .subscribe();
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      sb.removeChannel(channel);
    };
  }, [sb, refresh]);

  const saveLocal = (list: Trade[]) => {
    setTrades(sortTrades(list));
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  };

  const addTrade = useCallback(
    async (input: TradeInput) => {
      if (sb) {
        const { error } = await sb.from("trades").insert(input);
        if (error) {
          setError(error.message);
          return false;
        }
        await refresh();
        return true;
      }
      const t: Trade = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      saveLocal([...trades, t]);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, trades, refresh]
  );

  const updateTrade = useCallback(
    async (id: string, input: TradeInput) => {
      if (sb) {
        const { error } = await sb.from("trades").update(input).eq("id", id);
        if (error) {
          setError(error.message);
          return false;
        }
        await refresh();
        return true;
      }
      saveLocal(trades.map((t) => (t.id === id ? { ...t, ...input } : t)));
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, trades, refresh]
  );

  const deleteTrade = useCallback(
    async (id: string) => {
      if (sb) {
        const { error } = await sb.from("trades").delete().eq("id", id);
        if (error) {
          setError(error.message);
          return false;
        }
        await refresh();
        return true;
      }
      saveLocal(trades.filter((t) => t.id !== id));
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, trades, refresh]
  );

  const value = useMemo<Ctx>(
    () => ({
      trades,
      loading,
      error,
      mode: isCloud ? "cloud" : "local",
      addTrade,
      updateTrade,
      deleteTrade,
    }),
    [trades, loading, error, addTrade, updateTrade, deleteTrade]
  );

  return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export function useTrades() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error("useTrades must be used inside TradesProvider");
  return ctx;
}
