// BMI visual indicator with color-coded gauge

import { memo } from 'react';
import { Activity } from 'lucide-react';
import { getBMICategory, getBMIColor, getBMIBackgroundColor } from '@/utils/medical';

interface BMIIndicatorProps {
  bmi: number;
  weight: number;
  height: number;
  compact?: boolean;
}

export const BMIIndicator = memo(({ bmi, weight, height, compact = false }: BMIIndicatorProps) => {
  const category = getBMICategory(bmi);
  const categoryLabels = {
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obese',
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getBMIBackgroundColor(bmi)}`}>
        <Activity className={`h-4 w-4 ${getBMIColor(bmi)}`} />
        <span className={`font-semibold ${getBMIColor(bmi)}`}>{bmi}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${getBMIBackgroundColor(bmi)} border border-border/50`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`h-5 w-5 ${getBMIColor(bmi)}`} />
          <h3 className="font-semibold text-sm">Body Mass Index</h3>
        </div>
        <span className={`text-2xl font-bold ${getBMIColor(bmi)}`}>{bmi}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Category: <span className={`font-medium ${getBMIColor(bmi)}`}>{categoryLabels[category]}</span></span>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Weight: {weight} kg</span>
          <span>Height: {height} m</span>
        </div>
        
        {/* BMI Range Indicator */}
        <div className="relative h-2 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded-full mt-3">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-foreground rounded-full"
            style={{ left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
        </div>
      </div>
    </div>
  );
});

BMIIndicator.displayName = 'BMIIndicator';
