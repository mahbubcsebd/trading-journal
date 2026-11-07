"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional colour dot shown before the label */
  color?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Show the search box only when there are at least this many options */
  searchFrom?: number;
  id?: string;
  "aria-label"?: string;
  className?: string;
  contentClassName?: string;
}

function Dot({ color }: { color?: string }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "hsl(var(--muted-foreground) / 0.5)" }}
    />
  );
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  searchFrom = 6,
  id,
  className,
  contentClassName,
  ...rest
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={rest["aria-label"]}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 text-left text-sm font-medium outline-none transition-colors",
            "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {selected ? <Dot color={selected.color} /> : null}
          <span
            className={cn(
              "flex-1 truncate",
              !selected && "text-muted-foreground",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={contentClassName}>
        <Command>
          {options.length >= searchFrom && (
            <CommandInput placeholder={searchPlaceholder} />
          )}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Dot color={o.color} />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value === value && (
                    <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
