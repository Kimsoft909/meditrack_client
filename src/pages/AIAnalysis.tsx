import { useState } from 'react';
import { AnalysisConfigPanel } from '@/components/AnalysisConfigPanel';
import { AnalysisReportDocument } from '@/components/AnalysisReportDocument';
import { ReportExportDialog } from '@/components/ReportExportDialog';
import { generatePatientAnalysis } from '@/services/analysisService';
import { Brain } from 'lucide-react';
import type { AnalysisReport, AnalysisOptions } from '@/types/analysis';
import { toast } from 'sonner';

export default function AIAnalysis() {
  const [generatedReport, setGeneratedReport] = useState<AnalysisReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (
    patientId: string,
    dateRange: { from: Date; to: Date },
    options: AnalysisOptions
  ) => {
    setIsGenerating(true);
    try {
      const report = await generatePatientAnalysis(patientId, dateRange, options);
      setGeneratedReport(report);
      toast.success('Analysis report generated successfully');
    } catch (error) {
      console.error('Analysis generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">AI Clinical Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Generate comprehensive patient analysis reports powered by AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <AnalysisConfigPanel
            onGenerate={handleGenerateReport}
            isGenerating={isGenerating}
          />
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2">
          {generatedReport ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <ReportExportDialog reportId={generatedReport.reportId} />
              </div>
              <div className="report-container">
                <AnalysisReportDocument report={generatedReport} />
              </div>
            </div>
          ) : (
            <div className="bg-card/30 backdrop-blur-sm border border-dashed border-border/50 rounded-lg p-12 text-center">
              <Brain className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Report Generated Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Select a patient and configure analysis parameters to generate a comprehensive
                clinical analysis report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
