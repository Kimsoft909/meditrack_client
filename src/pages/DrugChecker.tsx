// Professional drug interaction checker with DrugBank-quality features

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pill, 
  Info,
  Search,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Activity,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDrugInteraction } from '@/hooks/useDrugInteraction';
import { DrugSelector } from '@/components/DrugSelector';
import { InteractionResults } from '@/components/InteractionResults';
import { FDADrugSearch } from '@/components/FDADrugSearch';
import { StatCard } from '@/components/StatCard';

const DrugChecker = () => {
  const {
    selectedDrugs,
    interactions,
    isChecking,
    stats,
    addDrug,
    removeDrug,
    clearAll,
    checkInteractions,
  } = useDrugInteraction();

  // Keyboard shortcut: Ctrl+Enter to check interactions
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && stats.canCheck && !isChecking) {
        e.preventDefault();
        checkInteractions();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stats.canCheck, isChecking, checkInteractions]);

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header with Clinical Disclaimer Tooltip */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Pill className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Drug Interaction Checker</h1>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 rounded-full border hover:border-primary"
                    >
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    align="start"
                    className="max-w-[90vw] sm:max-w-md p-3 sm:p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                        <p className="text-xs sm:text-sm font-semibold">Clinical Decision Support Tool</p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        This tool provides evidence-based guidance for drug-drug interactions based on clinical literature 
                        and pharmaceutical databases. Always use clinical judgment, consider patient-specific factors (age, 
                        comorbidities, pharmacogenomics), and consult authoritative drug references for complete prescribing 
                        information. This tool is not a substitute for professional medical judgment.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Evidence-based drug interaction analysis</p>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats.hasSelected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <StatCard
            title="Drugs Selected"
            value={selectedDrugs.length}
            icon={Pill}
            variant="default"
          />
          <StatCard
            title="Interactions Found"
            value={stats.total}
            icon={Activity}
            variant={stats.contraindicated > 0 ? 'critical' : stats.major > 0 ? 'warning' : 'default'}
            subtitle={stats.total > 0 ? `${stats.contraindicated + stats.major} require attention` : undefined}
          />
          <StatCard
            title="Critical Alerts"
            value={stats.contraindicated}
            icon={stats.contraindicated > 0 ? ShieldAlert : AlertTriangle}
            variant={stats.contraindicated > 0 ? 'critical' : 'default'}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="checker" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[420px] h-11 md:h-12 bg-muted/50 p-1.5 border border-border shadow-sm">
          <TabsTrigger 
            value="checker" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Interaction Checker</span>
            <span className="sm:hidden">Checker</span>
          </TabsTrigger>
          <TabsTrigger 
            value="fda" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Drug Lookup</span>
            <span className="sm:hidden">Lookup</span>
          </TabsTrigger>
        </TabsList>

        {/* Interaction Checker Tab */}
        <TabsContent value="checker" className="space-y-4 md:space-y-6">
          {/* Drug Selection Card */}
          <Card className="medical-card shadow-sm">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold">Select Medications</CardTitle>
              <CardDescription className="text-xs">
                Search and add medications to analyze potential drug-drug interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drug Selector Component */}
              <DrugSelector
                selectedDrugs={selectedDrugs}
                onAddDrug={addDrug}
                onRemoveDrug={removeDrug}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={checkInteractions}
                  disabled={!stats.canCheck || isChecking}
                  variant="secondary"
                  className="gap-2 h-9"
                  size="sm"
                >
                  {isChecking ? (
                    <>
                      <div className="h-3 w-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      <span className="text-xs">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3" />
                      <span className="text-xs">Check (Ctrl+Enter)</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  disabled={!stats.hasSelected}
                  className="gap-2 h-9"
                  size="sm"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="text-xs">Clear All</span>
                </Button>
              </div>

              {/* Helper Text */}
              {!stats.canCheck && stats.hasSelected && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Add at least {2 - selectedDrugs.length} more medication{2 - selectedDrugs.length !== 1 ? 's' : ''} to check for interactions
                </p>
              )}
            </CardContent>
          </Card>

          {/* Interaction Results */}
          {interactions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InteractionResults
                interactions={interactions}
                drugCount={selectedDrugs.length}
              />
            </div>
          )}

          {/* Empty State */}
          {selectedDrugs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 md:py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Pill className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold mb-1">No Medications Selected</h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-md px-4">
                      Start by searching and selecting medications above. You need at least 2 drugs to perform an interaction analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ready to Check State */}
          {selectedDrugs.length >= 2 && interactions.length === 0 && (
            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardContent className="py-6 md:py-8">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold mb-1">Ready to Analyze</h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-md px-4">
                      {selectedDrugs.length} medications selected. Click "Check Interactions" to analyze potential drug interactions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Drug Lookup Tab */}
        <TabsContent value="fda" className="space-y-4 md:space-y-6">
          <FDADrugSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DrugChecker;
