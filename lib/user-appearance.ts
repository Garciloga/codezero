export const ACCENTS = {
  blue: { label: "Azul", light: "#2346d8", dark: "#a5b4fc" },
  green: { label: "Verde", light: "#09634d", dark: "#6ee7b7" },
  purple: { label: "Violeta", light: "#7133ae", dark: "#d8b4fe" },
  orange: { label: "Terracota", light: "#983d12", dark: "#fdba74" },
} as const;
export type Appearance = { mode: "system" | "light" | "dark"; accent: keyof typeof ACCENTS };
export const DEFAULT_APPEARANCE: Appearance = { mode: "system", accent: "blue" };
export function validAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return typeof input.mode === "string" && ["system", "light", "dark"].includes(input.mode)
    && typeof input.accent === "string" && Object.hasOwn(ACCENTS, input.accent);
}
export function parseAppearance(value: unknown): Appearance {
  if (!value || typeof value !== "object") return { ...DEFAULT_APPEARANCE };
  const input = value as Record<string, unknown>;
  return {
    mode: ["system", "light", "dark"].includes(String(input.mode)) ? input.mode as Appearance["mode"] : "system",
    accent: typeof input.accent === "string" && Object.hasOwn(ACCENTS, input.accent) ? input.accent as Appearance["accent"] : "blue",
  };
}
export function appearanceStorageKey(userId: string | null) {
  return "codezero.appearance.v1:" + (userId ? "account:" + encodeURIComponent(userId) : "visitor");
}
