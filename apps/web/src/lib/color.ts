export type ThemeMode = "light" | "dark";

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export interface BrandPalette {
  /** Cor base da academia, igual nos dois temas. */
  brand: string;
  /** Estado de hover/ativo: clareia no escuro, escurece no claro. */
  brandHover: string;
  /** Fundo suave para chips/badges/itens ativos. */
  brandTintBg: string;
  /** Texto/ícone sobre o brandTintBg (ou sobre o fundo da superfície). */
  brandTintFg: string;
  brandRgb: string;
}

/** Deriva uma paleta coerente e com contraste correto para o tema atual, a partir da cor única da academia. */
export function getBrandPalette(baseHex: string, mode: ThemeMode): BrandPalette {
  const hsl = hexToHsl(baseHex);
  const clean = baseHex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const isDark = mode === "dark";

  return {
    brand: baseHex,
    brandHover: hslToHex({
      ...hsl,
      l: clamp(hsl.l + (isDark ? 0.14 : -0.1), 0.12, 0.85),
    }),
    brandTintBg: hslToHex({
      ...hsl,
      s: clamp(hsl.s, 0.25, 1),
      l: isDark ? clamp(hsl.l - 0.26, 0.08, 0.3) : clamp(hsl.l + 0.46, 0.88, 0.96),
    }),
    brandTintFg: hslToHex({
      ...hsl,
      s: clamp(hsl.s - 0.05, 0, 1),
      l: isDark ? clamp(hsl.l + 0.38, 0.65, 0.9) : clamp(hsl.l - 0.12, 0.18, 0.38),
    }),
    brandRgb: `${r}, ${g}, ${b}`,
  };
}

export function applyBrandPalette(baseHex: string, mode: ThemeMode) {
  const palette = getBrandPalette(baseHex, mode);
  const root = document.documentElement.style;
  root.setProperty("--brand", palette.brand);
  root.setProperty("--brand-hover", palette.brandHover);
  root.setProperty("--brand-tint-bg", palette.brandTintBg);
  root.setProperty("--brand-tint-fg", palette.brandTintFg);
  root.setProperty("--brand-rgb", palette.brandRgb);
}
