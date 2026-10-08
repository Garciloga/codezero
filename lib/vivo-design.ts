/** C · Vivo tokens shared by HTML, CSS and public social images. */
export const VIVO_COLORS = {
  bg: "#F3EBDD",
  surface: "#FFF9EF",
  text: "#1E1440",
  muted: "#4B3F73",
  sidebar: "#2B1B5A",
  "sidebar-card": "#3A2875",
  "sidebar-muted": "#C9BEF0",
  primary: "#5B3FD6",
  hover: "#432BB0",
  soft: "#E9E3FF",
  accent: "#FF6B2C",
  positive: "#0B7567",
  reinforce: "#B4380F",
  "alert-bg": "#FFE3D6",
  "alert-text": "#8F2A08",
} as const;
export const VIVO_DARK_COLORS = {
  bg: "#181423", surface: "#262031", text: "#F4EFFA", muted: "#D1C7E0",
  soft: "#3B304D", positive: "#73D5BF", reinforce: "#FFB199",
  "alert-bg": "#4D302A", "alert-text": "#FFD4C3",
} as const;
export const VIVO_THEME_CSS = `html[data-design="vivo"][data-appearance="dark"]{color-scheme:dark;${Object.entries(VIVO_DARK_COLORS).map(([key,value])=>`--vivo-theme-${key}:${value}`).join(";")}}`;
export const VIVO_FONTS = {
  heading: "Outfit",
  body: "Plus Jakarta Sans",
} as const;
export const VIVO_CSS_VARIABLES = {
  ...Object.fromEntries(
    Object.entries(VIVO_COLORS).map(([key, value]) => ["--vivo-" + key, `var(--vivo-theme-${key},${value})`]),
  ),
  "--vivo-primary": "var(--user-accent,#5B3FD6)",
  "--vivo-hover": "color-mix(in srgb,var(--vivo-primary) 88%,#000)",
  "--fuente-cuerpo": `"${VIVO_FONTS.body}",sans-serif`,
  "--fuente-titulo": `"${VIVO_FONTS.heading}",sans-serif`,
  "--radio-tarjeta": "24px",
  "--radio-bloque": "24px",
  "--radio-control": "999px",
  "--radio-pill": "999px",
  "--vivo-progress-height": "10px",
};
