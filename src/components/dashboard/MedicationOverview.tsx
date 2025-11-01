// Compact medication statistics and tracking overview

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface MedicationStats {
  totalActive: number;
  expiringThisWeek: number;
  refillsNeeded: number;
  recentChanges: number;
}

interface MedicationOverviewProps {
  stats: MedicationStats;
}

export const MedicationOverview = memo(({ stats }: MedicationOverviewProps) => {
  const metrics = [
    {
      label: 'Active Prescriptions',
      value: stats.totalActive,
      icon: Pill,
      color: 'text-primary',
    },
    {
      label: 'Expiring This Week',
      value: stats.expiringThisWeek,
      icon: AlertCircle,
      color: 'text-warning',
    },
    {
      label: 'Refills Needed',
      value: stats.refillsNeeded,
      icon: RefreshCw,
      color: 'text-destructive',
    },
    {
      label: 'Recent Changes',
      value: stats.recentChanges,
      icon: TrendingUp,
      color: 'text-success',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medication Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div 
              key={index}
              className="p-3 rounded-lg border border-border bg-gradient-to-br from-card to-accent/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

MedicationOverview.displayName = 'MedicationOverview';
