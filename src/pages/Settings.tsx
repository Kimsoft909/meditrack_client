// Settings page with comprehensive configuration options

import React, { useState, lazy, Suspense } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsSidebar, SettingsSection } from '@/components/settings/SettingsSidebar';
import { Skeleton } from '@/components/ui/skeleton';

const TypographySettings = lazy(() => import('@/components/settings/TypographySettings').then(m => ({ default: m.TypographySettings })));
const ThemeSettings = lazy(() => import('@/components/settings/ThemeSettings').then(m => ({ default: m.ThemeSettings })));
const SecuritySettings = lazy(() => import('@/components/settings/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings').then(m => ({ default: m.NotificationSettings })));
const HelpAndFeedback = lazy(() => import('@/components/settings/HelpAndFeedback').then(m => ({ default: m.HelpAndFeedback })));

const SettingsContentSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('typography');

  const renderContent = () => {
    switch (activeSection) {
      case 'typography':
        return <TypographySettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'help':
        return <HelpAndFeedback />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Customize your MediTrack experience</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 overflow-y-auto pr-2">
          <Suspense fallback={<SettingsContentSkeleton />}>
            {renderContent()}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Settings;
