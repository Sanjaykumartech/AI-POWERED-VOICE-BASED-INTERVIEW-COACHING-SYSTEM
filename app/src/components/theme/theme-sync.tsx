"use client";

import { useEffect } from "react";

import { applyTheme, getStoredTheme } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const syncTheme = () => {
      const storedTheme = getStoredTheme();
      applyTheme(storedTheme);
    };

    syncTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      if (getStoredTheme() === "system") {
        syncTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return null;
}
