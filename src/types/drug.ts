// Comprehensive drug data structures following FDA/EMA/WHO standards

// Backend API response types (snake_case from API)
export interface DrugSearchResult {
  id: string;
  name: string;
  generic_name: string | null;
  brand_names: string[] | null;
  drug_class: string | null;
  indication: string | null;
}

// Frontend drug model (camelCase for UI)
export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string[];
  indication?: string;
  mechanism?: string;
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

// Backend interaction response (from API)
export interface InteractionResponse {
  drug1_name: string;
  drug2_name: string;
  severity: string;
  description: string;
  clinical_effects: string | null;
  management: string | null;
  evidence_level: string | null;
}

// Frontend interaction model (camelCase for UI)
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

// Backend FDA info response (from API)
export interface FDADrugInfoResponse {
  drug_name: string;
  active_ingredient: string;
  indication: string;
  dosage: string;
  warnings: string[];
  adverse_reactions: string[];
  contraindications: string[];
  fda_label: string;
}

// Frontend FDA drug information (camelCase for UI)
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

// Interaction check request
export interface InteractionCheckRequest {
  drug_ids: string[];
}
