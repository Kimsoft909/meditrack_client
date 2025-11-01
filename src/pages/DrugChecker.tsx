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
  Activity
} from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
            <Pill className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Drug Interaction Checker</h1>
            <p className="text-xs text-muted-foreground">Evidence-based drug interaction analysis</p>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats.hasSelected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
      <Tabs defaultValue="checker" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="checker" className="gap-2">
            <Search className="h-4 w-4" />
            Interaction Checker
          </TabsTrigger>
          <TabsTrigger value="fda" className="gap-2">
            <Info className="h-4 w-4" />
            FDA Lookup
          </TabsTrigger>
        </TabsList>

        {/* Interaction Checker Tab */}
        <TabsContent value="checker" className="space-y-6">
          {/* Drug Selection Card */}
          <Card className="medical-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Select Medications</CardTitle>
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
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {isChecking ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Interactions...
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
                  className="gap-2"
                  size="lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
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
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Pill className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">No Medications Selected</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
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
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">Ready to Analyze</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {selectedDrugs.length} medications selected. Click "Check Interactions" to analyze potential drug interactions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FDA Drug Lookup Tab */}
        <TabsContent value="fda" className="space-y-6">
          <FDADrugSearch />
        </TabsContent>
      </Tabs>

      {/* Clinical Disclaimer */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Clinical Decision Support Tool</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This tool provides evidence-based guidance for drug-drug interactions based on clinical literature 
                and pharmaceutical databases. Always use clinical judgment, consider patient-specific factors (age, 
                comorbidities, pharmacogenomics), and consult authoritative drug references for complete prescribing 
                information. This tool is not a substitute for professional medical judgment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrugChecker;
