// Dialog for medication refill/extension

import { memo, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Medication } from '@/types/patient';
import { format, addDays, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface RefillMedicationDialogProps {
  medication: Medication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RefillMedicationDialog = memo(({ medication, open, onOpenChange, onSuccess }: RefillMedicationDialogProps) => {
  const defaultDuration = useMemo(() => {
    if (!medication?.startDate || !medication?.endDate) return 30;
    return differenceInDays(medication.endDate, medication.startDate);
  }, [medication]);

  const [extensionDays, setExtensionDays] = useState(defaultDuration);

  const newEndDate = useMemo(() => {
    if (!medication?.endDate) return null;
    return addDays(medication.endDate, extensionDays);
  }, [medication, extensionDays]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock: Extend medication
    console.log('Medication extended:', {
      medication_id: medication?.id,
      extension_days: extensionDays,
      new_end_date: newEndDate,
    });

    toast.success(`Prescription extended by ${extensionDays} days`);
    onOpenChange(false);
    onSuccess?.();
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Refill Prescription</DialogTitle>
          <p className="text-xs text-muted-foreground">{medication.name} - {medication.dosage}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-md border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current End Date:</span>
              <span className="font-medium">
                {medication.endDate ? format(medication.endDate, 'MMM dd, yyyy') : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Original Duration:</span>
              <span className="font-medium">{defaultDuration} days</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extension" className="text-xs">Extension Period (days)</Label>
            <Input
              id="extension"
              type="number"
              min="1"
              max="365"
              value={extensionDays}
              onChange={(e) => setExtensionDays(Number(e.target.value))}
              className="h-9 text-xs"
              required
            />
            <p className="text-xs text-muted-foreground">
              Default: {defaultDuration} days (original prescription period)
            </p>
          </div>

          {newEndDate && (
            <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">New End Date</p>
                  <p className="text-primary">{format(newEndDate, 'MMMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Extend Prescription
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

RefillMedicationDialog.displayName = 'RefillMedicationDialog';
