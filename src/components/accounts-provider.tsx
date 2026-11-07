"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_ACCOUNTS, validateAccount } from "@/lib/accounts";
import { useTrades } from "@/components/trades-provider";
import type { Account, AccountInput, Trade } from "@/lib/types";

export const ALL_ACCOUNTS = "all";

interface Ctx {
  accounts: Account[];
  loading: boolean;
  /** "all" or an account id */
  activeId: string;
  setActiveId: (id: string) => void;
  /** Each mutator resolves to an error message, or null on success. */
  addAccount: (input: AccountInput) => Promise<string | null>;
  updateAccount: (id: string, input: AccountInput) => Promise<string | null>;
  deleteAccount: (id: string) => Promise<string | null>;
}

const AccountsContext = createContext<Ctx | null>(null);
const LOCAL_KEY = "lubna-accounts-v1";
const ACTIVE_KEY = "active-account-v1";
const UNIQUE_VIOLATION = "23505";
const DUPLICATE_MESSAGE = "An account with this name already exists.";

function normalize(r: Record<string, unknown>): Account {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    color: String(r.color ?? "#7c3aed"),
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

function seedLocal(): Account[] {
  const now = Date.now();
  return DEFAULT_ACCOUNTS.map((a, i) => ({
    ...a,
    id: crypto.randomUUID(),
    created_at: new Date(now + i).toISOString(),
  }));
}

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const { purgeAccount } = useTrades();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveIdState] = useState<string>(ALL_ACCOUNTS);
  const seeding = useRef(false);

  const refresh = useCallback(async () => {
    if (sb) {
      const read = () =>
        sb
          .from("accounts")
          .select("*")
          .order("created_at", { ascending: true });
      let { data } = await read();
      if (data && data.length === 0 && !seeding.current) {
        seeding.current = true;
        const { error } = await sb.from("accounts").insert(DEFAULT_ACCOUNTS);
        if (error && error.code !== UNIQUE_VIOLATION)
          console.error("Seeding accounts failed", error);
        ({ data } = await read());
      }
      if (data) setAccounts(data.map(normalize));
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        const saved = raw ? (JSON.parse(raw) as Account[]) : [];
        if (saved.length > 0) {
          setAccounts(saved);
        } else {
          const seeded = seedLocal();
          localStorage.setItem(LOCAL_KEY, JSON.stringify(seeded));
          setAccounts(seeded);
        }
      } catch (err) {
        console.error("Could not read accounts", err);
        setAccounts(seedLocal());
      }
    }
    setLoading(false);
  }, [sb]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_KEY);
      if (saved) setActiveIdState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    if (!sb) return;
    const channel = sb
      .channel("accounts-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, refresh]);

  // Fall back to "all" if the saved account no longer exists
  useEffect(() => {
    if (
      !loading &&
      activeId !== ALL_ACCOUNTS &&
      !accounts.some((a) => a.id === activeId)
    ) {
      setActiveIdState(ALL_ACCOUNTS);
    }
  }, [loading, accounts, activeId]);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    try {
      localStorage.setItem(ACTIVE_KEY, id);
    } catch {}
  }, []);

  const commitLocal = (next: Account[]) => {
    setAccounts(next);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  };

  const addAccount = useCallback(
    async (input: AccountInput) => {
      const invalid = validateAccount(input, accounts);
      if (invalid) return invalid;
      const clean = { name: input.name.trim(), color: input.color };
      if (sb) {
        const { error } = await sb.from("accounts").insert(clean);
        if (error)
          return error.code === UNIQUE_VIOLATION
            ? DUPLICATE_MESSAGE
            : error.message;
        await refresh();
        return null;
      }
      commitLocal([
        ...accounts,
        {
          ...clean,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        },
      ]);
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, accounts, refresh],
  );

  const updateAccount = useCallback(
    async (id: string, input: AccountInput) => {
      const invalid = validateAccount(input, accounts, id);
      if (invalid) return invalid;
      const clean = { name: input.name.trim(), color: input.color };
      if (sb) {
        const { error } = await sb.from("accounts").update(clean).eq("id", id);
        if (error)
          return error.code === UNIQUE_VIOLATION
            ? DUPLICATE_MESSAGE
            : error.message;
        await refresh();
        return null;
      }
      commitLocal(accounts.map((a) => (a.id === id ? { ...a, ...clean } : a)));
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, accounts, refresh],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      if (accounts.length <= 1) return "Keep at least one account.";
      const purged = await purgeAccount(id);
      if (!purged) return "Could not delete this account's trades.";
      if (sb) {
        const { error } = await sb.from("accounts").delete().eq("id", id);
        if (error) return error.message;
        await refresh();
      } else {
        commitLocal(accounts.filter((a) => a.id !== id));
      }
      if (activeId === id) setActiveId(ALL_ACCOUNTS);
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, accounts, activeId, purgeAccount, refresh, setActiveId],
  );

  const value = useMemo<Ctx>(
    () => ({
      accounts,
      loading,
      activeId,
      setActiveId,
      addAccount,
      updateAccount,
      deleteAccount,
    }),
    [
      accounts,
      loading,
      activeId,
      setActiveId,
      addAccount,
      updateAccount,
      deleteAccount,
    ],
  );

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used inside AccountsProvider");
  return ctx;
}

/**
 * Trades for the account currently selected in the header.
 * Trades without a valid account (older data) are attributed to the first account.
 */
export function useScopedTrades(): {
  trades: Trade[];
  allTrades: Trade[];
  loading: boolean;
} {
  const { trades, loading: tradesLoading } = useTrades();
  const { accounts, activeId, loading: accountsLoading } = useAccounts();

  const allTrades = useMemo(() => {
    const ids = new Set(accounts.map((a) => a.id));
    const fallback = accounts[0]?.id ?? "";
    return trades.map((t) =>
      t.account_id && ids.has(t.account_id)
        ? t
        : { ...t, account_id: fallback },
    );
  }, [trades, accounts]);

  const scoped = useMemo(
    () =>
      activeId === ALL_ACCOUNTS
        ? allTrades
        : allTrades.filter((t) => t.account_id === activeId),
    [allTrades, activeId],
  );

  return {
    trades: scoped,
    allTrades,
    loading: tradesLoading || accountsLoading,
  };
}
