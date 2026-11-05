import type { ProgressEntry } from "./types";

export function latestValue(entries: ProgressEntry[], field: keyof ProgressEntry) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const value = entries[i][field];
    if (typeof value === "number") return value;
  }
  return null;
}

export function firstValue(entries: ProgressEntry[], field: keyof ProgressEntry) {
  for (const entry of entries) {
    const value = entry[field];
    if (typeof value === "number") return value;
  }
  return null;
}

export function delta(entries: ProgressEntry[], field: keyof ProgressEntry) {
  const first = firstValue(entries, field);
  const last = latestValue(entries, field);
  if (first === null || last === null) return null;
  return Math.round((last - first) * 10) / 10;
}
