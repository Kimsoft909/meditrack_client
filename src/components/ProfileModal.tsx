// Profile modal dropdown with user information and actions

import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileModalProps {
  onClose?: () => void;
}

export const ProfileModal = React.memo<ProfileModalProps>(({ onClose }) => {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
    onClose?.();
  }, [logout, onClose]);

  return (
    <div className="w-[280px] p-0">
      {/* User Info Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage 
              src={user?.avatar_url || undefined} 
              className="object-cover object-center"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground text-sm font-semibold">
              {user?.username?.substring(0, 2).toUpperCase() || 'DR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.full_name || user?.username || 'Doctor'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.specialty || 'Medical Professional'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
          <Mail className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground break-all">
            {user?.email || 'email@example.com'}
          </p>
        </div>
      </div>

      <Separator className="bg-border/60" />

      {/* Actions Section */}
      <div className="p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start h-8 text-xs font-medium hover:bg-accent/50"
          asChild
        >
          <Link to="/settings?tab=security" onClick={onClose}>
            <Settings className="h-3.5 w-3.5 mr-2" />
            Edit Profile
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-8 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
});

ProfileModal.displayName = 'ProfileModal';
