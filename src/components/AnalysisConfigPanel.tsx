import { useState } from 'react';
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

  const { patients } = patientService.getPatients(1, 100);

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
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-1">Configuration</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">Select patient and analysis parameters</p>
      </div>

      {/* Patient Search */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">Patient</Label>
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              size="sm"
              aria-expanded={searchOpen}
              className="w-full justify-between h-9"
            >
              <span className="truncate text-xs sm:text-sm">{selectedPatientName || "Search patient..."}</span>
              <Search className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search by name or ID..." />
              <CommandEmpty>No patient found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={`${patient.id} ${patient.name}`}
                    onSelect={() => {
                      setSelectedPatientId(patient.id);
                      setSelectedPatientName(`${patient.name} (${patient.id})`);
                      setSearchOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{patient.name}</span>
                      <span className="text-xs text-muted-foreground">
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
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">Analysis Period</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal h-9 text-xs sm:text-sm",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{dateRange.from ? format(dateRange.from, "PP") : "From date"}</span>
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
                  "flex-1 justify-start text-left font-normal h-9 text-xs sm:text-sm",
                  !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{dateRange.to ? format(dateRange.to, "PP") : "To date"}</span>
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
        
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs px-2 sm:px-3" onClick={() => handleQuickDateRange(30)}>
            30d
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2 sm:px-3" onClick={() => handleQuickDateRange(90)}>
            3mo
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2 sm:px-3" onClick={() => handleQuickDateRange(180)}>
            6mo
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2 sm:px-3" onClick={() => handleQuickDateRange(365)}>
            1yr
          </Button>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="space-y-2 sm:space-y-3">
        <Label className="text-xs sm:text-sm">Include in Report</Label>
        
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vitals"
              checked={options.includeVitals}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeVitals: checked as boolean })
              }
            />
            <Label htmlFor="vitals" className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Vital Signs Analysis
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="medications"
              checked={options.includeMedications}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeMedications: checked as boolean })
              }
            />
            <Label htmlFor="medications" className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
              <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Medication Review
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="risk"
              checked={options.includeRiskAssessment}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeRiskAssessment: checked as boolean })
              }
            />
            <Label htmlFor="risk" className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
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
            />
            <Label htmlFor="trends" className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Trend Detection
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="comparative"
              checked={options.includeComparativeAnalysis}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeComparativeAnalysis: checked as boolean })
              }
            />
            <Label htmlFor="comparative" className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Comparative Analysis
            </Label>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!selectedPatientId || isGenerating}
        className="w-full h-9"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            <span className="text-xs sm:text-sm">Generating...</span>
          </>
        ) : (
          <span className="text-xs sm:text-sm">Generate Report</span>
        )}
      </Button>
    </div>
  );
}
