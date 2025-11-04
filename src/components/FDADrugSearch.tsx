// FDA drug information lookup component with autocomplete
// Uses fuzzy search dropdown, then fetches full FDA details on selection

import { useState, useEffect } from 'react';
import { Search, ExternalLink, AlertTriangle, Loader2, Info, Check, ChevronsUpDown } from 'lucide-react';
import { FDADrugInfo, Drug } from '@/types/drug';
import { drugService } from '@/services/drugService';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function FDADrugSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [drugInfo, setDrugInfo] = useState<FDADrugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fuzzy search drugs using backend API
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await drugService.searchDrugs(debouncedQuery, 10);
        setSearchResults(results);
      } catch (error) {
        logger.error('Drug search failed', error);
        setSearchResults([]);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Fetch FDA info when drug is selected using backend API
  const handleDrugSelect = async (drug: Drug) => {
    setSelectedDrug(drug);
    setSearchQuery('');
    setOpen(false);
    setSearchResults([]);
    setIsLoading(true);
    setDrugInfo(null);

    try {
      logger.debug('Fetching FDA info', { drugId: drug.id });
      const info = await drugService.getFDAInfo(drug.id);
      setDrugInfo(info);
    } catch (error: any) {
      logger.error('Failed to fetch FDA info', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch drug information',
        variant: 'destructive',
      });
      setDrugInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Autocomplete Search Interface */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search Drug Database</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto min-h-[40px]"
            >
              <span className="truncate">
                {selectedDrug ? (
                  <span className="flex flex-col items-start">
                    <span className="font-medium">{selectedDrug.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedDrug.genericName}
                    </span>
                  </span>
                ) : (
                  "Type drug name (e.g., Warfarin, Metformin)..."
                )}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Search drugs..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery.length < 2 ? 'Type at least 2 characters...' : 'No drugs found.'}
                </CommandEmpty>
                {searchResults.length > 0 && (
                  <CommandGroup heading="Available Drugs">
                    {searchResults.map((drug) => (
                      <CommandItem
                        key={drug.id}
                        value={drug.name}
                        onSelect={() => handleDrugSelect(drug)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDrug?.id === drug.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{drug.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {drug.genericName} • {drug.drugClass?.[0] || 'N/A'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {!isLoading && drugInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{drugInfo.drugName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {drugInfo.activeIngredient}
                </p>
                {drugInfo.manufacturer && (
                  <Badge variant="outline" className="mt-2">
                    {drugInfo.manufacturer}
                  </Badge>
                )}
              </div>
              {drugInfo.approvalDate && (
                <Badge variant="secondary">
                  FDA Approved: {drugInfo.approvalDate}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Indication */}
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Indication
              </h4>
              <p className="text-sm text-muted-foreground">{drugInfo.indication}</p>
            </div>

            <Separator />

            {/* Expandable Sections */}
            <Accordion type="single" collapsible className="w-full">
              {/* Warnings */}
              <AccordionItem value="warnings">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Warnings & Precautions ({drugInfo.warnings.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 mt-2">
                    {drugInfo.warnings.map((warning, idx) => (
                      <li
                        key={idx}
                        className={`text-sm pl-4 py-2 border-l-2 ${
                          warning.includes('BLACK BOX')
                            ? 'border-destructive bg-destructive/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        {warning.includes('BLACK BOX') && (
                          <Badge variant="destructive" className="mb-1 text-xs">
                            BLACK BOX WARNING
                          </Badge>
                        )}
                        <p>{warning.replace('BLACK BOX WARNING: ', '')}</p>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Dosage */}
              <AccordionItem value="dosage">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  Dosage & Administration
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm mt-2 p-3 bg-muted/30 rounded-md">
                    {drugInfo.dosage}
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Adverse Reactions */}
              <AccordionItem value="adverse">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  Adverse Reactions ({drugInfo.adverseReactions.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {drugInfo.adverseReactions.map((reaction, idx) => (
                      <div key={idx} className="text-sm p-2 bg-muted/30 rounded">
                        • {reaction}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Contraindications */}
              <AccordionItem value="contraindications">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  Contraindications ({drugInfo.contraindications.length})
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 mt-2">
                    {drugInfo.contraindications.map((contra, idx) => (
                      <li key={idx} className="text-sm pl-4 py-2 border-l-2 border-destructive bg-destructive/5">
                        ⛔ {contra}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* FDA Label Link */}
            <div className="pt-4 border-t">
              <a
                href={drugInfo.fdaLabel}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View Full FDA Label
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {!isLoading && selectedDrug && !drugInfo && (
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No FDA information found for "{selectedDrug.name}"
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Drug data is currently unavailable
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
