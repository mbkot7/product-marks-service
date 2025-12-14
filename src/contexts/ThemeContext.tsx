import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const setTheme = (newTheme: Theme) => {
    console.log('ThemeContext: Setting theme to', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    console.log('ThemeContext: Applying theme', theme, 'to document element');
    
    root.classList.remove('light', 'dark', 'high-contrast');
    
    root.classList.add(theme);
    
    root.setAttribute('data-theme', theme);
    
    console.log('ThemeContext: Document classes after change:', root.className);
    console.log('ThemeContext: Document data-theme:', root.getAttribute('data-theme'));
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
