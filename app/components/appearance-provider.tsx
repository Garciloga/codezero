"use client";
import { useEffect } from "react";
import { ACCENTS, PALETTE_FIELDS, readableForeground, appearanceStorageKey, parseAppearance } from "../../lib/user-appearance";
import { VIVO_CSS_VARIABLES } from "../../lib/vivo-design";
export const APPEARANCE_EVENT = "codezero-appearance-changed";
export default function AppearanceProvider({ userId, serverPreference }: { userId: string | null; serverPreference?: unknown }) {
  useEffect(() => {
    const key = appearanceStorageKey(userId);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (serverPreference) {
      try { localStorage.setItem(key, JSON.stringify(parseAppearance(serverPreference))); } catch {}
    }
    let currentPreference: unknown = null;
    function apply() {
      let input: unknown;
      try { input = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { input = null; }
      const preference = parseAppearance(currentPreference ?? input ?? serverPreference);
      const dark = preference.mode === "dark" || (preference.mode === "system" && media.matches);
      const root = document.documentElement;
      root.dataset.appearance = dark ? "dark" : "light";
      const colors = preference.colors?.[dark ? "dark" : "light"] ?? {};
      root.dataset.customPalette = Object.keys(colors).length ? "true" : "false";
      for (const key of Object.keys(PALETTE_FIELDS)) {
        const token = "--vivo-" + key;
        const color = colors[key as keyof typeof colors];
        const fallback = (VIVO_CSS_VARIABLES as Record<string,string>)[token];
        if (color || fallback) root.style.setProperty(token, color || fallback);
        else root.style.removeProperty(token);
      }
      const accent = colors.primary ?? ACCENTS[preference.accent][dark ? "dark" : "light"];
      root.style.setProperty("--vivo-positive-text", readableForeground(colors.positive ?? (dark ? "#73D5BF" : "#0B7567")));
      root.style.setProperty("--user-accent", accent);
      root.style.setProperty("--user-accent-foreground", colors["button-text"] ?? readableForeground(accent));
    }
    apply();
    const onPreference = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail?.userId !== userId) return;
      currentPreference = event.detail.preference;
      apply();
    };
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) {currentPreference=null;apply();} };
    window.addEventListener(APPEARANCE_EVENT, onPreference);
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", apply);
    return () => {
      window.removeEventListener(APPEARANCE_EVENT, onPreference);
      window.removeEventListener("storage", onStorage);
      media.removeEventListener("change", apply);
    };
  }, [userId, serverPreference]);
  return null;
}

