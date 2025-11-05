import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { History, Search, Download, Calendar, User, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { aiAnalysisService } from '@/services/aiAnalysisService';
import type { AnalysisReport } from '@/types/analysis';
import { format } from 'date-fns';
import { Badge } from './ui/badge';

export function PreviousReportsDialog() {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<AnalysisReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadReports();
    }
  }, [open]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredReports(reports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(
      (report) =>
        report.patient.name.toLowerCase().includes(query) ||
        report.reportId.toLowerCase().includes(query) ||
        report.patient.id.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await aiAnalysisService.listReports();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load previous reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      await aiAnalysisService.exportReportPDF(reportId);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <History className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="text-xs sm:text-sm">Previous Reports</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Previous Analysis Reports</DialogTitle>
          <DialogDescription>
            View and download previously generated clinical analysis reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, report ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Reports List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No reports match your search' : 'No previous reports found'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div
                    key={report.reportId}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold truncate">{report.patient.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {report.patient.age}y, {report.patient.sex}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(report.reportDate, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span className="truncate">{report.reportId}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {report.executiveSummary}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(report.reportId)}
                        disabled={downloadingId === report.reportId}
                        className="flex-shrink-0"
                      >
                        {downloadingId === report.reportId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Download</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
