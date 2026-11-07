"use client";

import { useEffect, useState } from "react";
import { LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/**
 * Password screen for local mode (no Supabase). Only the SHA-256 hash of the password is stored here.
 * This keeps casual visitors out, but it runs in the browser, so it is NOT real security.
 * Real protection comes from connecting Supabase (see auth-gate.tsx).
 * Override the hash with NEXT_PUBLIC_LOCAL_PASSWORD_HASH (sha256 hex of your password).
 */
const PASSWORD_HASH =
  process.env.NEXT_PUBLIC_LOCAL_PASSWORD_HASH ??
  "cd2be296127c1a2ef78850d9ee96e0f33964930f179d6374cf36e449f605fecb";
const UNLOCK_KEY = "journal-unlocked-v1";

/** Forget the saved unlock on this browser and show the password screen again. */
export function lockLocal() {
  try {
    localStorage.removeItem(UNLOCK_KEY);
  } catch {}
  window.location.reload();
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function LocalGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(UNLOCK_KEY) === PASSWORD_HASH);
    } catch {
      setUnlocked(false);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if ((await sha256Hex(password)) !== PASSWORD_HASH) {
      setError("Wrong password. Please try again.");
      setPassword("");
      return;
    }
    try {
      localStorage.setItem(UNLOCK_KEY, PASSWORD_HASH);
    } catch {}
    setUnlocked(true);
  }

  if (unlocked === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (unlocked) return <>{children}</>;

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
        <form
          onSubmit={submit}
          className="space-y-4 rounded-3xl border bg-card p-6 shadow-soft"
        >
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="journal"
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
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    </main>
  );
}
