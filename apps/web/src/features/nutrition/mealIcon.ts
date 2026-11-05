import { Apple, Coffee, Moon, Soup, Utensils, type LucideIcon } from "lucide-react";

const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/caf[eé]|manh[ãa]/i, Coffee],
  [/almo[çc]o|lunch/i, Utensils],
  [/lanche|snack/i, Apple],
  [/jantar|ceia|noite|dinner/i, Moon],
];

export function mealIcon(name: string): LucideIcon {
  for (const [pattern, icon] of KEYWORD_ICONS) {
    if (pattern.test(name)) return icon;
  }
  return Soup;
}
