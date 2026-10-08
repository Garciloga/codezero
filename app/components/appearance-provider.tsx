"use client";
import { useEffect } from "react";
import { ACCENTS, appearanceStorageKey, parseAppearance } from "../../lib/user-appearance";
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
      root.style.setProperty("--user-accent", root.dataset.design === "vivo" ? "var(--vivo-primary)" : ACCENTS[preference.accent][dark ? "dark" : "light"]);
      root.style.setProperty("--user-accent-foreground", root.dataset.design === "vivo" ? "#ffffff" : dark ? "#101828" : "#ffffff");
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

