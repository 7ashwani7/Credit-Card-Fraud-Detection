import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const resolvedTheme = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;

  // Apply data-theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setThemeMode = (mode) => {
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return;
    setThemeModeState(mode);
    try {
      localStorage.setItem('theme', mode);
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
