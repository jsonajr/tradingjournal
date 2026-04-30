import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtMoney(n: number, signed = false) {
  const sign = n < 0 ? "-" : signed ? "+" : "";
  return sign + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function fmtDateOnly(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function calcRMultiple(entry: number, exit: number, stop: number, dir: "Long" | "Short"): number | null {
  if (!entry || !stop || !exit) return null;
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  const gain = dir === "Long" ? exit - entry : entry - exit;
  return parseFloat((gain / risk).toFixed(2));
}

export function fmtDateTz(d: string | Date | null | undefined, tz?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz || undefined,
  });
}