"use client";

import { Settings2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { ALL_ACCOUNTS, useAccounts } from "@/components/accounts-provider";

export function AccountSwitcher({ onManage }: { onManage: () => void }) {
  const { accounts, activeId, setActiveId } = useAccounts();
  const options = [
    { value: ALL_ACCOUNTS, label: "All accounts" },
    ...accounts.map((a) => ({ value: a.id, label: a.name, color: a.color })),
  ];

  return (
    <div className="flex items-center gap-1">
      <Combobox
        options={options}
        value={activeId}
        onChange={setActiveId}
        aria-label="Trading account"
        searchPlaceholder="Search accounts…"
        emptyText="No account found."
        className="h-9 w-40 rounded-full bg-card px-3 shadow-soft sm:w-52"
        contentClassName="min-w-[14rem]"
      />
      <button
        onClick={onManage}
        aria-label="Manage accounts"
        className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Settings2 className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
