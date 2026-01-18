import { useEffect, useState } from "react";

type ThemeState = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeState>(() => {
    if (typeof window === "undefined") return "light";
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
  };
}
