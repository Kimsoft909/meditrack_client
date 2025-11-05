import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Activity, Pill, AlertTriangle, TrendingUp, BarChart3, Loader2, Search } from 'lucide-react';
import { patientService } from '@/services/patientService';
import type { AnalysisOptions } from '@/types/analysis';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';

interface AnalysisConfigPanelProps {
  onGenerate: (
    patientId: string,
    dateRange: { from: Date; to: Date },
    options: AnalysisOptions
  ) => void;
  isGenerating: boolean;
}

export function AnalysisConfigPanel({ onGenerate, isGenerating }: AnalysisConfigPanelProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    to: new Date()
  });

  const [options, setOptions] = useState<AnalysisOptions>({
    includeVitals: true,
    includeMedications: true,
    includeRiskAssessment: true,
    includeTrendAnalysis: true,
    includeComparativeAnalysis: false
  });

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientService.getPatients({ page: 1, pageSize: 100 });
        setPatients(response.patients);
      } catch (error) {
        console.error('Failed to fetch patients', error);
      }
    };
    
    fetchPatients();
  }, []);

  const handleQuickDateRange = (days: number) => {
    setDateRange({
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      to: new Date()
    });
  };

  const handleGenerate = () => {
    if (selectedPatientId) {
      onGenerate(selectedPatientId, dateRange, options);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2.5 h-fit">
      <div>
        <h3 className="text-sm font-semibold mb-0.5">Configuration</h3>
        <p className="text-[10px] text-muted-foreground">Select patient and analysis parameters</p>
      </div>

      {/* Patient Search */}
      <div className="space-y-1.5">
        <Label className="text-xs">Patient</Label>
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              size="sm"
              aria-expanded={searchOpen}
              className="w-full justify-between h-7"
            >
              <span className="truncate text-xs">{selectedPatientName || "Search patient..."}</span>
              <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search by name..." className="h-7 text-xs" />
              <CommandEmpty className="text-xs py-2">No patient found.</CommandEmpty>
              <CommandGroup className="max-h-48 overflow-auto">
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={`${patient.id} ${patient.name}`}
                    onSelect={() => {
                      setSelectedPatientId(patient.id);
                      setSelectedPatientName(`${patient.name} (${patient.id})`);
                      setSearchOpen(false);
                    }}
                    className="text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{patient.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {patient.id} • {patient.age}yo • {patient.sex}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Range */}
      <div className="space-y-1.5">
        <Label className="text-xs">Analysis Period</Label>
        <div className="flex flex-col sm:flex-row gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal h-7 text-xs",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                <span className="truncate">{dateRange.from ? format(dateRange.from, "PP") : "From"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal h-7 text-xs",
                  !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                <span className="truncate">{dateRange.to ? format(dateRange.to, "PP") : "To"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleQuickDateRange(30)}>
            30d
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleQuickDateRange(90)}>
            3mo
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleQuickDateRange(180)}>
            6mo
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleQuickDateRange(365)}>
            1yr
          </Button>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="space-y-1.5">
        <Label className="text-xs">Include in Report</Label>
        
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vitals"
              checked={options.includeVitals}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeVitals: checked as boolean })
              }
              className="h-3 w-3"
            />
            <Label htmlFor="vitals" className="flex items-center gap-1.5 cursor-pointer text-xs">
              <Activity className="h-3 w-3 text-primary" />
              Vital Signs
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="medications"
              checked={options.includeMedications}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeMedications: checked as boolean })
              }
              className="h-3 w-3"
            />
            <Label htmlFor="medications" className="flex items-center gap-1.5 cursor-pointer text-xs">
              <Pill className="h-3 w-3 text-primary" />
              Medications
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="risk"
              checked={options.includeRiskAssessment}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeRiskAssessment: checked as boolean })
              }
              className="h-3 w-3"
            />
            <Label htmlFor="risk" className="flex items-center gap-1.5 cursor-pointer text-xs">
              <AlertTriangle className="h-3 w-3 text-primary" />
              Risk Assessment
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trends"
              checked={options.includeTrendAnalysis}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeTrendAnalysis: checked as boolean })
              }
              className="h-3 w-3"
            />
            <Label htmlFor="trends" className="flex items-center gap-1.5 cursor-pointer text-xs">
              <TrendingUp className="h-3 w-3 text-primary" />
              Trends
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="comparative"
              checked={options.includeComparativeAnalysis}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeComparativeAnalysis: checked as boolean })
              }
              className="h-3 w-3"
            />
            <Label htmlFor="comparative" className="flex items-center gap-1.5 cursor-pointer text-xs">
              <BarChart3 className="h-3 w-3 text-primary" />
              Comparative
            </Label>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!selectedPatientId || isGenerating}
        className="w-full h-7"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            <span className="text-xs">Generating...</span>
          </>
        ) : (
          <span className="text-xs">Generate Report</span>
        )}
      </Button>
    </div>
  );
}
