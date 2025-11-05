import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Download, FileText, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { aiAnalysisService } from '@/services/aiAnalysisService';

interface ReportExportDialogProps {
  reportId: string;
}

export function ReportExportDialog({ reportId }: ReportExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      await aiAnalysisService.exportReportPDF(reportId);
      toast.success('PDF downloaded successfully');
      setOpen(false);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="text-xs sm:text-sm">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose how you'd like to export this clinical analysis report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Button
            onClick={exportAsPDF}
            disabled={isExporting}
            className="w-full justify-start"
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Download as PDF (Backend)
              </>
            )}
          </Button>

          <Button
            onClick={handlePrint}
            className="w-full justify-start"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
