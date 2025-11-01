export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  dateOfBirth: Date;
  bloodType?: string;
  weight: number;
  height: number;
  bmi: number;
  chronicConditions: string[];
  riskLevel: string;
}

export interface VitalTrend {
  parameter: string;
  current: number;
  average: number;
  trend: number; // percentage change
  status: 'normal' | 'warning' | 'danger';
  unit: string;
}

export interface VitalsAnalysisSection {
  trends: VitalTrend[];
  narrative: string;
  anomaliesDetected: number;
}

export interface MedicationReviewSection {
  activeMedications: number;
  adherenceScore: number;
  potentialInteractions: string[];
  narrative: string;
}

export interface RiskAssessmentSection {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskFactors: string[];
  comparativeAnalysis: string;
}

export interface Recommendation {
  priority: 'high' | 'moderate' | 'low';
  category: string;
  text: string;
  action?: string;
}

export interface AnalysisReport {
  patient: PatientSummary;
  reportDate: Date;
  reportId: string;
  analysisDateRange: { from: Date; to: Date };
  generatedBy: string;
  
  executiveSummary: string;
  overallHealthScore: number;
  
  sections: {
    vitalsAnalysis?: VitalsAnalysisSection;
    medicationReview?: MedicationReviewSection;
    riskAssessment?: RiskAssessmentSection;
    recommendations: Recommendation[];
  };
  
  metadata: {
    confidence: number;
    dataPointsAnalyzed: number;
    analysisTimestamp: Date;
  };
}

export interface AnalysisOptions {
  includeVitals: boolean;
  includeMedications: boolean;
  includeRiskAssessment: boolean;
  includeTrendAnalysis: boolean;
  includeComparativeAnalysis: boolean;
}
