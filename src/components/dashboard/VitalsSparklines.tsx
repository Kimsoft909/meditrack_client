// Compact sparkline charts showing aggregated vitals trends across all patients

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VitalTrend {
  label: string;
  current: string;
  data: number[];
  trend: number; // Percentage change
  unit: string;
}

interface VitalsSparklinesProps {
  trends: VitalTrend[];
}

export const VitalsSparklines = memo(({ trends }: VitalsSparklinesProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Average Vitals Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trends.map((vital, index) => {
          const isPositive = vital.trend > 0;
          const isNegative = vital.trend < 0;
          const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
          const trendColor = isPositive 
            ? 'text-success' 
            : isNegative 
            ? 'text-destructive' 
            : 'text-muted-foreground';

          const chartData = vital.data.map((value, idx) => ({ value, index: idx }));

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{vital.label}</span>
                  <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(vital.trend)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {vital.current} {vital.unit}
                  </span>
                  <div className="flex-1 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

VitalsSparklines.displayName = 'VitalsSparklines';
