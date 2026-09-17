import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type ColorScheme, type ThemeColors } from './colors';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  colors: themes.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const value = useMemo(() => ({ scheme, colors: themes[scheme] }), [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
