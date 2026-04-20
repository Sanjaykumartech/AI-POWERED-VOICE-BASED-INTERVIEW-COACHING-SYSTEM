export type AppTheme = "light" | "dark" | "system";

export const themeStorageKey = "ai-interview-theme";

export const resolveTheme = (theme: AppTheme) => {
  if (theme !== "system") {
    return theme;
  }

  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return "dark";
};

export const applyTheme = (theme: AppTheme) => {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  localStorage.setItem(themeStorageKey, theme);
  return resolved;
};

export const getStoredTheme = (): AppTheme => {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
};
