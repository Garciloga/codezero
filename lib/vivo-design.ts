/** Garciloga design tokens (data-design="vivo") shared by HTML, CSS and public social images. */
export const VIVO_COLORS = {
  bg: "#F1F6F3",
  surface: "#FFFFFF",
  text: "#0E2A22",
  muted: "#3F5A51",
  sidebar: "#0E2A22",
  "sidebar-card": "#1B4035",
  "sidebar-muted": "#BFD6CC",
  primary: "#09634D",
  hover: "#074F3D",
  soft: "#DCEBE4",
  accent: "#FF8A5B",
  positive: "#0B7567",
  reinforce: "#B4380F",
  "alert-bg": "#FFE8DC",
  "alert-text": "#8F2A08",
} as const;
export const VIVO_DARK_COLORS = {
  bg: "#0B1512",
  surface: "#15231E",
  text: "#EEF6F2",
  muted: "#BCD0C7",
  soft: "#24382F",
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
  "--vivo-primary": "var(--user-accent,#09634D)",
  "--vivo-hover": "color-mix(in srgb,var(--vivo-primary) 88%,#000)",
  "--fuente-cuerpo": `"${VIVO_FONTS.body}",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`,
  "--fuente-titulo": `"${VIVO_FONTS.heading}","Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`,
  "--radio-tarjeta": "22px",
  "--radio-bloque": "28px",
  "--radio-control": "999px",
  "--radio-pill": "999px",
  "--vivo-progress-height": "10px",
};

