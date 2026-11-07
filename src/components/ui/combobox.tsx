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
  /** Let the user pick a value that is not in `options` */
  allowCustom?: boolean;
  /** Transform typed custom values, e.g. upper-case */
  normalizeCustom?: (raw: string) => string;
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
  allowCustom = false,
  normalizeCustom = (raw) => raw.trim(),
  id,
  className,
  contentClassName,
  ...rest
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected =
    options.find((o) => o.value === value) ??
    (allowCustom && value ? { value, label: value } : undefined);
  const customValue = normalizeCustom(query);
  const showCustom =
    allowCustom &&
    customValue !== "" &&
    !options.some((o) => o.value.toLowerCase() === customValue.toLowerCase());

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
          {(allowCustom || options.length >= searchFrom) && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
          )}
          <CommandList>
            {!showCustom && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {showCustom && (
                <CommandItem
                  forceMount
                  value={`__custom__${customValue}`}
                  onSelect={() => {
                    onChange(customValue);
                    handleOpenChange(false);
                  }}
                >
                  <span className="flex-1 truncate">Use “{customValue}”</span>
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value);
                    handleOpenChange(false);
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
