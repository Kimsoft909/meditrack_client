// Drug search and selection component
// Provides autocomplete search with keyboard navigation

import { useState, useMemo, useEffect } from 'react';
import { X, Search, Pill } from 'lucide-react';
import { Drug } from '@/types/drug';
import { drugService } from '@/services/drugService';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/utils/logger';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DrugSelectorProps {
  selectedDrugs: Drug[];
  onAddDrug: (drug: Drug) => void;
  onRemoveDrug: (drugId: string) => void;
}

export function DrugSelector({ selectedDrugs, onAddDrug, onRemoveDrug }: DrugSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search to prevent excessive API calls during typing
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch search results from backend API
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await drugService.searchDrugs(debouncedQuery, 10);
        setSearchResults(results);
      } catch (error) {
        logger.error('Drug search failed', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Handle drug selection from suggestions
  const handleSelectDrug = (drug: Drug) => {
    onAddDrug(drug);
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedIndex(0);
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelectDrug(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(0);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search medications (generic or brand name)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="pl-10"
            aria-label="Search for medications"
            aria-autocomplete="list"
            aria-controls="drug-suggestions"
            aria-expanded={showSuggestions && searchResults.length > 0}
          />
        </div>

        {/* Loading State */}
        {showSuggestions && isSearching && (
          <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Searching...
            </div>
          </div>
        )}

        {/* Autocomplete Suggestions */}
        {showSuggestions && !isSearching && searchResults.length > 0 && (
          <div
            id="drug-suggestions"
            className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg"
            role="listbox"
          >
            <ScrollArea className="max-h-64">
              <div className="p-2 space-y-1">
                {searchResults.map((drug, index) => (
                  <button
                    key={drug.id}
                    onClick={() => handleSelectDrug(drug)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none",
                      index === selectedIndex && "bg-accent",
                      selectedDrugs.some(d => d.id === drug.id) && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={selectedDrugs.some(d => d.id === drug.id)}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <div className="flex items-start gap-2">
                      <Pill className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{drug.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {drug.drugClass.join(', ')}
                        </div>
                        {drug.brandNames.length > 0 && (
                          <div className="text-xs text-muted-foreground/70 truncate">
                            Brand: {drug.brandNames.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No Results State */}
        {showSuggestions && !isSearching && debouncedQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
            No medications found matching "{debouncedQuery}"
          </div>
        )}
      </div>

      {/* Selected Drugs Display */}
      {selectedDrugs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Selected Medications ({selectedDrugs.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedDrugs.map((drug) => (
              <Badge
                key={drug.id}
                variant="secondary"
                className="pl-3 pr-1 py-1.5 gap-2 text-sm"
              >
                <span className="font-medium">{drug.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-sm"
                  onClick={() => onRemoveDrug(drug.id)}
                  aria-label={`Remove ${drug.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
