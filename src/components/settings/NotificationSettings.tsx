// Notification preferences component

import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

export const NotificationSettings = React.memo(() => {
  const { settings, updateNotifications } = useSettings();

  const handleInAppChange = useCallback((checked: boolean) => {
    updateNotifications({ inApp: checked });
    toast.success(checked ? 'In-app notifications enabled' : 'In-app notifications disabled');
  }, [updateNotifications]);

  const handleEmailChange = useCallback((checked: boolean) => {
    updateNotifications({ email: checked });
    toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
  }, [updateNotifications]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Notification Preferences</CardTitle>
        <CardDescription className="text-xs">
          Control how you receive updates and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="in-app" className="text-xs font-medium">
              In-app notifications
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Show toast messages for important events
            </p>
          </div>
          <Switch
            id="in-app"
            checked={settings.notifications.inApp}
            onCheckedChange={handleInAppChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Email notifications
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Receive updates via email
            </p>
          </div>
          <Switch
            id="email"
            checked={settings.notifications.email}
            onCheckedChange={handleEmailChange}
          />
        </div>
      </CardContent>
    </Card>
  );
});

NotificationSettings.displayName = 'NotificationSettings';
