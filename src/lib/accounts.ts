import type { AccountInput } from "@/lib/types";

export const ACCOUNT_COLORS = [
  "#7c3aed",
  "#0d9488",
  "#d97706",
  "#e11d48",
  "#0284c7",
  "#475569",
] as const;

export const MAX_ACCOUNT_NAME = 40;

export const DEFAULT_ACCOUNTS: AccountInput[] = [
  { name: "Lubna Rahman", color: ACCOUNT_COLORS[0] },
  { name: "Mahbubur Rahman", color: ACCOUNT_COLORS[1] },
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Returns an error message, or null when the input is valid. */
export function validateAccount(
  input: AccountInput,
  existing: { id: string; name: string }[],
  selfId?: string,
): string | null {
  const name = input.name.trim();
  if (!name) return "Give the account a name.";
  if (name.length > MAX_ACCOUNT_NAME)
    return `Name can be at most ${MAX_ACCOUNT_NAME} characters.`;
  if (!HEX_COLOR.test(input.color)) return "Pick a valid colour.";
  const taken = existing.some(
    (a) =>
      a.id !== selfId && a.name.trim().toLowerCase() === name.toLowerCase(),
  );
  return taken ? "An account with this name already exists." : null;
}
