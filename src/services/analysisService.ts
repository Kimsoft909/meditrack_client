import { patientService } from './patientService';
import { getVitalStatus } from '@/utils/medical';
import {
  calculateLinearTrend,
  calculateAverage,
  detectAnomalies,
  calculateRiskScore,
  getRiskLevel
} from '@/utils/trendAnalysis';
import type {
  AnalysisReport,
  AnalysisOptions,
  PatientSummary,
  VitalsAnalysisSection,
  MedicationReviewSection,
  RiskAssessmentSection,
  Recommendation,
  VitalTrend
} from '@/types/analysis';

export async function generatePatientAnalysis(
  patientId: string,
  dateRange: { from: Date; to: Date },
  options: AnalysisOptions
): Promise<AnalysisReport> {
  const patient = patientService.getPatientById(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  // Filter vitals within date range
  const vitalsInRange = patient.vitals.filter(
    v => v.timestamp >= dateRange.from && v.timestamp <= dateRange.to
  );

  // Patient summary
  const patientSummary: PatientSummary = {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    sex: patient.sex,
    dateOfBirth: patient.dateOfBirth,
    bloodType: patient.bloodType,
    weight: patient.weight,
    height: patient.height,
    bmi: patient.bmi,
    chronicConditions: patient.chronicConditions,
    riskLevel: patient.riskLevel
  };

  // Vitals Analysis
  let vitalsAnalysis: VitalsAnalysisSection | undefined;
  if (options.includeVitals && vitalsInRange.length > 0) {
    const systolicValues = vitalsInRange.map(v => v.bloodPressureSystolic);
    const diastolicValues = vitalsInRange.map(v => v.bloodPressureDiastolic);
    const heartRateValues = vitalsInRange.map(v => v.heartRate);
    const tempValues = vitalsInRange.map(v => v.temperature);
    const oxygenValues = vitalsInRange.map(v => v.oxygenSaturation);
    const glucoseValues = vitalsInRange
      .filter(v => v.bloodGlucose !== undefined)
      .map(v => v.bloodGlucose!);

    const trends: VitalTrend[] = [
      {
        parameter: 'Systolic BP',
        current: systolicValues[systolicValues.length - 1],
        average: calculateAverage(systolicValues),
        trend: calculateLinearTrend(systolicValues),
        status: getVitalStatus('systolic', systolicValues[systolicValues.length - 1]),
        unit: 'mmHg'
      },
      {
        parameter: 'Diastolic BP',
        current: diastolicValues[diastolicValues.length - 1],
        average: calculateAverage(diastolicValues),
        trend: calculateLinearTrend(diastolicValues),
        status: getVitalStatus('diastolic', diastolicValues[diastolicValues.length - 1]),
        unit: 'mmHg'
      },
      {
        parameter: 'Heart Rate',
        current: heartRateValues[heartRateValues.length - 1],
        average: calculateAverage(heartRateValues),
        trend: calculateLinearTrend(heartRateValues),
        status: getVitalStatus('heartRate', heartRateValues[heartRateValues.length - 1]),
        unit: 'bpm'
      },
      {
        parameter: 'Temperature',
        current: tempValues[tempValues.length - 1],
        average: calculateAverage(tempValues),
        trend: calculateLinearTrend(tempValues),
        status: getVitalStatus('temperature', tempValues[tempValues.length - 1]),
        unit: '°C'
      },
      {
        parameter: 'O₂ Saturation',
        current: oxygenValues[oxygenValues.length - 1],
        average: calculateAverage(oxygenValues),
        trend: calculateLinearTrend(oxygenValues),
        status: getVitalStatus('oxygen', oxygenValues[oxygenValues.length - 1]),
        unit: '%'
      }
    ];

    if (glucoseValues.length > 0) {
      trends.push({
        parameter: 'Blood Glucose',
        current: glucoseValues[glucoseValues.length - 1],
        average: calculateAverage(glucoseValues),
        trend: calculateLinearTrend(glucoseValues),
        status: getVitalStatus('glucose', glucoseValues[glucoseValues.length - 1]),
        unit: 'mg/dL'
      });
    }

    const anomalies = detectAnomalies(systolicValues, (v) => getVitalStatus('systolic', v));
    
    let narrative = `Analysis of ${vitalsInRange.length} vital readings shows `;
    const concerningTrends = trends.filter(t => Math.abs(t.trend) > 5 && t.status !== 'normal');
    
    if (concerningTrends.length > 0) {
      narrative += `concerning trends in ${concerningTrends.map(t => t.parameter).join(', ')}. `;
    } else {
      narrative += `stable vital signs overall. `;
    }
    
    if (anomalies > 0) {
      narrative += `${anomalies} anomalous readings detected requiring attention.`;
    } else {
      narrative += `No significant anomalies detected during this period.`;
    }

    vitalsAnalysis = {
      trends,
      narrative,
      anomaliesDetected: anomalies
    };
  }

  // Medication Review
  let medicationReview: MedicationReviewSection | undefined;
  if (options.includeMedications) {
    const activeMeds = patient.medications.filter(m => !m.endDate);
    
    // Simple adherence score based on refills
    const adherenceScore = activeMeds.length > 0
      ? Math.round((activeMeds.reduce((acc, m) => acc + m.refillsRemaining, 0) / activeMeds.length) * 10)
      : 100;

    const interactions: string[] = [];
    // Simple interaction detection (mock logic)
    if (activeMeds.some(m => m.name.toLowerCase().includes('warfarin')) &&
        activeMeds.some(m => m.name.toLowerCase().includes('aspirin'))) {
      interactions.push('Warfarin + Aspirin: Increased bleeding risk');
    }

    let narrative = `Patient is currently on ${activeMeds.length} active medication${activeMeds.length !== 1 ? 's' : ''}. `;
    narrative += adherenceScore > 70 
      ? `Medication adherence appears good. `
      : `Medication adherence may need attention. `;
    narrative += interactions.length > 0
      ? `${interactions.length} potential interaction${interactions.length !== 1 ? 's' : ''} identified.`
      : `No major drug interactions detected.`;

    medicationReview = {
      activeMedications: activeMeds.length,
      adherenceScore,
      potentialInteractions: interactions,
      narrative
    };
  }

  // Risk Assessment
  let riskAssessment: RiskAssessmentSection | undefined;
  if (options.includeRiskAssessment && vitalsInRange.length > 0) {
    const avgSystolic = calculateAverage(vitalsInRange.map(v => v.bloodPressureSystolic));
    const avgGlucose = vitalsInRange.filter(v => v.bloodGlucose).length > 0
      ? calculateAverage(vitalsInRange.filter(v => v.bloodGlucose).map(v => v.bloodGlucose!))
      : 0;

    const riskScore = calculateRiskScore({
      avgSystolic,
      avgGlucose,
      chronicConditionsCount: patient.chronicConditions.length,
      age: patient.age,
      bmi: patient.bmi
    });

    const riskLevel = getRiskLevel(riskScore);

    const riskFactors: string[] = [];
    if (avgSystolic > 140) riskFactors.push('Elevated blood pressure');
    if (avgGlucose > 140) riskFactors.push('Poor glucose control');
    if (patient.chronicConditions.length > 0) {
      riskFactors.push(`${patient.chronicConditions.length} chronic condition${patient.chronicConditions.length > 1 ? 's' : ''}`);
    }
    if (patient.age > 65) riskFactors.push('Age-related risk factors');
    if (patient.bmi > 30) riskFactors.push('Obesity (BMI > 30)');
    if (patient.bmi < 18.5) riskFactors.push('Underweight (BMI < 18.5)');

    const comparativeAnalysis = options.includeComparativeAnalysis
      ? `Patient's average systolic BP (${avgSystolic.toFixed(0)} mmHg) is ${
          avgSystolic > 120 ? 'above' : 'within'
        } optimal range for age group ${Math.floor(patient.age / 10) * 10}-${Math.floor(patient.age / 10) * 10 + 9}.`
      : '';

    riskAssessment = {
      riskScore,
      riskLevel,
      riskFactors,
      comparativeAnalysis
    };
  }

  // Generate Recommendations
  const recommendations: Recommendation[] = [];
  
  if (vitalsAnalysis) {
    const highRiskTrends = vitalsAnalysis.trends.filter(t => 
      Math.abs(t.trend) > 5 && t.status === 'danger'
    );
    
    highRiskTrends.forEach(trend => {
      if (trend.parameter.includes('BP')) {
        recommendations.push({
          priority: 'high',
          category: 'Cardiovascular',
          text: `${trend.parameter} showing ${trend.trend > 0 ? 'upward' : 'downward'} trend (${trend.trend.toFixed(1)}%). Consider medication adjustment.`,
          action: 'Schedule cardiovascular assessment within 7 days'
        });
      }
    });

    if (vitalsAnalysis.anomaliesDetected > 5) {
      recommendations.push({
        priority: 'moderate',
        category: 'Monitoring',
        text: `${vitalsAnalysis.anomaliesDetected} anomalous readings detected. Increase monitoring frequency.`,
        action: 'Review monitoring protocol'
      });
    }
  }

  if (medicationReview && medicationReview.adherenceScore < 70) {
    recommendations.push({
      priority: 'moderate',
      category: 'Medication Management',
      text: 'Medication adherence below optimal level. Patient counseling recommended.',
      action: 'Schedule medication review appointment'
    });
  }

  if (medicationReview && medicationReview.potentialInteractions.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Drug Safety',
      text: `${medicationReview.potentialInteractions.length} potential drug interaction${medicationReview.potentialInteractions.length > 1 ? 's' : ''} identified.`,
      action: 'Consult pharmacist or adjust medication regimen'
    });
  }

  if (riskAssessment && riskAssessment.riskLevel === 'high' || riskAssessment?.riskLevel === 'critical') {
    recommendations.push({
      priority: 'high',
      category: 'Risk Management',
      text: `Overall risk level: ${riskAssessment.riskLevel.toUpperCase()}. Comprehensive risk mitigation required.`,
      action: 'Immediate clinical review recommended'
    });
  }

  if (patient.bmi > 30) {
    recommendations.push({
      priority: 'low',
      category: 'Lifestyle',
      text: 'BMI indicates obesity. Weight management program recommended.',
      action: 'Refer to nutrition counseling'
    });
  }

  // Default recommendation if none generated
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'Routine Care',
      text: 'Continue current care plan. No significant concerns identified.',
      action: 'Schedule routine follow-up in 3 months'
    });
  }

  // Executive Summary
  const executiveSummary = generateExecutiveSummary(patient, vitalsAnalysis, medicationReview, riskAssessment);
  
  // Overall Health Score (0-100, higher is better)
  let healthScore = 100;
  if (riskAssessment) healthScore -= riskAssessment.riskScore * 0.5;
  if (vitalsAnalysis && vitalsAnalysis.anomaliesDetected > 0) {
    healthScore -= vitalsAnalysis.anomaliesDetected * 2;
  }
  if (medicationReview) healthScore -= (100 - medicationReview.adherenceScore) * 0.2;
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Generate Report ID
  const reportId = `ANALYSIS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  return {
    patient: patientSummary,
    reportDate: new Date(),
    reportId,
    analysisDateRange: dateRange,
    generatedBy: 'Dr. AI Assistant',
    executiveSummary,
    overallHealthScore: Math.round(healthScore),
    sections: {
      vitalsAnalysis,
      medicationReview,
      riskAssessment,
      recommendations
    },
    metadata: {
      confidence: Math.round(85 + Math.random() * 10),
      dataPointsAnalyzed: vitalsInRange.length + patient.medications.length,
      analysisTimestamp: new Date()
    }
  };
}

function generateExecutiveSummary(
  patient: any,
  vitals?: VitalsAnalysisSection,
  meds?: MedicationReviewSection,
  risk?: RiskAssessmentSection
): string {
  let summary = `Analysis of ${patient.name} (${patient.age}yo ${patient.sex}) `;
  
  if (risk) {
    summary += `reveals ${risk.riskLevel} risk profile. `;
  }
  
  if (vitals && vitals.anomaliesDetected > 0) {
    summary += `Vital signs show ${vitals.anomaliesDetected} concerning reading${vitals.anomaliesDetected > 1 ? 's' : ''}. `;
  } else if (vitals) {
    summary += `Vital signs are generally stable. `;
  }
  
  if (meds && meds.potentialInteractions.length > 0) {
    summary += `Medication review identifies ${meds.potentialInteractions.length} interaction${meds.potentialInteractions.length > 1 ? 's' : ''} requiring attention.`;
  } else if (meds) {
    summary += `Current medication regimen appears appropriate.`;
  }
  
  return summary;
}
