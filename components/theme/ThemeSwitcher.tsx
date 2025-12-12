'use client';

import { useTheme, ThemeType } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Sun, Moon, Sunset, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes: Array<{ value: ThemeType; label: string; icon: typeof Sun; gradient?: string }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'sunset', label: 'Sunset', icon: Sunset, gradient: 'from-orange-400 via-pink-500 to-purple-600' },
  { value: 'ocean', label: 'Ocean', icon: Waves, gradient: 'from-cyan-400 via-blue-500 to-teal-600' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Palette;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {currentTheme?.gradient ? (
            <div className={cn('h-4 w-4 rounded-full bg-gradient-to-r', currentTheme.gradient)} />
          ) : (
            <CurrentIcon className="h-4 w-4" />
          )}
          <span className="hidden md:inline">{currentTheme?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                'gap-2 cursor-pointer',
                isActive && 'bg-accent'
              )}
            >
              {themeOption.gradient ? (
                <div className={cn('h-4 w-4 rounded-full bg-gradient-to-r', themeOption.gradient)} />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span>{themeOption.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
