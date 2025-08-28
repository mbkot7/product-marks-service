import { Button } from '@/components/ui/button';
import { Moon, Sun, Contrast } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'high-contrast', icon: Contrast, label: 'High Contrast' },
  ] as const;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'high-contrast') => {
    console.log('Changing theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {themes.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant={theme === id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleThemeChange(id)}
          className="h-8 w-8 p-0"
          title={`${label} (Current: ${theme})`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
