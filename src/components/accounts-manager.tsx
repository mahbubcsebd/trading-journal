"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccounts, useScopedTrades } from "@/components/accounts-provider";
import { ACCOUNT_COLORS, MAX_ACCOUNT_NAME } from "@/lib/accounts";
import type { Account, AccountInput } from "@/lib/types";
import { cn } from "@/lib/utils";

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Account colour">
      {ACCOUNT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full ring-offset-2 ring-offset-card transition-all",
            value === c ? "ring-2 ring-foreground/70" : "hover:scale-110",
          )}
          style={{ backgroundColor: c }}
        >
          {value === c && (
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}

/** Name + colour form used for both creating and editing an account. */
function AccountEditor({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: AccountInput;
  submitLabel: string;
  onSubmit: (input: AccountInput) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await onSubmit({ name, color });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (!onCancel) setName("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Account name"
          maxLength={MAX_ACCOUNT_NAME}
          aria-label="Account name"
          autoFocus={Boolean(onCancel)}
        />
        <Button type="submit" disabled={busy}>
          {!onCancel && <Plus className="h-4 w-4" />} {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ColorPicker value={color} onChange={setColor} />
      {error && <p className="text-xs text-loss">{error}</p>}
    </form>
  );
}

function AccountRow({
  account,
  tradeCount,
  canDelete,
}: {
  account: Account;
  tradeCount: number;
  canDelete: boolean;
}) {
  const { updateAccount, deleteAccount } = useAccounts();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const message = `Delete "${account.name}" and its ${tradeCount} trade${tradeCount === 1 ? "" : "s"}? This cannot be undone.`;
    if (!window.confirm(message)) return;
    setError(await deleteAccount(account.id));
  }

  if (editing) {
    return (
      <li className="rounded-2xl border bg-muted/40 p-3">
        <AccountEditor
          initial={{ name: account.name, color: account.color }}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            const err = await updateAccount(account.id, input);
            if (!err) setEditing(false);
            return err;
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: account.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{account.name}</p>
          <p className="text-xs text-muted-foreground">
            {tradeCount} trade{tradeCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${account.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={remove}
          disabled={!canDelete}
          title={canDelete ? undefined : "Keep at least one account"}
          aria-label={`Delete ${account.name}`}
          className="text-loss hover:bg-loss/10 hover:text-loss"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
    </li>
  );
}

export function AccountsManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { accounts, addAccount } = useAccounts();
  const { allTrades } = useScopedTrades();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="border-b px-6 pb-4 pt-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Trading accounts
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
            Each account keeps its own trades, results and analytics.
          </DialogDescription>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <ul className="space-y-2">
            {accounts.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                tradeCount={
                  allTrades.filter((t) => t.account_id === a.id).length
                }
                canDelete={accounts.length > 1}
              />
            ))}
          </ul>
          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Add account
            </p>
            <AccountEditor
              initial={{
                name: "",
                color: ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
              }}
              submitLabel="Add"
              onSubmit={addAccount}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
