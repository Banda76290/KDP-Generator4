import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light";
};

export const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

export const useThemeState = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem("kdp-theme");
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
    // Default to system preference
    return "system";
  });

  const [actualTheme, setActualTheme] = useState<"dark" | "light">(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme as "dark" | "light";
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("kdp-theme", theme);

    // Update actual theme based on selection
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateTheme = () => {
        setActualTheme(mediaQuery.matches ? "dark" : "light");
      };
      
      updateTheme();
      mediaQuery.addEventListener("change", updateTheme);
      
      return () => mediaQuery.removeEventListener("change", updateTheme);
    } else {
      setActualTheme(theme as "dark" | "light");
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(actualTheme);
  }, [actualTheme]);

  return { theme, setTheme, actualTheme };
};