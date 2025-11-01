// Risk level indicator badge with clinical color coding

import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/types/patient';
import { memo } from 'react';

interface RiskBadgeProps {
  level: RiskLevel;
  compact?: boolean;
}

const riskConfig = {
  [RiskLevel.LOW]: {
    label: 'Stable',
    className: 'status-stable',
  },
  [RiskLevel.MODERATE]: {
    label: 'Moderate',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  [RiskLevel.HIGH]: {
    label: 'High Risk',
    className: 'status-warning',
  },
  [RiskLevel.CRITICAL]: {
    label: 'Critical',
    className: 'status-critical',
  },
};

export const RiskBadge = memo(({ level, compact = false }: RiskBadgeProps) => {
  const config = riskConfig[level];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${compact ? 'text-xs px-1.5 py-0' : 'text-xs'}`}
    >
      {config.label}
    </Badge>
  );
});

RiskBadge.displayName = 'RiskBadge';
