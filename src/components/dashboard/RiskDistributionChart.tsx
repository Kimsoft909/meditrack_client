// Donut chart showing patient risk level distribution across the hospital

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

interface RiskDistributionData {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

interface RiskDistributionChartProps {
  data: RiskDistributionData;
}

// Using semantic color tokens from the design system
const RISK_COLORS = {
  critical: 'hsl(var(--destructive))',
  high: 'hsl(var(--warning))',
  moderate: 'hsl(var(--chart-2))',
  low: 'hsl(var(--success))',
};

export const RiskDistributionChart = memo(({ data }: RiskDistributionChartProps) => {
  const chartData = [
    { name: 'Critical', value: data.critical, color: RISK_COLORS.critical },
    { name: 'High', value: data.high, color: RISK_COLORS.high },
    { name: 'Moderate', value: data.moderate, color: RISK_COLORS.moderate },
    { name: 'Low', value: data.low, color: RISK_COLORS.low },
  ].filter(item => item.value > 0); // Only show non-zero values

  const total = data.critical + data.high + data.moderate + data.low;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Risk Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} patients`, 'Count']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">Total Patients</p>
        </div>
      </CardContent>
    </Card>
  );
});

RiskDistributionChart.displayName = 'RiskDistributionChart';
