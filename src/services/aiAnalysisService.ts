import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '@/config/api';
import { logger } from '@/utils/logger';
import type { AnalysisReport, AnalysisOptions } from '@/types/analysis';

// Backend response types (snake_case from Pydantic)
interface BackendAnalysisRequest {
  patient_id: string;
  date_range: { from: string; to: string };
  options: {
    include_vitals: boolean;
    include_medications: boolean;
    include_risk_assessment: boolean;
    include_comparative_analysis: boolean;
  };
}

interface BackendAnalysisResponse {
  report_id: string;
  patient: {
    id: string;
    name: string;
    age: number;
    sex: string;
    bmi: number;
    risk_level: string;
  };
  report_date: string;
  analysis_date_range: { from: string; to: string };
  generated_by: string;
  executive_summary: string;
  overall_health_score: number | null;
  sections: {
    vitals_analysis?: {
      trends: Array<{
        parameter: string;
        current: number;
        average: number;
        trend: number;
        status: string;
        unit: string;
      }>;
      anomalies_detected: number;
      narrative: string;
    };
    medication_review?: {
      active_medications_count: number;
      medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        indication: string;
      }>;
      narrative: string;
    };
    risk_assessment?: {
      risk_score: number;
      risk_level: string;
      risk_factors: string[];
      comparative_analysis: string;
    };
    recommendations: Array<{
      priority: string;
      category: string;
      recommendation: string;
    }>;
  };
  metadata: {
    confidence: number;
    data_points_analyzed: number;
    analysis_timestamp: string;
  };
}

/**
 * Transform backend response to frontend format
 */
const transformAnalysisReport = (backend: BackendAnalysisResponse): AnalysisReport => {
  return {
    reportId: backend.report_id,
    patient: {
      id: backend.patient.id,
      name: backend.patient.name,
      age: backend.patient.age,
      sex: backend.patient.sex as 'M' | 'F' | 'Other',
      dateOfBirth: new Date(),
      bloodType: undefined,
      weight: 0,
      height: 0,
      bmi: backend.patient.bmi,
      chronicConditions: [],
      riskLevel: backend.patient.risk_level,
    },
    reportDate: new Date(backend.report_date),
    analysisDateRange: {
      from: new Date(backend.analysis_date_range.from),
      to: new Date(backend.analysis_date_range.to),
    },
    generatedBy: backend.generated_by,
    executiveSummary: backend.executive_summary,
    overallHealthScore: backend.overall_health_score || 0,
    sections: {
      vitalsAnalysis: backend.sections.vitals_analysis ? {
        trends: backend.sections.vitals_analysis.trends.map(t => ({
          parameter: t.parameter,
          current: t.current,
          average: t.average,
          trend: t.trend,
          status: t.status as 'normal' | 'warning' | 'danger',
          unit: t.unit,
        })),
        narrative: backend.sections.vitals_analysis.narrative,
        anomaliesDetected: backend.sections.vitals_analysis.anomalies_detected,
      } : undefined,
      medicationReview: backend.sections.medication_review ? {
        activeMedications: backend.sections.medication_review.active_medications_count,
        adherenceScore: 85,
        potentialInteractions: [],
        narrative: backend.sections.medication_review.narrative,
      } : undefined,
      riskAssessment: backend.sections.risk_assessment ? {
        riskScore: backend.sections.risk_assessment.risk_score,
        riskLevel: backend.sections.risk_assessment.risk_level as 'low' | 'moderate' | 'high' | 'critical',
        riskFactors: backend.sections.risk_assessment.risk_factors,
        comparativeAnalysis: backend.sections.risk_assessment.comparative_analysis,
      } : undefined,
      recommendations: backend.sections.recommendations.map(r => ({
        priority: r.priority as 'high' | 'moderate' | 'low',
        category: r.category,
        text: r.recommendation,
        action: undefined,
      })),
    },
    metadata: {
      confidence: backend.metadata.confidence,
      dataPointsAnalyzed: backend.metadata.data_points_analyzed,
      analysisTimestamp: new Date(backend.metadata.analysis_timestamp),
    },
  };
};

export const aiAnalysisService = {
  /**
   * Generate AI analysis report
   */
  async generateAnalysis(
    patientId: string,
    dateRange: { from: Date; to: Date },
    options: AnalysisOptions
  ): Promise<AnalysisReport> {
    logger.debug('Generating AI analysis', { patientId, dateRange, options });

    const requestBody: BackendAnalysisRequest = {
      patient_id: patientId,
      date_range: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
      options: {
        include_vitals: options.includeVitals,
        include_medications: options.includeMedications,
        include_risk_assessment: options.includeRiskAssessment,
        include_comparative_analysis: options.includeComparativeAnalysis,
      },
    };

    const response = await httpClient.post<BackendAnalysisResponse>(
      '/api/v1/ai-analysis/generate',
      requestBody,
      true
    );

    logger.info('AI analysis generated successfully', { reportId: response.report_id });
    return transformAnalysisReport(response);
  },

  /**
   * Get previously generated report
   */
  async getReportById(reportId: string): Promise<AnalysisReport> {
    logger.debug('Fetching analysis report', { reportId });

    const response = await httpClient.get<BackendAnalysisResponse>(
      `/api/v1/ai-analysis/${reportId}`,
      true
    );

    logger.info('Analysis report fetched', { reportId });
    return transformAnalysisReport(response);
  },

  /**
   * Export report as PDF (backend-generated)
   */
  async exportReportPDF(reportId: string): Promise<void> {
    logger.debug('Exporting report as PDF', { reportId });

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_ENDPOINTS.aiAnalysis.exportPDF(reportId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      logger.info('PDF exported successfully', { reportId });
    } catch (error) {
      logger.error('PDF export failed', { reportId, error });
      throw error;
    }
  },
};
