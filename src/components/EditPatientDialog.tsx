// Comprehensive patient profile editor with collapsible sections

import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Edit, ChevronDown } from 'lucide-react';
import { Patient, RiskLevel, PatientStatus } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { toast } from '@/hooks/use-toast';
import { calculateBMI } from '@/utils/medical';

interface EditPatientDialogProps {
  patient: Patient;
  onSuccess?: () => void;
}

export const EditPatientDialog = memo(({ patient, onSuccess }: EditPatientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(patient);
  const [openSections, setOpenSections] = useState({
    personal: true,
    contact: false,
    physical: false,
    medical: false,
    emergency: false,
    admin: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = patientService.updatePatient(patient.id, formData);
    
    if (result) {
      toast({
        title: 'Patient updated',
        description: 'Profile changes saved successfully',
      });
      setOpen(false);
      onSuccess?.();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update patient',
        variant: 'destructive',
      });
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

          {/* Emergency Contact */}
          <Collapsible open={openSections.emergency} onOpenChange={() => toggleSection('emergency')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
              <span className="font-semibold">Emergency Contact</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.emergency ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="emergencyName">Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditPatientDialog.displayName = 'EditPatientDialog';
