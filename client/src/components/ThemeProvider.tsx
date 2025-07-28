import { ReactNode } from "react";
import { ThemeProviderContext, useThemeState } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeState = useThemeState();

  return (
    <ThemeProviderContext.Provider value={themeState}>
      {children}
    </ThemeProviderContext.Provider>
  );
}