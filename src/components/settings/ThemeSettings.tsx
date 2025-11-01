// Theme settings component for appearance control

import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { ThemeMode } from '@/types/settings';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ThemeOption {
  id: ThemeMode;
  label: string;
  description: string;
  icon: React.ElementType;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: ThemeMode.LIGHT, label: 'Light', description: 'Clean and bright interface', icon: Sun },
  { id: ThemeMode.DARK, label: 'Dark', description: 'Easy on the eyes', icon: Moon },
  { id: ThemeMode.SYSTEM, label: 'System', description: 'Follow system preference', icon: Monitor },
];

export const ThemeSettings = React.memo(() => {
  const { settings, updateTheme } = useSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const handleThemeChange = useCallback((theme: ThemeMode) => {
    updateTheme(theme);
    setTheme(theme);
    toast.success(`Theme changed to ${theme}`);
  }, [updateTheme, setTheme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Appearance</CardTitle>
        <CardDescription className="text-xs">
          Customize how MediTrack looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = settings.theme === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all text-left',
                  'hover:border-primary hover:bg-accent/50',
                  isActive 
                    ? 'border-primary bg-accent' 
                    : 'border-border bg-card'
                )}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <Icon className={cn(
                  'h-5 w-5 mb-2',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div className="text-xs font-medium mb-0.5">{option.label}</div>
                <div className="text-[10px] text-muted-foreground">{option.description}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

ThemeSettings.displayName = 'ThemeSettings';
