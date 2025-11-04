// Drug database search and interaction checking service
// Integrates with backend API for real drug data

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '@/config/api';
import { logger } from '@/utils/logger';
import type {
  Drug,
  DrugSearchResult,
  InteractionResponse,
  InteractionCheckRequest,
  FDADrugInfoResponse,
  FDADrugInfo,
  DrugInteraction,
} from '@/types/drug';
import { InteractionSeverity, EvidenceLevel } from '@/types/drug';

class DrugService {
  /**
   * Search drugs with fuzzy matching using backend API
   * @param query - Search query (min 2 characters)
   * @param limit - Maximum number of results
   */
  async searchDrugs(query: string, limit: number = 10): Promise<Drug[]> {
    if (!query || query.length < 2) return [];

    try {
      logger.debug('Searching drugs', { query, limit });

      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      const results = await httpClient.get<DrugSearchResult[]>(
        `${API_ENDPOINTS.drugs.search}?${params.toString()}`,
        true
      );

      // Transform backend response to frontend Drug model
      return results.map(this.transformDrugResult);
    } catch (error: any) {
      logger.error('Failed to search drugs', error);
      throw new Error(error.message || 'Failed to search drugs');
    }
  }

  /**
   * Check for drug-drug interactions
   * @param drugIds - Array of drug IDs to check
   */
  async checkInteractions(drugIds: string[]): Promise<DrugInteraction[]> {
    if (drugIds.length < 2) {
      throw new Error('At least 2 drugs required for interaction check');
    }

    try {
      logger.debug('Checking drug interactions', { drugIds });

      const request: InteractionCheckRequest = { drug_ids: drugIds };

      const results = await httpClient.post<InteractionResponse[]>(
        API_ENDPOINTS.drugs.checkInteractions,
        request,
        true
      );

      // Transform backend response to frontend DrugInteraction model
      return results.map((interaction, index) => 
        this.transformInteractionResult(interaction, index)
      );
    } catch (error: any) {
      logger.error('Failed to check interactions', error);
      throw new Error(error.message || 'Failed to check drug interactions');
    }
  }

  /**
   * Get detailed FDA drug information
   * @param drugId - Drug ID
   */
  async getFDAInfo(drugId: string): Promise<FDADrugInfo> {
    try {
      logger.debug('Fetching FDA drug info', { drugId });

      const result = await httpClient.get<FDADrugInfoResponse>(
        API_ENDPOINTS.drugs.fdaInfo(drugId),
        true
      );

      // Transform backend response to frontend FDADrugInfo model
      return this.transformFDAInfo(result);
    } catch (error: any) {
      logger.error('Failed to fetch FDA info', error);
      throw new Error(error.message || 'Failed to fetch FDA drug information');
    }
  }

  /**
   * Transform backend drug search result to frontend Drug model
   */
  private transformDrugResult(result: DrugSearchResult): Drug {
    return {
      id: result.id,
      name: result.name,
      genericName: result.generic_name || result.name,
      brandNames: result.brand_names || [],
      drugClass: result.drug_class ? result.drug_class.split(',').map(c => c.trim()) : [],
      indication: result.indication || undefined,
    };
  }

  /**
   * Transform backend interaction response to frontend DrugInteraction model
   */
  private transformInteractionResult(
    result: InteractionResponse,
    index: number
  ): DrugInteraction {
    // Map severity string to enum
    const severityMap: Record<string, InteractionSeverity> = {
      contraindicated: InteractionSeverity.CONTRAINDICATED,
      major: InteractionSeverity.MAJOR,
      moderate: InteractionSeverity.MODERATE,
      minor: InteractionSeverity.MINOR,
    };

    // Map evidence level string to enum
    const evidenceMap: Record<string, EvidenceLevel> = {
      high: EvidenceLevel.HIGH,
      moderate: EvidenceLevel.MODERATE,
      low: EvidenceLevel.LOW,
    };

    return {
      id: `interaction-${index}`,
      drug1: {
        id: `drug-${result.drug1_name}`,
        name: result.drug1_name,
        genericName: result.drug1_name,
        brandNames: [],
        drugClass: [],
      },
      drug2: {
        id: `drug-${result.drug2_name}`,
        name: result.drug2_name,
        genericName: result.drug2_name,
        brandNames: [],
        drugClass: [],
      },
      severity: severityMap[result.severity.toLowerCase()] || InteractionSeverity.MODERATE,
      evidenceLevel: result.evidence_level 
        ? evidenceMap[result.evidence_level.toLowerCase()] || EvidenceLevel.MODERATE
        : EvidenceLevel.MODERATE,
      mechanism: result.description || 'No mechanism information available',
      clinicalEffects: result.clinical_effects 
        ? result.clinical_effects.split('\n').filter(e => e.trim())
        : [],
      management: result.management || 'Consult prescribing information and clinical judgment',
      monitoringParameters: [],
      references: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Transform backend FDA info response to frontend FDADrugInfo model
   */
  private transformFDAInfo(result: FDADrugInfoResponse): FDADrugInfo {
    return {
      drugName: result.drug_name,
      activeIngredient: result.active_ingredient,
      indication: result.indication,
      dosage: result.dosage,
      warnings: result.warnings,
      adverseReactions: result.adverse_reactions,
      contraindications: result.contraindications,
      fdaLabel: result.fda_label,
    };
  }
}

// Export singleton instance
export const drugService = new DrugService();
