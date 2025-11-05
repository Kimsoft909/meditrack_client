// Compact form for adding all vital readings in horizontal layout

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';
import { VitalCreate } from '@/types/patient';
import { logger } from '@/utils/logger';

interface AddVitalReadingFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export const AddVitalReadingForm = memo(({ patientId, onSuccess }: AddVitalReadingFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    temperature: 37.0,
    oxygenSaturation: 98,
    bloodGlucose: 95,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const vitalData: VitalCreate = {
        blood_pressure_systolic: formData.bloodPressureSystolic,
        blood_pressure_diastolic: formData.bloodPressureDiastolic,
        heart_rate: formData.heartRate,
        temperature: formData.temperature,
        oxygen_saturation: formData.oxygenSaturation,
        blood_glucose: formData.bloodGlucose,
      };

      await patientService.addVitalReading(patientId, vitalData);
      logger.info('Vital reading added', { patientId });
      
      toast.success('Vital reading added successfully');
      setIsOpen(false);
      setFormData({
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 37.0,
        oxygenSaturation: 98,
        bloodGlucose: 95,
      });
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to add vital reading', error);
      toast.error(error.response?.data?.detail || 'Failed to add vital reading');
    } finally {
      setIsSubmitting(false);
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
        Add Vitals
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Add Vital Readings</h4>
        <Button 
          type="button" 
          size="sm" 
          variant="ghost"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>

      {/* Horizontal Layout - All vitals in one row */}
      <div className="flex flex-wrap items-end gap-2">
        {/* Blood Pressure - Far left, tight group */}
        <div className="flex gap-1">
          <div className="w-20">
            <Label htmlFor="systolic" className="text-[10px] text-muted-foreground">Sys</Label>
            <Input
              id="systolic"
              type="number"
              value={formData.bloodPressureSystolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: Number(e.target.value) })}
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="w-20">
            <Label htmlFor="diastolic" className="text-[10px] text-muted-foreground">Dia</Label>
            <Input
              id="diastolic"
              type="number"
              value={formData.bloodPressureDiastolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: Number(e.target.value) })}
              className="h-8 text-xs"
              required
            />
          </div>
        </div>

        {/* Heart Rate */}
        <div className="w-24">
          <Label htmlFor="heartRate" className="text-[10px] text-muted-foreground">HR (bpm)</Label>
          <Input
            id="heartRate"
            type="number"
            value={formData.heartRate}
            onChange={(e) => setFormData({ ...formData, heartRate: Number(e.target.value) })}
            className="h-8 text-xs"
            required
          />
        </div>

        {/* Temperature */}
        <div className="w-24">
          <Label htmlFor="temperature" className="text-[10px] text-muted-foreground">Temp (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
            className="h-8 text-xs"
            required
          />
        </div>

        {/* O2 Saturation */}
        <div className="w-24">
          <Label htmlFor="oxygen" className="text-[10px] text-muted-foreground">O₂ (%)</Label>
          <Input
            id="oxygen"
            type="number"
            value={formData.oxygenSaturation}
            onChange={(e) => setFormData({ ...formData, oxygenSaturation: Number(e.target.value) })}
            className="h-8 text-xs"
            required
          />
        </div>

        {/* Blood Glucose */}
        <div className="w-24">
          <Label htmlFor="glucose" className="text-[10px] text-muted-foreground">Glucose (mg/dL)</Label>
          <Input
            id="glucose"
            type="number"
            value={formData.bloodGlucose}
            onChange={(e) => setFormData({ ...formData, bloodGlucose: Number(e.target.value) })}
            className="h-8 text-xs"
            required
          />
        </div>
      </div>

      {/* Submit button - Below, aligned right */}
      <div className="flex justify-end pt-2">
        <Button type="submit" size="sm" className="px-6" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Reading'}
        </Button>
      </div>
    </form>
  );
});

AddVitalReadingForm.displayName = 'AddVitalReadingForm';
