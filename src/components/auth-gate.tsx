"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LineChart } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LocalGate } from "@/components/local-gate";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  // No Supabase keys -> local mode (data stays on this device only), guarded by a simple password screen
  if (!sb) return <LocalGate>{children}</LocalGate>;
  if (session === undefined)
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  if (!session) return <LoginForm />;
  return <>{children}</>;
}

/**
 * Single-owner journal: the owner's email comes from NEXT_PUBLIC_OWNER_EMAIL and only the
 * password is typed. Supabase keeps the session in this browser, so it is asked once per device.
 * The password itself lives in Supabase Auth, never in this code.
 */
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

function LoginForm() {
  const sb = getSupabase()!;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!OWNER_EMAIL) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await sb.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password,
    });
    if (signInError) {
      setError(
        signInError.status === 400
          ? "Wrong password. Please try again."
          : signInError.message,
      );
      setPassword("");
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Lubna&apos;s Journal
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Private journal. Enter the password to continue.
          </p>
        </div>

        {OWNER_EMAIL ? (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-3xl border bg-card p-6 shadow-soft"
          >
            {/* Hidden username lets the browser/password manager remember the password */}
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={OWNER_EMAIL}
              readOnly
              hidden
            />
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-loss">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : "Unlock"}
            </Button>
          </form>
        ) : (
          <p className="rounded-3xl border bg-card p-6 text-sm text-loss shadow-soft">
            Setup incomplete: set NEXT_PUBLIC_OWNER_EMAIL in the environment
            (see README).
          </p>
        )}
      </div>
    </main>
  );
}
