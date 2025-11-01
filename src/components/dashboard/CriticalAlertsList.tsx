// Scrollable list of patients requiring immediate clinical attention

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/RiskBadge';
import { Patient } from '@/types/patient';
import { AlertTriangle, Activity, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

interface CriticalAlertsListProps {
  patients: Patient[];
}

export const CriticalAlertsList = memo(({ patients }: CriticalAlertsListProps) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleScheduleAppointment = () => {
    if (selectedPatient && selectedDate) {
      toast.success(`Appointment scheduled for ${selectedPatient.name} on ${format(selectedDate, 'PPP')}`);
      setCalendarOpen(false);
      setSelectedDate(undefined);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Critical Patients ({patients.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="px-4 pb-4 space-y-2">
            {patients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No critical alerts at this time
              </p>
            ) : (
              patients.map((patient) => {
                const latestVitals = patient.vitals[0];
                const timeSinceReading = latestVitals 
                  ? Math.floor((Date.now() - latestVitals.timestamp.getTime()) / (1000 * 60 * 60))
                  : null;

                return (
                  <div 
                    key={patient.id}
                    className="border border-border rounded-lg p-3 hover:bg-accent/50 transition-smooth"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{patient.name}</p>
                          <RiskBadge level={patient.riskLevel} compact />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {patient.chronicConditions.length > 0 
                            ? patient.chronicConditions.slice(0, 2).join(', ')
                            : 'No chronic conditions'}
                        </p>
                      </div>
                    </div>

                    {latestVitals && (
                      <div className="flex items-center gap-3 mb-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span>BP: {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}</span>
                        </div>
                        <div>HR: {latestVitals.heartRate} bpm</div>
                        <div className="text-muted-foreground">
                          {timeSinceReading ? `${timeSinceReading}h ago` : 'Just now'}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Link to={`/patient/${patient.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View Profile
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setCalendarOpen(true);
                        }}
                      >
                        <CalendarIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Select a date for follow-up with {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Calendar 
              mode="single" 
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalendarOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleAppointment} disabled={!selectedDate}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

CriticalAlertsList.displayName = 'CriticalAlertsList';
