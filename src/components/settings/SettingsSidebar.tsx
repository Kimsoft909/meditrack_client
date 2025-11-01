// Settings navigation sidebar component

import React from 'react';
import { Type, Palette, Shield, Bell, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SettingsSection = 'typography' | 'theme' | 'security' | 'notifications' | 'help';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'help', label: 'Help & Feedback', icon: HelpCircle },
];

export const SettingsSidebar = React.memo<SettingsSidebarProps>(({ activeSection, onSectionChange }) => {
  return (
    <nav className="h-full w-48 bg-card border border-border rounded-lg p-3 space-y-1 overflow-hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
});

SettingsSidebar.displayName = 'SettingsSidebar';
