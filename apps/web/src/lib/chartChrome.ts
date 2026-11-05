import type { ThemeMode } from "./color";

export const CHART_CHROME: Record<
  ThemeMode,
  { grid: string; tick: string; tooltipBg: string; tooltipBorder: string; tooltipText: string }
> = {
  dark: {
    grid: "#292536",
    tick: "#8d879b",
    tooltipBg: "#211d2c",
    tooltipBorder: "#393247",
    tooltipText: "#fff",
  },
  light: {
    grid: "#e3ddf0",
    tick: "#6c6578",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e3ddf0",
    tooltipText: "#221c2e",
  },
};
