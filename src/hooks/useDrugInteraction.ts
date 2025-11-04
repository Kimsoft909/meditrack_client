// State management hook for drug interaction checking
// Centralizes business logic and UI state

import { useState, useCallback, useMemo } from 'react';
import { Drug, DrugInteraction } from '@/types/drug';
import { drugService } from '@/services/drugService';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export function useDrugInteraction() {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Add drug to selection
  const addDrug = useCallback((drug: Drug) => {
    setSelectedDrugs(prev => {
      // Prevent duplicates
      if (prev.some(d => d.id === drug.id)) {
        toast({
          title: "Already Added",
          description: `${drug.name} is already in your list.`,
          variant: "default",
        });
        return prev;
      }

      toast({
        title: "Drug Added",
        description: `${drug.name} added to analysis.`,
        variant: "default",
      });

      return [...prev, drug];
    });
  }, []);

  // Remove drug from selection
  const removeDrug = useCallback((drugId: string) => {
    setSelectedDrugs(prev => {
      const drug = prev.find(d => d.id === drugId);
      const updated = prev.filter(d => d.id !== drugId);
      
      if (drug) {
        toast({
          title: "Drug Removed",
          description: `${drug.name} removed from analysis.`,
          variant: "default",
        });
      }
      
      return updated;
    });

    // Clear interactions if less than 2 drugs remain
    setInteractions(prev => {
      if (selectedDrugs.length <= 2) return [];
      return prev;
    });
  }, [selectedDrugs.length]);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedDrugs([]);
    setInteractions([]);
    toast({
      title: "Cleared",
      description: "All drugs and results cleared.",
      variant: "default",
    });
  }, []);

  // Check for interactions using backend API
  const checkInteractions = useCallback(async () => {
    if (selectedDrugs.length < 2) {
      toast({
        title: "Insufficient Drugs",
        description: "Please add at least 2 drugs to check for interactions.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);

    try {
      logger.debug('Checking drug interactions', { drugCount: selectedDrugs.length });
      
      const drugIds = selectedDrugs.map(drug => drug.id);
      const foundInteractions = await drugService.checkInteractions(drugIds);
      
      setInteractions(foundInteractions);

      // Provide feedback based on results
      if (foundInteractions.length === 0) {
        toast({
          title: "No Interactions Found",
          description: `Analysis complete. No known interactions between ${selectedDrugs.length} drugs.`,
          variant: "default",
        });
      } else {
        const contraindicated = foundInteractions.filter(i => i.severity === 'contraindicated').length;
        const major = foundInteractions.filter(i => i.severity === 'major').length;

        toast({
          title: contraindicated > 0 ? "⚠️ Critical Interactions Found" : "Interactions Detected",
          description: `Found ${foundInteractions.length} interaction(s). ${contraindicated > 0 ? `${contraindicated} CONTRAINDICATED` : ''} ${major > 0 ? `${major} MAJOR` : ''}`.trim(),
          variant: contraindicated > 0 ? "destructive" : "default",
        });
      }
    } catch (error: any) {
      logger.error('Failed to check interactions', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check drug interactions",
        variant: "destructive",
      });
      setInteractions([]);
    } finally {
      setIsChecking(false);
    }
  }, [selectedDrugs]);

  // Computed statistics
  const stats = useMemo(() => {
    const contraindicated = interactions.filter(i => i.severity === 'contraindicated').length;
    const major = interactions.filter(i => i.severity === 'major').length;
    const moderate = interactions.filter(i => i.severity === 'moderate').length;
    const minor = interactions.filter(i => i.severity === 'minor').length;

    return {
      total: interactions.length,
      contraindicated,
      major,
      moderate,
      minor,
      hasSelected: selectedDrugs.length > 0,
      canCheck: selectedDrugs.length >= 2,
    };
  }, [interactions, selectedDrugs.length]);

  return {
    selectedDrugs,
    interactions,
    isChecking,
    stats,
    addDrug,
    removeDrug,
    clearAll,
    checkInteractions,
  };
}
