// Notifications sheet component that slides from the right

import React from 'react';
import { X, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Critical Patient Alert',
    message: 'Patient John Doe shows elevated blood pressure readings',
    time: '5 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Lab Results Ready',
    message: 'Blood work results for Patient Sarah Smith are now available',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Appointment Reminder',
    message: 'Follow-up consultation scheduled for 3:00 PM today',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'System Update',
    message: 'New drug interaction database has been updated',
    time: '1 day ago',
    read: true,
  },
  {
    id: '5',
    type: 'alert',
    title: 'Drug Interaction Detected',
    message: 'Potential interaction found in Patient Mike Johnson\'s prescription',
    time: '2 days ago',
    read: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'alert':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'reminder':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

export const NotificationsSheet = React.memo<NotificationsSheetProps>(({ open, onOpenChange }) => {
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 p-0">
        <SheetHeader className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-2">
            {MOCK_NOTIFICATIONS.map((notification) => (
              <div
                key={notification.id}
                className={`
                  p-3 mb-2 rounded-lg border transition-colors cursor-pointer
                  hover:bg-accent/50
                  ${notification.read 
                    ? 'bg-card border-border/50 opacity-70' 
                    : 'bg-card border-primary/20 shadow-sm'
                  }
                `}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});

NotificationsSheet.displayName = 'NotificationsSheet';
