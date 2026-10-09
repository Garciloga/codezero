export const ACCENTS = {
  blue: { label: "Azul", light: "#2346d8", dark: "#a5b4fc" },
  green: { label: "Verde", light: "#09634d", dark: "#6ee7b7" },
  purple: { label: "Violeta", light: "#7133ae", dark: "#d8b4fe" },
  orange: { label: "Terracota", light: "#983d12", dark: "#fdba74" },
} as const;
export type Appearance = { mode: "system" | "light" | "dark"; accent: keyof typeof ACCENTS; colors?: Palette };
export const DEFAULT_APPEARANCE: Appearance = { mode: "system", accent: "blue" };
export function validAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return typeof input.mode === "string" && ["system", "light", "dark"].includes(input.mode)
    && typeof input.accent === "string" && Object.hasOwn(ACCENTS, input.accent) && (input.colors === undefined || validPalette(input.colors));
}
export function parseAppearance(value: unknown): Appearance {
  if (!value || typeof value !== "object") return { ...DEFAULT_APPEARANCE };
  const input = value as Record<string, unknown>;
  return {
    ...(validPalette(input.colors) ? { colors: input.colors } : {}),
    mode: ["system", "light", "dark"].includes(String(input.mode)) ? input.mode as Appearance["mode"] : "system",
    accent: typeof input.accent === "string" && Object.hasOwn(ACCENTS, input.accent) ? input.accent as Appearance["accent"] : "blue",
  };
}
export function appearanceStorageKey(userId: string | null) {
  return "codezero.appearance.v1:" + (userId ? "account:" + encodeURIComponent(userId) : "visitor");
}

export const PALETTE_FIELDS = {"bg": {"label": "Fondo de la plataforma", "light": "#F3F5FA", "dark": "#0D0F20"}, "surface": {"label": "Tarjetas y campos", "light": "#FFFFFF", "dark": "#1A1D38"}, "text": {"label": "Texto principal", "light": "#12142B", "dark": "#F2F4FF"}, "muted": {"label": "Texto secundario", "light": "#474B6B", "dark": "#C5CAE6"}, "sidebar": {"label": "Fondo del menú", "light": "#12142B", "dark": "#090A18"}, "sidebar-card": {"label": "Bloques y hover del menú", "light": "#23264A", "dark": "#1C1F40"}, "sidebar-text": {"label": "Texto del menú", "light": "#FFFFFF", "dark": "#FFFFFF"}, "sidebar-muted": {"label": "Texto secundario del menú", "light": "#C3C8E6", "dark": "#C3C8E6"}, "primary": {"label": "Botones y progreso", "light": "#2346d8", "dark": "#a5b4fc"}, "button-text": {"label": "Texto de botones", "light": "#FFFFFF", "dark": "#101828"}, "hover": {"label": "Botones al pasar el cursor", "light": "#203eba", "dark": "#919edb"}, "soft": {"label": "Superficies suaves", "light": "#E3E8FB", "dark": "#2A2F58"}, "accent": {"label": "Opción activa del menú", "light": "#FFD23F", "dark": "#FFD23F"}, "selected-text": {"label": "Texto de opción activa", "light": "#12142B", "dark": "#12142B"}, "border": {"label": "Bordes", "light": "#d9deec", "dark": "#475467"}, "border-strong": {"label": "Bordes destacados", "light": "#667085", "dark": "#667085"}, "focus": {"label": "Foco de teclado", "light": "#2346d8", "dark": "#a5b4fc"}, "selection": {"label": "Selección de texto", "light": "#2346d8", "dark": "#a5b4fc"}, "selection-text": {"label": "Texto seleccionado", "light": "#FFFFFF", "dark": "#101828"}, "positive": {"label": "Éxito y avance", "light": "#0B7567", "dark": "#73D5BF"}, "reinforce": {"label": "Error y refuerzo", "light": "#B4380F", "dark": "#FFB199"}, "alert-bg": {"label": "Fondo de avisos", "light": "#FFE8DC", "dark": "#4D302A"}, "alert-text": {"label": "Texto de avisos", "light": "#8F2A08", "dark": "#FFD4C3"}} as const;
export type PaletteKey = keyof typeof PALETTE_FIELDS;
export type Palette = Partial<Record<"light" | "dark", Partial<Record<PaletteKey, string>>>>;
export function validPalette(value: unknown): value is Palette {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([mode, colors]) =>
    ["light", "dark"].includes(mode) && colors !== null && typeof colors === "object" && !Array.isArray(colors)
    && Object.entries(colors).every(([key, color]) => Object.hasOwn(PALETTE_FIELDS, key) && typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)));
}
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  const x=luminance(a), y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function readableForeground(background: string) {
  return contrastRatio(background,"#ffffff") >= contrastRatio(background,"#101828") ? "#ffffff" : "#101828";
}
export function paletteFor(preference: Appearance, mode: "light" | "dark") {
  const result = Object.fromEntries(Object.entries(PALETTE_FIELDS).map(([key,value]) => [key,value[mode]])) as Record<PaletteKey,string>;
  result.primary = ACCENTS[preference.accent][mode];
  result["button-text"] = readableForeground(result.primary);
  result.focus=result.primary;result.selection=result.primary;result["selection-text"]=readableForeground(result.selection);
  return {...result,...preference.colors?.[mode]};
}
export function paletteWarnings(preference: Appearance, mode: "light" | "dark") {
  const p=paletteFor(preference,mode);
  return ([["text","bg"],["text","surface"],["muted","surface"],["sidebar-text","sidebar"],["sidebar-muted","sidebar"],["button-text","primary"],["selected-text","accent"],["selection-text","selection"],["alert-text","alert-bg"]] as const)
    .filter(([text,bg]) => contrastRatio(p[text],p[bg])<4.5).map(([text,bg])=>`${PALETTE_FIELDS[text].label} / ${PALETTE_FIELDS[bg].label}`);
}

export function withAccent(preference: Appearance, accent: Appearance["accent"]): Appearance {
  if (!preference.colors) return {...preference,accent};
  const colors: Palette = {};
  for (const mode of ["light","dark"] as const) {
    if (!preference.colors[mode]) continue;
    const {primary,hover,"button-text":buttonText,...remaining}=preference.colors[mode];
    colors[mode]=remaining;
  }
  return {...preference,accent,colors};
}
