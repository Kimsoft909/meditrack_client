// Dialog for recording new patient visits

import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { VisitCreate } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { logger } from '@/utils/logger';

interface AddVisitDialogProps {
  patientId: string;
  onSuccess?: () => void;
}

export const AddVisitDialog = memo(({ patientId, onSuccess }: AddVisitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitData, setVisitData] = useState({
    visit_type: 'routine' as 'routine' | 'emergency' | 'follow-up',
    department: '',
    provider: '',
    chief_complaint: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitData.chief_complaint || !visitData.diagnosis) {
      toast.error('Please fill in chief complaint and diagnosis');
      return;
    }

    setIsSubmitting(true);
    try {
      const visit: VisitCreate = {
        visit_type: visitData.visit_type,
        department: visitData.department || undefined,
        provider: visitData.provider || undefined,
        chief_complaint: visitData.chief_complaint,
        diagnosis: visitData.diagnosis,
        treatment: visitData.treatment || undefined,
        notes: visitData.notes || undefined,
      };

      await patientService.addVisit(patientId, visit);
      logger.info('Visit recorded', { patientId });

      toast.success('Visit recorded successfully');
      setOpen(false);
      setVisitData({
        visit_type: 'routine',
        department: '',
        provider: '',
        chief_complaint: '',
        diagnosis: '',
        treatment: '',
        notes: '',
      });
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to record visit', error);
      toast.error(error.response?.data?.detail || 'Failed to record visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-3 w-3" />
          Record New Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Record Patient Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="visit_type" className="text-xs">Visit Type *</Label>
              <Select value={visitData.visit_type} onValueChange={(val: any) => setVisitData({ ...visitData, visit_type: val })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="text-xs">Department</Label>
              <Select value={visitData.department} onValueChange={(val) => setVisitData({ ...visitData, department: val })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="General Medicine">General Medicine</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Surgery">Surgery</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Oncology">Oncology</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chief_complaint" className="text-xs">Chief Complaint / Reason for Visit *</Label>
            <Input
              id="chief_complaint"
              value={visitData.chief_complaint}
              onChange={(e) => setVisitData({ ...visitData, chief_complaint: e.target.value })}
              placeholder="Primary reason for visit"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="text-xs">Diagnosis *</Label>
            <Textarea
              id="diagnosis"
              value={visitData.diagnosis}
              onChange={(e) => setVisitData({ ...visitData, diagnosis: e.target.value })}
              placeholder="Primary diagnosis or assessment"
              className="text-xs min-h-[60px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment" className="text-xs">Treatment Plan</Label>
            <Textarea
              id="treatment"
              value={visitData.treatment}
              onChange={(e) => setVisitData({ ...visitData, treatment: e.target.value })}
              placeholder="Treatment recommendations and plan"
              className="text-xs min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={visitData.notes}
              onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
              placeholder="Additional observations, vitals, or notes"
              className="text-xs min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider" className="text-xs">Provider / Physician</Label>
            <Input
              id="provider"
              value={visitData.provider}
              onChange={(e) => setVisitData({ ...visitData, provider: e.target.value })}
              placeholder="Dr. John Smith"
              className="h-9 text-xs"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-md border">
            <p className="text-xs text-muted-foreground">
              <strong>Visit Date:</strong> {format(new Date(), 'MMMM dd, yyyy - HH:mm')} (auto-filled)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

AddVisitDialog.displayName = 'AddVisitDialog';
