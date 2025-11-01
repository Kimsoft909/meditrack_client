// Compact KPI metric card with trend indicators for dashboard overview

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPIMetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number; // Percentage change (positive or negative)
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'critical';
}

const variantStyles = {
  default: 'border-border',
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  critical: 'border-destructive/30 bg-destructive/5',
};

const variantIconColors = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  critical: 'text-destructive',
};

export const KPIMetricCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  onClick,
  variant = 'default'
}: KPIMetricCardProps) => {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;
  const isNeutralTrend = trend === 0;

  const TrendIcon = isPositiveTrend ? TrendingUp : isNegativeTrend ? TrendingDown : Minus;
  const trendColor = isPositiveTrend 
    ? 'text-success' 
    : isNegativeTrend 
    ? 'text-destructive' 
    : 'text-muted-foreground';

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn('h-5 w-5', variantIconColors[variant])} />
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
});

KPIMetricCard.displayName = 'KPIMetricCard';
