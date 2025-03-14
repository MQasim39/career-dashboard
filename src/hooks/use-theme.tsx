
import { createContext, useContext, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";

interface ThemeContextType {
  theme: string;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  
  // Apply theme whenever settings change
  useEffect(() => {
    // Apply the theme (dark, light, system)
    const root = document.documentElement;
    
    if (settings.colorTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.colorTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else if (settings.colorTheme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      
      // Add listener for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.colorTheme]);
  
  // Apply accent color whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all previous accent classes
    const accentClasses = ['accent-purple', 'accent-blue', 'accent-green', 'accent-orange', 'accent-pink'];
    accentClasses.forEach(cls => root.classList.remove(cls));
    
    // Add the new accent class
    root.classList.add(`accent-${settings.accentColor}`);
  }, [settings.accentColor]);
  
  const value = {
    theme: settings.colorTheme,
    accentColor: settings.accentColor
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
