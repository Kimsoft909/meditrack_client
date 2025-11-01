// Real-time activity feed showing recent system events and actions

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, UserPlus, Activity, FileText, Pill } from 'lucide-react';
import { format } from 'date-fns';

export interface ActivityEvent {
  id: string;
  type: 'patient_added' | 'vitals_recorded' | 'report_generated' | 'medication_updated';
  message: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const eventIcons = {
  patient_added: UserPlus,
  vitals_recorded: Activity,
  report_generated: FileText,
  medication_updated: Pill,
};

const eventColors = {
  patient_added: 'text-success',
  vitals_recorded: 'text-primary',
  report_generated: 'text-chart-2',
  medication_updated: 'text-warning',
};

export const ActivityFeed = memo(({ events }: ActivityFeedProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="px-4 pb-4 space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              events.map((event) => {
                const Icon = eventIcons[event.type];
                const iconColor = eventColors[event.type];

                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={cn('mt-0.5', iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(event.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

ActivityFeed.displayName = 'ActivityFeed';

// Helper import for cn utility
import { cn } from '@/lib/utils';
