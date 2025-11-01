// Line chart component for displaying patient vitals trends

import { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Vitals } from '@/types/patient';
import { format } from 'date-fns';

type ChartDataKey = 'heartRate' | 'oxygenSaturation' | 'temperature' | 'systolic' | 'diastolic' | 'glucose';

interface VitalsChartProps {
  vitals: Vitals[];
  dataKeys?: ChartDataKey[];
  height?: number;
}

// Using memo to prevent unnecessary re-renders during chart updates
export const VitalsChart = memo(({ vitals, dataKeys = ['heartRate', 'oxygenSaturation'], height = 300 }: VitalsChartProps) => {
  // Transform vitals data for recharts with memoization for performance
  const chartData = useMemo(() => {
    return vitals
      .slice(0, 14) // Last 14 readings for clarity
      .reverse()
      .map((vital) => ({
        date: format(vital.timestamp, 'MM/dd'),
        heartRate: vital.heartRate,
        oxygenSaturation: vital.oxygenSaturation,
        temperature: vital.temperature,
        systolic: vital.bloodPressureSystolic,
        diastolic: vital.bloodPressureDiastolic,
        glucose: vital.bloodGlucose,
      }));
  }, [vitals]);

  const lineConfig = {
    heartRate: { stroke: 'hsl(var(--primary))', name: 'Heart Rate (bpm)' },
    oxygenSaturation: { stroke: 'hsl(var(--secondary))', name: 'O₂ Sat (%)' },
    temperature: { stroke: 'hsl(var(--warning))', name: 'Temp (°C)' },
    systolic: { stroke: 'hsl(var(--destructive))', name: 'Systolic (mmHg)' },
    diastolic: { stroke: 'hsl(var(--success))', name: 'Diastolic (mmHg)' },
    glucose: { stroke: 'hsl(var(--accent-foreground))', name: 'Glucose (mg/dL)' },
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <YAxis 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <Tooltip 
          contentStyle={{ 
            fontSize: '12px',
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '11px' }}
          iconType="line"
        />
        {dataKeys.map((key) => (
          <Line
            key={key as string}
            type="monotone"
            dataKey={key as string}
            stroke={lineConfig[key as keyof typeof lineConfig]?.stroke}
            name={lineConfig[key as keyof typeof lineConfig]?.name}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

VitalsChart.displayName = 'VitalsChart';
