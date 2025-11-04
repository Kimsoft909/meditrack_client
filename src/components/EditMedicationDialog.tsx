// Dialog for editing existing medication details

import { memo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Medication } from '@/types/patient';
import { toast } from 'sonner';

interface EditMedicationDialogProps {
  medication: Medication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EditMedicationDialog = memo(({ medication, open, onOpenChange, onSuccess }: EditMedicationDialogProps) => {
  const [formData, setFormData] = useState({
    dosage: '',
    frequency: '',
    route: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        dosage: medication.dosage,
        frequency: medication.frequency,
        route: medication.route || '',
        notes: medication.notes || '',
        is_active: medication.is_active !== false,
      });
    }
  }, [medication]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock: Update medication
    console.log('Updated medication:', {
      medication_id: medication?.id,
      ...formData,
    });

    toast.success('Medication updated successfully');
    onOpenChange(false);
    onSuccess?.();
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Medication</DialogTitle>
          <p className="text-xs text-muted-foreground">{medication.name}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dosage" className="text-xs">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-xs">Frequency *</Label>
              <Input
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., twice daily"
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route" className="text-xs">Route of Administration</Label>
            <Select value={formData.route} onValueChange={(val) => setFormData({ ...formData, route: val })}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oral">Oral</SelectItem>
                <SelectItem value="IV">Intravenous (IV)</SelectItem>
                <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                <SelectItem value="topical">Topical</SelectItem>
                <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                <SelectItem value="inhaled">Inhaled</SelectItem>
                <SelectItem value="sublingual">Sublingual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special instructions or notes"
              className="text-xs min-h-[60px]"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
            <div>
              <Label htmlFor="is_active" className="text-xs font-medium">Active Status</Label>
              <p className="text-xs text-muted-foreground">Mark as active or inactive</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditMedicationDialog.displayName = 'EditMedicationDialog';
