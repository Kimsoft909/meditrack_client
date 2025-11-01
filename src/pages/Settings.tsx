// Settings and preferences page

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Settings configuration coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
