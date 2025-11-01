// Security settings component for account management

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordChangeDialog } from './PasswordChangeDialog';
import { AvatarUploadDialog } from './AvatarUploadDialog';
import { KeyRound, User, Image } from 'lucide-react';

export const SecuritySettings = React.memo(() => {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const openPasswordDialog = useCallback(() => setPasswordDialogOpen(true), []);
  const closePasswordDialog = useCallback(() => setPasswordDialogOpen(false), []);
  
  const openAvatarDialog = useCallback(() => setAvatarDialogOpen(true), []);
  const closeAvatarDialog = useCallback(() => setAvatarDialogOpen(false), []);

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account Security</CardTitle>
            <CardDescription className="text-xs">
              Manage your password and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Password</p>
                  <p className="text-[10px] text-muted-foreground">Change your account password</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={openPasswordDialog} className="text-xs">
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profile Settings</CardTitle>
            <CardDescription className="text-xs">
              Customize your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Avatar</p>
                  <p className="text-[10px] text-muted-foreground">Update your profile picture</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={openAvatarDialog} className="text-xs">
                Upload
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Display Name</p>
                  <p className="text-[10px] text-muted-foreground">Managed in your profile</p>
                </div>
              </div>
              <Button size="sm" variant="outline" disabled className="text-xs">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PasswordChangeDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      <AvatarUploadDialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen} />
    </>
  );
});

SecuritySettings.displayName = 'SecuritySettings';
