/** C · Vivo tokens shared by HTML, CSS and public social images. */
export const VIVO_COLORS = {
  bg: "#F7F5FF",
  surface: "#FFFFFF",
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
export const VIVO_FONTS = {
  heading: "Outfit",
  body: "Plus Jakarta Sans",
} as const;
export const VIVO_CSS_VARIABLES = {
  ...Object.fromEntries(
    Object.entries(VIVO_COLORS).map(([key, value]) => ["--vivo-" + key, value]),
  ),
  "--fuente-cuerpo": `"${VIVO_FONTS.body}",sans-serif`,
  "--fuente-titulo": `"${VIVO_FONTS.heading}",sans-serif`,
  "--radio-tarjeta": "24px",
  "--radio-bloque": "24px",
  "--radio-control": "999px",
  "--radio-pill": "999px",
  "--vivo-progress-height": "10px",
};
