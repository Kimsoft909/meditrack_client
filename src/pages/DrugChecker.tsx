// Professional drug interaction checker with DrugBank-quality features

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

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header with Clinical Disclaimer Tooltip */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Pill className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Drug Interaction Checker</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Evidence-based drug interaction analysis</p>
          </div>
        </div>
        
        {/* Clinical Disclaimer Tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 md:h-10 md:w-10 rounded-full border-2 hover:border-primary hover:bg-primary/5 transition-all"
                aria-label="Clinical decision support information"
              >
                <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              align="end" 
              className="max-w-sm md:max-w-md p-4 bg-card border-2 border-primary/20 shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-semibold">Clinical Decision Support Tool</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
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
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={checkInteractions}
                  disabled={!stats.canCheck || isChecking}
                  className="flex-1 gap-2 h-10 md:h-11"
                  size="lg"
                >
                  {isChecking ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Analyzing Interactions...</span>
                      <span className="sm:hidden">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Check Interactions
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  disabled={!stats.hasSelected}
                  className="gap-2 h-10 md:h-11 sm:w-auto"
                  size="lg"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
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
