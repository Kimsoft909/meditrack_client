// Compact form for adding vital readings

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { toast } from '@/hooks/use-toast';
import { VitalReadingInput } from '@/types/patient';

interface AddVitalReadingFormProps {
  patientId: string;
  vitalType: 'bp' | 'hr' | 'temp' | 'o2' | 'glucose';
  onSuccess?: () => void;
}

export const AddVitalReadingForm = memo(({ patientId, vitalType, onSuccess }: AddVitalReadingFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<VitalReadingInput>>({
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    temperature: 37.0,
    oxygenSaturation: 98,
    bloodGlucose: 95,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = patientService.addVitalReading(patientId, formData as VitalReadingInput);
    
    if (result) {
      toast({
        title: 'Vital reading added',
        description: 'New vital signs recorded successfully',
      });
      setIsOpen(false);
      onSuccess?.();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add vital reading',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) {
    return (
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Plus className="h-3 w-3" />
        Add
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">New Reading</h4>
        <Button 
          type="button" 
          size="sm" 
          variant="ghost"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>

      {vitalType === 'bp' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="systolic" className="text-xs">Systolic</Label>
            <Input
              id="systolic"
              type="number"
              value={formData.bloodPressureSystolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: Number(e.target.value) })}
              className="h-8 text-sm"
              required
            />
          </div>
          <div>
            <Label htmlFor="diastolic" className="text-xs">Diastolic</Label>
            <Input
              id="diastolic"
              type="number"
              value={formData.bloodPressureDiastolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: Number(e.target.value) })}
              className="h-8 text-sm"
              required
            />
          </div>
        </div>
      )}

      {vitalType === 'hr' && (
        <div>
          <Label htmlFor="heartRate" className="text-xs">Heart Rate (bpm)</Label>
          <Input
            id="heartRate"
            type="number"
            value={formData.heartRate}
            onChange={(e) => setFormData({ ...formData, heartRate: Number(e.target.value) })}
            className="h-8 text-sm"
            required
          />
        </div>
      )}

      {vitalType === 'temp' && (
        <div>
          <Label htmlFor="temperature" className="text-xs">Temperature (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
            className="h-8 text-sm"
            required
          />
        </div>
      )}

      {vitalType === 'o2' && (
        <div>
          <Label htmlFor="oxygen" className="text-xs">O₂ Saturation (%)</Label>
          <Input
            id="oxygen"
            type="number"
            value={formData.oxygenSaturation}
            onChange={(e) => setFormData({ ...formData, oxygenSaturation: Number(e.target.value) })}
            className="h-8 text-sm"
            required
          />
        </div>
      )}

      {vitalType === 'glucose' && (
        <div>
          <Label htmlFor="glucose" className="text-xs">Blood Glucose (mg/dL)</Label>
          <Input
            id="glucose"
            type="number"
            value={formData.bloodGlucose}
            onChange={(e) => setFormData({ ...formData, bloodGlucose: Number(e.target.value) })}
            className="h-8 text-sm"
            required
          />
        </div>
      )}

      <Button type="submit" size="sm" className="w-full">
        Save Reading
      </Button>
    </form>
  );
});

AddVitalReadingForm.displayName = 'AddVitalReadingForm';
