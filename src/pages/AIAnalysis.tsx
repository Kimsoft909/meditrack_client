import { useState } from 'react';
import { AnalysisConfigPanel } from '@/components/AnalysisConfigPanel';
import { AnalysisReportDocument } from '@/components/AnalysisReportDocument';
import { ReportExportDialog } from '@/components/ReportExportDialog';
import { PreviousReportsDialog } from '@/components/PreviousReportsDialog';
import { aiAnalysisService } from '@/services/aiAnalysisService';
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
      const report = await aiAnalysisService.generateAnalysis(patientId, dateRange, options);
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">AI Clinical Analysis</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Generate comprehensive patient analysis reports powered by AI
          </p>
        </div>
        <div className="flex gap-2">
          <PreviousReportsDialog />
          {generatedReport && (
            <ReportExportDialog reportId={generatedReport.reportId} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)] overflow-hidden">
        {/* Configuration Panel - Static, no scroll */}
        <div className="lg:col-span-1 sticky top-0 h-fit">
          <AnalysisConfigPanel
            onGenerate={handleGenerateReport}
            isGenerating={isGenerating}
          />
        </div>

        {/* Report Display - Independent scroll with custom scrollbar */}
        <div className="lg:col-span-2 overflow-y-auto report-scroll h-full">
          {generatedReport ? (
            <AnalysisReportDocument report={generatedReport} />
          ) : (
            <div className="bg-card border border-dashed border-border/50 rounded-lg p-8 sm:p-10 text-center">
              <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base font-semibold mb-1.5">No Report Generated Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
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
