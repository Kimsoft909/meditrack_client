// Drug interaction checker with autocomplete and severity analysis

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  AlertTriangle, 
  Info, 
  Search,
  Plus,
  X,
  Save,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Drug {
  id: string;
  name: string;
}

interface Interaction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  mechanism: string;
  advice: string;
}

const commonDrugs = [
  'Aspirin', 'Warfarin', 'Metformin', 'Lisinopril', 'Atorvastatin',
  'Metoprolol', 'Amlodipine', 'Omeprazole', 'Levothyroxine', 'Albuterol',
  'Gabapentin', 'Losartan', 'Sertraline', 'Montelukast', 'Furosemide'
];

const mockInteractions: Interaction[] = [
  {
    id: '1',
    drug1: 'Warfarin',
    drug2: 'Aspirin',
    severity: 'critical',
    mechanism: 'Both drugs have anticoagulant properties, increasing bleeding risk when combined.',
    advice: 'Avoid combination. If unavoidable, monitor INR closely and watch for bleeding signs.',
  },
  {
    id: '2',
    drug1: 'Metformin',
    drug2: 'Lisinopril',
    severity: 'moderate',
    mechanism: 'ACE inhibitors may enhance the blood sugar lowering effect of antidiabetic agents.',
    advice: 'Monitor blood glucose levels. Dose adjustment of Metformin may be required.',
  },
  {
    id: '3',
    drug1: 'Atorvastatin',
    drug2: 'Amlodipine',
    severity: 'minor',
    mechanism: 'Amlodipine may increase the serum concentration of Atorvastatin.',
    advice: 'Generally safe combination. Monitor for statin-related side effects.',
  },
];

const DrugChecker = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const { toast } = useToast();

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.length > 0) {
      const filtered = commonDrugs.filter(drug =>
        drug.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addDrug = (drugName: string) => {
    if (!drugs.find(d => d.name === drugName)) {
      setDrugs([...drugs, { id: Date.now().toString(), name: drugName }]);
      setInputValue('');
      setSuggestions([]);
    }
  };

  const removeDrug = (id: string) => {
    setDrugs(drugs.filter(d => d.id !== id));
  };

  const checkInteractions = () => {
    if (drugs.length < 2) {
      toast({
        title: 'Add more drugs',
        description: 'Please add at least 2 drugs to check for interactions.',
        variant: 'destructive',
      });
      return;
    }

    // Simulate interaction checking
    setInteractions(mockInteractions);
    toast({
      title: 'Analysis Complete',
      description: `Found ${mockInteractions.length} potential interactions`,
    });
  };

  const saveToRecord = () => {
    toast({
      title: 'Saved',
      description: 'Drug interaction check saved to patient record',
    });
  };

  const severityConfig = {
    critical: { color: 'status-critical', icon: ShieldAlert, label: 'Critical' },
    major: { color: 'status-warning', icon: AlertTriangle, label: 'Major' },
    moderate: { color: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle, label: 'Moderate' },
    minor: { color: 'bg-muted text-muted-foreground', icon: Info, label: 'Minor' },
  };

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
            <p className="text-xs text-muted-foreground">Check for potential drug-drug interactions</p>
          </div>
        </div>
      </div>

      {/* Drug Input Section */}
      <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Add Medications</CardTitle>
          <CardDescription className="text-xs">
            Enter drug names to check for potential interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input with Autocomplete */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue) {
                    addDrug(inputValue);
                  }
                }}
                placeholder="Type drug name..."
                className="pl-10 h-10 text-sm"
              />
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-48 overflow-y-auto">
                <CardContent className="p-2">
                  {suggestions.map((drug) => (
                    <button
                      key={drug}
                      onClick={() => addDrug(drug)}
                      className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent transition-colors"
                    >
                      {drug}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Added Drugs */}
          <div className="flex flex-wrap gap-2">
            {drugs.map((drug) => (
              <Badge
                key={drug.id}
                variant="secondary"
                className="pl-3 pr-2 py-1.5 text-xs gap-2"
              >
                {drug.name}
                <button
                  onClick={() => removeDrug(drug.id)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {drugs.length === 0 && (
              <p className="text-xs text-muted-foreground">No drugs added yet</p>
            )}
          </div>

          {/* Check Button */}
          <Button
            onClick={checkInteractions}
            disabled={drugs.length < 2}
            className="w-full gap-2"
          >
            <Search className="h-4 w-4" />
            Check Interactions
          </Button>
        </CardContent>
      </Card>

      {/* Interactions Results */}
      {interactions.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Interaction Results</CardTitle>
                <CardDescription className="text-xs">
                  {interactions.length} potential interactions found
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={saveToRecord} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                Save to Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interactions.map((interaction) => {
                const config = severityConfig[interaction.severity];
                const Icon = config.icon;

                return (
                  <div
                    key={interaction.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-semibold">
                            {interaction.drug1} + {interaction.drug2}
                          </h4>
                          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Mechanism:</p>
                            <p className="text-xs">{interaction.mechanism}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Clinical Advice:</p>
                            <p className="text-xs">{interaction.advice}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Clinical Decision Support</p>
              <p className="text-xs text-muted-foreground">
                This tool provides guidance based on known drug interactions. Always use clinical judgment 
                and consider patient-specific factors. Consult drug references for complete information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrugChecker;
