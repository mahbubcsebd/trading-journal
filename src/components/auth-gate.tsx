"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LineChart } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  // No Supabase keys -> local mode (data stays on this device only)
  if (!sb) return <>{children}</>;
  if (session === undefined) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!session) return <LoginForm />;
  return <>{children}</>;
}

function LoginForm() {
  const sb = getSupabase()!;
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "error", text: error.message });
    } else {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) setMsg({ kind: "error", text: error.message });
      else if (!data.session)
        setMsg({ kind: "info", text: "Account created. Check your email to confirm, then sign in." });
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <LineChart className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Lubna&apos;s Trading Journal</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "in" ? "Sign in to see your trades on any device" : "Create your private journal"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {msg && (
            <p className={msg.kind === "error" ? "text-sm text-loss" : "text-sm text-win"}>{msg.text}</p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setMsg(null);
          }}
          className="mt-5 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "in" ? "First time? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
