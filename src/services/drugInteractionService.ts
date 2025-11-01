// Service layer for drug interaction checking
// Abstracts data logic from UI components

import Fuse from 'fuse.js';
import { Drug, DrugInteraction, FDADrugInfo } from '@/types/drug';
import { drugDatabase } from '@/data/drugDatabase';
import { checkDrugInteractions } from '@/data/interactionMatrix';

class DrugInteractionService {
  private fuse: Fuse<Drug>;

  constructor() {
    // Configure fuzzy search with optimal settings
    // Threshold 0.3 balances precision and recall for medical terms
    this.fuse = new Fuse(drugDatabase, {
      keys: [
        { name: 'name', weight: 2 },           // Brand/generic name most important
        { name: 'genericName', weight: 2 },
        { name: 'brandNames', weight: 1.5 },
        { name: 'drugClass', weight: 0.5 },    // Class less critical for search
      ],
      threshold: 0.3,           // Allows for typos but maintains relevance
      includeScore: true,
      minMatchCharLength: 2,    // Require at least 2 characters
      ignoreLocation: true,     // Match anywhere in string
    });
  }

  /**
   * Search drugs with fuzzy matching
   * Returns up to 10 most relevant results
   */
  searchDrugs(query: string): Drug[] {
    if (!query || query.length < 2) return [];

    const results = this.fuse.search(query, { limit: 10 });
    return results.map(result => result.item);
  }

  /**
   * Get drug by ID
   */
  getDrugById(id: string): Drug | undefined {
    return drugDatabase.find(drug => drug.id === id);
  }

  /**
   * Check interactions between selected drugs
   * Uses interaction matrix to identify conflicts
   */
  checkInteractions(drugs: Drug[]): DrugInteraction[] {
    if (drugs.length < 2) return [];

    const drugIds = drugs.map(drug => drug.id);
    return checkDrugInteractions(drugIds);
  }

  /**
   * Simulate FDA OpenFDA API integration
   * In production, this would call: https://api.fda.gov/drug/label.json
   */
  async searchFDADrugInfo(drugName: string): Promise<FDADrugInfo | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock FDA data for demonstration
    const mockFDAData: Record<string, FDADrugInfo> = {
      warfarin: {
        drugName: 'Warfarin Sodium',
        activeIngredient: 'warfarin sodium',
        indication: 'Anticoagulation for prophylaxis/treatment of venous thrombosis, pulmonary embolism, AF with thromboembolic risk',
        dosage: 'Initial: 2-5mg daily; adjust based on INR (target 2-3 for most indications)',
        warnings: [
          'BLACK BOX WARNING: Bleeding risk - can cause major or fatal bleeding',
          'Contraindicated in pregnancy (teratogenic)',
          'Numerous drug-drug and drug-food interactions',
          'Requires regular INR monitoring',
        ],
        adverseReactions: ['Hemorrhage', 'Skin necrosis', 'Purple toe syndrome', 'Calciphylaxis'],
        contraindications: [
          'Active bleeding',
          'Severe hepatic disease',
          'Pregnancy',
          'Recent CNS/eye surgery',
          'Hemorrhagic stroke',
        ],
        fdaLabel: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2011/009218s107lbl.pdf',
        manufacturer: 'Various (generic)',
        approvalDate: '1954',
      },
      metformin: {
        drugName: 'Metformin Hydrochloride',
        activeIngredient: 'metformin hydrochloride',
        indication: 'Type 2 diabetes mellitus as adjunct to diet and exercise',
        dosage: 'Initial: 500mg twice daily or 850mg once daily; Max: 2550mg/day in divided doses',
        warnings: [
          'BLACK BOX WARNING: Lactic acidosis risk (rare but serious)',
          'Contraindicated in severe renal impairment (eGFR <30)',
          'Hold before contrast imaging and surgical procedures',
          'May cause vitamin B12 deficiency with long-term use',
        ],
        adverseReactions: ['Diarrhea', 'Nausea', 'Abdominal pain', 'Metallic taste', 'Lactic acidosis (rare)'],
        contraindications: [
          'eGFR <30 mL/min/1.73m²',
          'Metabolic acidosis',
          'Acute heart failure',
          'Severe hepatic disease',
        ],
        fdaLabel: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/020357s037s039,021202s021s023lbl.pdf',
        manufacturer: 'Bristol-Myers Squibb',
        approvalDate: '1994',
      },
      sertraline: {
        drugName: 'Sertraline Hydrochloride',
        activeIngredient: 'sertraline hydrochloride',
        indication: 'Major depressive disorder, OCD, panic disorder, PTSD, social anxiety disorder, PMDD',
        dosage: 'Initial: 25-50mg daily; Max: 200mg daily; Take with food to reduce GI upset',
        warnings: [
          'BLACK BOX WARNING: Increased suicidality risk in children, adolescents, young adults',
          'Serotonin syndrome risk (especially with MAOIs, other serotonergics)',
          'Increased bleeding risk (especially with NSAIDs, anticoagulants)',
          'Hyponatremia risk (especially elderly, on diuretics)',
        ],
        adverseReactions: ['Nausea', 'Diarrhea', 'Sexual dysfunction', 'Insomnia', 'Dry mouth', 'Sweating'],
        contraindications: ['Concomitant use with MAOIs', 'Pimozide use', 'Disulfiram use (oral solution only)'],
        fdaLabel: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2016/019839s74s75s76s77,20990s35s36s37s38lbl.pdf',
        manufacturer: 'Pfizer (Zoloft)',
        approvalDate: '1991',
      },
    };

    const normalizedQuery = drugName.toLowerCase().trim();
    
    // Find matching drug
    for (const [key, data] of Object.entries(mockFDAData)) {
      if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
        return data;
      }
    }

    // If no specific match, return generic response
    if (normalizedQuery.length > 2) {
      return {
        drugName: drugName,
        activeIngredient: `${drugName} (active ingredient)`,
        indication: 'FDA information not available in demo database',
        dosage: 'Consult FDA label or prescribing information',
        warnings: ['Complete FDA information not available in demo mode'],
        adverseReactions: ['See FDA label for complete adverse reaction profile'],
        contraindications: ['See FDA label for contraindications'],
        fdaLabel: 'https://www.accessdata.fda.gov/scripts/cder/daf/',
      };
    }

    return null;
  }

  /**
   * Get all available drugs (for preloading/caching)
   */
  getAllDrugs(): Drug[] {
    return drugDatabase;
  }
}

// Export singleton instance
export const drugInteractionService = new DrugInteractionService();
