import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { AnalysisReport } from '@/types/analysis';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface AnalysisReportDocumentProps {
  report: AnalysisReport;
}

export function AnalysisReportDocument({ report }: AnalysisReportDocumentProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'moderate':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div id="report-document" className="report-document bg-card border border-border rounded-lg p-4 sm:p-6 lg:p-8">
      {/* Header - Medical Letterhead Style */}
      <div className="report-header">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary mb-1">MEDITRACK</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">AI-Powered Clinical Analysis System</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-muted-foreground">Report ID</div>
            <div className="font-mono text-xs sm:text-sm font-semibold">{report.reportId}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(report.reportDate, 'PP')}
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base sm:text-xl font-semibold">AI-Powered Clinical Analysis Report</h2>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Patient Information Panel */}
      <div className="report-section patient-info-panel">
        <h3 className="section-title">Patient Information</h3>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Patient ID:</span>
            <span className="info-value font-mono">{report.patient.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value font-semibold">{report.patient.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date of Birth:</span>
            <span className="info-value">
              {format(report.patient.dateOfBirth, 'PPP')} ({report.patient.age} years)
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Sex:</span>
            <span className="info-value">{report.patient.sex}</span>
          </div>
          {report.patient.bloodType && (
            <div className="info-row">
              <span className="info-label">Blood Type:</span>
              <span className="info-value">{report.patient.bloodType}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">BMI:</span>
            <span className="info-value">
              {report.patient.bmi.toFixed(1)} ({report.patient.weight}kg / {report.patient.height}m)
            </span>
          </div>
          {report.patient.chronicConditions.length > 0 && (
            <div className="info-row col-span-2">
              <span className="info-label">Chronic Conditions:</span>
              <span className="info-value">{report.patient.chronicConditions.join(', ')}</span>
            </div>
          )}
          <div className="info-row col-span-2">
            <span className="info-label">Analysis Period:</span>
            <span className="info-value">
              {format(report.analysisDateRange.from, 'PPP')} to {format(report.analysisDateRange.to, 'PPP')}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="report-section">
        <h3 className="section-title">Executive Summary</h3>
        <div className="finding-highlight">
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-1">
              <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{report.overallHealthScore}</div>
              <div className="text-xs text-muted-foreground">Health Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Analysis Section */}
      {report.sections.vitalsAnalysis && (
        <div className="report-section">
          <h3 className="section-title">Vital Signs Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {report.sections.vitalsAnalysis.narrative}
          </p>
          
          <div className="data-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Current</th>
                  <th>Average</th>
                  <th>Trend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.sections.vitalsAnalysis.trends.map((trend, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{trend.parameter}</td>
                    <td>{trend.current.toFixed(1)} {trend.unit}</td>
                    <td>{trend.average.toFixed(1)} {trend.unit}</td>
                    <td>
                      <span className={trend.trend > 0 ? 'text-red-500' : trend.trend < 0 ? 'text-green-500' : ''}>
                        {trend.trend > 0 ? '↑' : trend.trend < 0 ? '↓' : '→'} {Math.abs(trend.trend).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <Badge variant={trend.status === 'danger' ? 'destructive' : trend.status === 'warning' ? 'secondary' : 'outline'}>
                        {trend.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medication Review Section */}
      {report.sections.medicationReview && (
        <div className="report-section">
          <h3 className="section-title">Medication Review</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {report.sections.medicationReview.narrative}
          </p>
          
          <div className="flex gap-6 mb-4">
            <div className="metric-inline">
              <span className="metric-label">Active Medications:</span>
              <span className="metric-value">{report.sections.medicationReview.activeMedications}</span>
            </div>
            <div className="metric-inline">
              <span className="metric-label">Adherence Score:</span>
              <span className="metric-value">{report.sections.medicationReview.adherenceScore}%</span>
            </div>
          </div>

          {report.sections.medicationReview.potentialInteractions.length > 0 && (
            <div className="finding-highlight border-yellow-200 bg-yellow-50/50">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Potential Drug Interactions
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {report.sections.medicationReview.potentialInteractions.map((interaction, idx) => (
                  <li key={idx}>{interaction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Risk Assessment Section */}
      {report.sections.riskAssessment && (
        <div className="report-section">
          <h3 className="section-title">Risk Assessment</h3>
          
          <div className="finding-highlight mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overall Risk Level</div>
                <Badge variant={getRiskBadgeVariant(report.sections.riskAssessment.riskLevel)} className="text-base px-3 py-1">
                  {report.sections.riskAssessment.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{report.sections.riskAssessment.riskScore}</div>
                <div className="text-xs text-muted-foreground">Risk Score</div>
              </div>
            </div>
          </div>

          {report.sections.riskAssessment.riskFactors && report.sections.riskAssessment.riskFactors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Identified Risk Factors:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {report.sections.riskAssessment.riskFactors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {report.sections.riskAssessment.comparativeAnalysis && (
            <p className="text-sm italic text-muted-foreground">
              {report.sections.riskAssessment.comparativeAnalysis}
            </p>
          )}
        </div>
      )}

      {/* Clinical Recommendations */}
      <div className="report-section">
        <h3 className="section-title">Clinical Recommendations</h3>
        <div className="space-y-3">
          {report.sections.recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-item">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getPriorityIcon(rec.priority)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{idx + 1}.</span>
                    <Badge variant="outline" className="text-xs">
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{rec.category}</span>
                  </div>
                  <p className="text-sm mb-1">{rec.text}</p>
                  {rec.action && (
                    <p className="text-sm text-primary font-medium">→ {rec.action}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence & Methodology Footer */}
      <div className="report-footer">
        <Separator className="my-6" />
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Analysis Methodology:</strong> This report analyzed {report.metadata.dataPointsAnalyzed} data points 
            including vital sign readings and medication records using AI-powered algorithms.
          </p>
          <p>
            <strong>AI Confidence Level:</strong> {report.metadata.confidence}%
          </p>
          <p className="text-xs italic">
            <strong>Disclaimer:</strong> This AI-generated analysis is intended to supplement clinical judgment, 
            not replace it. All recommendations should be reviewed by qualified healthcare professionals before 
            implementation. Generated on {format(report.metadata.analysisTimestamp, 'PPP p')}.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm">Reviewed by:</p>
              <p className="font-semibold">{report.generatedBy}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Digital Signature</p>
              <div className="h-12 w-32 border-b border-muted-foreground/30 mt-2"></div>
              <p className="text-xs text-muted-foreground mt-1">Date: {format(report.reportDate, 'PP')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
