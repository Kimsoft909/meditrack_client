// Displays drug interaction analysis results
// Organized by severity with clinical guidance

import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, TrendingUp, ExternalLink, Clock } from 'lucide-react';
import { DrugInteraction, InteractionSeverity } from '@/types/drug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface InteractionResultsProps {
  interactions: DrugInteraction[];
  drugCount: number;
}

// Severity configuration for styling and display
const severityConfig = {
  [InteractionSeverity.CONTRAINDICATED]: {
    icon: AlertTriangle,
    label: 'CONTRAINDICATED',
    color: 'text-destructive',
    borderColor: 'border-l-destructive',
    bgColor: 'bg-destructive/5',
    badgeVariant: 'destructive' as const,
  },
  [InteractionSeverity.MAJOR]: {
    icon: AlertCircle,
    label: 'MAJOR',
    color: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    badgeVariant: 'default' as const,
  },
  [InteractionSeverity.MODERATE]: {
    icon: Info,
    label: 'MODERATE',
    color: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    badgeVariant: 'secondary' as const,
  },
  [InteractionSeverity.MINOR]: {
    icon: TrendingUp,
    label: 'MINOR',
    color: 'text-muted-foreground',
    borderColor: 'border-l-border',
    bgColor: 'bg-muted/30',
    badgeVariant: 'outline' as const,
  },
};

export function InteractionResults({ interactions, drugCount }: InteractionResultsProps) {
  // Group interactions by severity
  const groupedInteractions = useMemo(() => {
    return {
      contraindicated: interactions.filter(i => i.severity === InteractionSeverity.CONTRAINDICATED),
      major: interactions.filter(i => i.severity === InteractionSeverity.MAJOR),
      moderate: interactions.filter(i => i.severity === InteractionSeverity.MODERATE),
      minor: interactions.filter(i => i.severity === InteractionSeverity.MINOR),
    };
  }, [interactions]);

  if (interactions.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Summary Card - Compact */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-primary" />
            Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <div className="text-lg font-bold">{drugCount}</div>
              <div className="text-[10px] text-muted-foreground">Drugs</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <div className="text-lg font-bold">{interactions.length}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 bg-destructive/5 rounded-md">
              <div className="text-lg font-bold text-destructive">{groupedInteractions.contraindicated.length}</div>
              <div className="text-[10px] text-muted-foreground">Contra</div>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
              <div className="text-lg font-bold text-orange-600">{groupedInteractions.major.length}</div>
              <div className="text-[10px] text-muted-foreground">Major</div>
            </div>
            <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
              <div className="text-lg font-bold text-amber-600">{groupedInteractions.moderate.length}</div>
              <div className="text-[10px] text-muted-foreground">Moderate</div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded-md">
              <div className="text-lg font-bold text-muted-foreground">{groupedInteractions.minor.length}</div>
              <div className="text-[10px] text-muted-foreground">Minor</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical/Major Interactions */}
      {(groupedInteractions.contraindicated.length > 0 || groupedInteractions.major.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Critical Interactions Requiring Immediate Attention
          </h3>
          {[...groupedInteractions.contraindicated, ...groupedInteractions.major].map((interaction) => (
            <InteractionCard key={interaction.id} interaction={interaction} />
          ))}
        </div>
      )}

      {/* Moderate Interactions */}
      {groupedInteractions.moderate.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Moderate Interactions Requiring Monitoring
          </h3>
          {groupedInteractions.moderate.map((interaction) => (
            <InteractionCard key={interaction.id} interaction={interaction} />
          ))}
        </div>
      )}

      {/* Minor Interactions - Collapsible */}
      {groupedInteractions.minor.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <TrendingUp className="h-4 w-4" />
            Minor Interactions ({groupedInteractions.minor.length})
            <span className="text-xs font-normal">(Click to expand)</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {groupedInteractions.minor.map((interaction) => (
              <InteractionCard key={interaction.id} interaction={interaction} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// Individual interaction card component
function InteractionCard({ interaction }: { interaction: DrugInteraction }) {
  const config = severityConfig[interaction.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "border-l-4 rounded-r-lg p-4 space-y-3 transition-all hover:shadow-md",
        config.borderColor,
        config.bgColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.color)} />
          <div>
            <h4 className="font-semibold text-sm">
              {interaction.drug1.name} + {interaction.drug2.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Evidence: {interaction.evidenceLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Mechanism */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Mechanism
        </p>
        <p className="text-sm">{interaction.mechanism}</p>
      </div>

      {/* Clinical Effects */}
      {interaction.clinicalEffects.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Clinical Effects
          </p>
          <ul className="text-sm space-y-1">
            {interaction.clinicalEffects.map((effect, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-destructive font-bold mt-0.5">•</span>
                <span>{effect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* Management */}
      <div className="bg-card/50 rounded-md p-3 space-y-2">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Clinical Management
        </p>
        <p className="text-sm leading-relaxed">{interaction.management}</p>
      </div>

      {/* Monitoring Parameters */}
      {interaction.monitoringParameters && interaction.monitoringParameters.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Monitoring Required
          </p>
          <ul className="text-sm space-y-1">
            {interaction.monitoringParameters.map((param, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>{param}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer: References & Last Updated */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Updated: {new Date(interaction.lastUpdated).toLocaleDateString()}
        </div>
        {interaction.references.length > 0 && (
          <div className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {interaction.references.length} Reference(s)
          </div>
        )}
      </div>
    </div>
  );
}
