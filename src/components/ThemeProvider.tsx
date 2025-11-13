import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from '@/types/mcp';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      defaultTheme="dark"
      enableSystem={false}
      attribute="class"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
