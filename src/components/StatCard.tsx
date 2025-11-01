// Compact stat card component for dashboard metrics

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success';
  subtitle?: string;
}

const variantStyles = {
  default: 'text-primary',
  critical: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
};

export const StatCard = memo(({ title, value, icon: Icon, variant = 'default', subtitle }: StatCardProps) => {
  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
            <p className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted ${variantStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
