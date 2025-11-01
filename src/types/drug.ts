// Comprehensive drug data structures following FDA/EMA/WHO standards

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string[];
  mechanism: string;
  fdaApprovalDate?: Date;
  rxcui?: string; // RxNorm Concept Unique Identifier
}

// Interaction severity follows FDA classification
export enum InteractionSeverity {
  CONTRAINDICATED = 'contraindicated',    // Never combine
  MAJOR = 'major',                        // Serious, requires intervention
  MODERATE = 'moderate',                  // Monitor closely
  MINOR = 'minor',                        // Minimal clinical significance
}

// Evidence quality (Evidence-Based Medicine standards)
export enum EvidenceLevel {
  HIGH = 'high',           // RCT, meta-analysis
  MODERATE = 'moderate',   // Cohort studies
  LOW = 'low',            // Case reports, expert opinion
}

export interface Reference {
  id: string;
  title: string;
  authors: string;
  journal?: string;
  year: number;
  pmid?: string; // PubMed ID
  url?: string;
}

// Comprehensive interaction model
export interface DrugInteraction {
  id: string;
  drug1: Drug;
  drug2: Drug;
  severity: InteractionSeverity;
  evidenceLevel: EvidenceLevel;
  mechanism: string;
  clinicalEffects: string[];
  management: string;
  monitoringParameters?: string[];
  references: Reference[];
  lastUpdated: Date;
}

// FDA drug information
export interface FDADrugInfo {
  drugName: string;
  activeIngredient: string;
  indication: string;
  dosage: string;
  warnings: string[];
  adverseReactions: string[];
  contraindications: string[];
  fdaLabel: string; // URL to FDA label
  manufacturer?: string;
  approvalDate?: string;
}

// Search result type for autocomplete
export interface DrugSearchResult extends Drug {
  score?: number; // For fuzzy search ranking
}
