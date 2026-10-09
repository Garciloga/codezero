/** Garciloga design tokens (data-design="vivo") shared by HTML, CSS and public social images. */
export const VIVO_COLORS = {
  bg: "#F3F5FA",
  surface: "#FFFFFF",
  text: "#12142B",
  muted: "#474B6B",
  sidebar: "#12142B",
  "sidebar-card": "#23264A",
  "sidebar-muted": "#C3C8E6",
  primary: "#2346D8",
  hover: "#1B37AE",
  soft: "#E3E8FB",
  accent: "#FFD23F",
  positive: "#0B7567",
  reinforce: "#B4380F",
  "alert-bg": "#FFE8DC",
  "alert-text": "#8F2A08",
} as const;
export const VIVO_DARK_COLORS = {
  bg: "#0D0F20",
  surface: "#1A1D38",
  text: "#F2F4FF",
  muted: "#C5CAE6",
  soft: "#2A2F58",
  positive: "#73D5BF",
  reinforce: "#FFB199",
  "alert-bg": "#4D302A",
  "alert-text": "#FFD4C3",
} as const;
export const VIVO_THEME_CSS = `html[data-design="vivo"][data-appearance="dark"]{color-scheme:dark;${Object.entries(VIVO_DARK_COLORS).map(([key,value])=>`--vivo-theme-${key}:${value}`).join(";")}}`;
export const VIVO_FONTS = {
  heading: "Bricolage Grotesque",
  body: "Inter",
} as const;
export const VIVO_CSS_VARIABLES = {
  ...Object.fromEntries(
    Object.entries(VIVO_COLORS).map(([key, value]) => ["--vivo-" + key, `var(--vivo-theme-${key},${value})`]),
  ),
  "--vivo-primary": "var(--user-accent,#2346D8)",
  "--vivo-hover": "color-mix(in srgb,var(--vivo-primary) 88%,#000)",
  "--fuente-cuerpo": `"${VIVO_FONTS.body}",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`,
  "--fuente-titulo": `"${VIVO_FONTS.heading}","Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`,
  "--radio-tarjeta": "14px",
  "--radio-bloque": "18px",
  "--radio-control": "10px",
  "--radio-pill": "999px",
  "--vivo-progress-height": "10px",
};

