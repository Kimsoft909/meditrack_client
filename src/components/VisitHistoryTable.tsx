// Visit history table with expandable details

import { memo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Visit } from '@/types/patient';
import { ChevronDown, ChevronRight, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface VisitHistoryTableProps {
  visits: Visit[];
}

export const VisitHistoryTable = memo(({ visits }: VisitHistoryTableProps) => {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  const getVisitTypeBadge = (reason: string) => {
    if (reason.toLowerCase().includes('routine')) {
      return <Badge variant="outline" className="status-stable">Routine</Badge>;
    }
    if (reason.toLowerCase().includes('emergency') || reason.toLowerCase().includes('acute')) {
      return <Badge variant="outline" className="status-critical">Emergency</Badge>;
    }
    if (reason.toLowerCase().includes('follow')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Follow-up</Badge>;
    }
    return <Badge variant="outline">Consultation</Badge>;
  };

  const toggleExpand = (visitId: string) => {
    setExpandedVisit(expandedVisit === visitId ? null : visitId);
  };

  const sortedVisits = [...visits].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Visit History</h3>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Chief Complaint</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Provider</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No visit history available
                </TableCell>
              </TableRow>
            ) : (
              sortedVisits.map((visit) => (
                <>
                  <TableRow 
                    key={visit.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(visit.id)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {expandedVisit === visit.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(visit.date, 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{getVisitTypeBadge(visit.reason)}</TableCell>
                    <TableCell className="font-medium">{visit.reason}</TableCell>
                    <TableCell className="text-sm">{visit.diagnosis}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {visit.doctorName}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedVisit === visit.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <div className="p-4 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-sm">Clinical Notes</span>
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">
                              {visit.notes}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                            <div>
                              <span className="text-xs text-muted-foreground">Visit Date</span>
                              <p className="text-sm font-medium">{format(visit.date, 'MMMM dd, yyyy')}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Chief Complaint</span>
                              <p className="text-sm font-medium">{visit.reason}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Attending Physician</span>
                              <p className="text-sm font-medium">{visit.doctorName}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Diagnosis & Treatment Plan</span>
                            <p className="text-sm font-medium mt-1">{visit.diagnosis}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

VisitHistoryTable.displayName = 'VisitHistoryTable';
