// Comprehensive patient profile editor with collapsible sections

import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Edit, ChevronDown } from 'lucide-react';
import { Patient, RiskLevel, PatientStatus, PatientUpdate } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { toast } from '@/hooks/use-toast';
import { calculateBMI } from '@/utils/medical';
import { logger } from '@/utils/logger';
import { toast as sonnerToast } from 'sonner';

interface EditPatientDialogProps {
  patient: Patient;
  onSuccess?: () => void;
}

export const EditPatientDialog = memo(({ patient, onSuccess }: EditPatientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(patient);
  const [openSections, setOpenSections] = useState({
    personal: true,
    contact: false,
    physical: false,
    medical: false,
    admin: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      // Split name back into first and last
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const updates: PatientUpdate = {
        first_name: firstName,
        last_name: lastName,
        contact_number: formData.contactNumber,
        email: formData.email,
        address: formData.address,
        weight: formData.weight,
        height: formData.height,
        allergies: formData.allergies.join(', '),
        chronic_conditions: formData.chronicConditions.join(', '),
        status: formData.status,
        risk_level: formData.riskLevel,
      };

      await patientService.updatePatient(patient.id, updates);
      logger.info('Patient updated successfully', { patientId: patient.id });
      
      sonnerToast.success('Patient updated successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to update patient', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to update patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bmi = calculateBMI(formData.weight, formData.height);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <Collapsible open={openSections.personal} onOpenChange={() => toggleSection('personal')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <span className="font-semibold">Personal Information</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.personal ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <Select value={formData.sex} onValueChange={(value: 'M' | 'F' | 'Other') => setFormData({ ...formData, sex: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Input
                    id="bloodType"
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Contact Details */}
          <Collapsible open={openSections.contact} onOpenChange={() => toggleSection('contact')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <span className="font-semibold">Contact Details</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.contact ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Physical Metrics */}
          <Collapsible open={openSections.physical} onOpenChange={() => toggleSection('physical')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <span className="font-semibold">Physical Metrics</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.physical ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="height">Height (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>BMI (calculated)</Label>
                  <Input value={bmi.toFixed(1)} disabled className="bg-muted" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Medical Profile */}
          <Collapsible open={openSections.medical} onOpenChange={() => toggleSection('medical')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <span className="font-semibold">Medical Profile</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.medical ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div>
                <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                <Input
                  id="allergies"
                  value={formData.allergies.join(', ')}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                />
              </div>
              <div>
                <Label htmlFor="conditions">Chronic Conditions (comma-separated)</Label>
                <Input
                  id="conditions"
                  value={formData.chronicConditions.join(', ')}
                  onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Administrative */}
          <Collapsible open={openSections.admin} onOpenChange={() => toggleSection('admin')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <span className="font-semibold">Administrative</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.admin ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: PatientStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PatientStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={PatientStatus.DISCHARGED}>Discharged</SelectItem>
                      <SelectItem value={PatientStatus.PENDING}>Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value: RiskLevel) => setFormData({ ...formData, riskLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RiskLevel.LOW}>Low</SelectItem>
                      <SelectItem value={RiskLevel.MODERATE}>Moderate</SelectItem>
                      <SelectItem value={RiskLevel.HIGH}>High</SelectItem>
                      <SelectItem value={RiskLevel.CRITICAL}>Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditPatientDialog.displayName = 'EditPatientDialog';
