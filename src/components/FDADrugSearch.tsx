// FDA drug information lookup component
// Provides Google-like search for drug information from FDA database

import { useState } from 'react';
import { Search, ExternalLink, AlertTriangle, Loader2, Info } from 'lucide-react';
import { FDADrugInfo } from '@/types/drug';
import { drugInteractionService } from '@/services/drugInteractionService';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

export function FDADrugSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drugInfo, setDrugInfo] = useState<FDADrugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 500);

  // Perform FDA search
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const info = await drugInteractionService.searchFDADrugInfo(searchQuery);
      setDrugInfo(info);
    } catch (error) {
      console.error('FDA search error:', error);
      setDrugInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search FDA drug database (e.g., Warfarin, Metformin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
            aria-label="Search FDA drug information"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || searchQuery.length < 3}
          aria-label="Search"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
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
      {!isLoading && hasSearched && !drugInfo && (
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No FDA information found for "{searchQuery}"
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Try searching by generic name or check spelling
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
