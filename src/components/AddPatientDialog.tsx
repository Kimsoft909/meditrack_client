// Multi-step form dialog for adding new patients with comprehensive data capture

import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientFormData } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';
import { UserPlus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import { calculateBMI } from '@/utils/medical';

interface AddPatientDialogProps {
  onSuccess?: () => void;
}

export const AddPatientDialog = memo(({ onSuccess }: AddPatientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PatientFormData>>({
    allergies: [],
    chronicConditions: [],
  });
  const [initialVisit, setInitialVisit] = useState({
    visit_type: 'routine' as const,
    department: '',
    chief_complaint: '',
    diagnosis: '',
    notes: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || 
        !formData.sex || !formData.contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Calculate BMI if height and weight provided
    let bmi = 0;
    if (formData.height && formData.weight) {
      bmi = calculateBMI(formData.weight, formData.height);
    }

    const newPatient = patientService.addPatient(formData as PatientFormData);

    toast.success(`Patient ${newPatient.name} added successfully!`);
    setOpen(false);
    setStep(1);
    setFormData({ allergies: [], chronicConditions: [] });
    onSuccess?.();
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.sex) {
        toast.error('Please complete all required fields in Step 1');
        return;
      }
    }
    if (step === 2) {
      if (!formData.contactNumber) {
        toast.error('Please provide a contact number');
        return;
      }
    }
    setStep(prev => Math.min(4, prev + 1));
  };

  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-smooth ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {step} of 4: {step === 1 ? 'Personal Information' : step === 2 ? 'Contact & Emergency' : step === 3 ? 'Medical Information' : 'Initial Visit (Optional)'}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Sex *</Label>
                  <Select value={formData.sex} onValueChange={(val) => updateField('sex', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={formData.bloodType} onValueChange={(val) => updateField('bloodType', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Emergency */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  value={formData.contactNumber || ''}
                  onChange={(e) => updateField('contactNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="patient@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-semibold text-sm mb-3">Emergency Contact</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Name</Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergencyContactName || ''}
                      onChange={(e) => updateField('emergencyContactName', e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelationship">Relationship</Label>
                      <Input
                        id="emergencyRelationship"
                        value={formData.emergencyContactRelationship || ''}
                        onChange={(e) => updateField('emergencyContactRelationship', e.target.value)}
                        placeholder="Spouse"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyContactPhone || ''}
                        onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                        placeholder="+1 (555) 987-6543"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medical Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={formData.height || ''}
                    onChange={(e) => updateField('height', parseFloat(e.target.value))}
                    placeholder="1.75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                    placeholder="70"
                  />
                </div>
                <div className="space-y-2">
                  <Label>BMI</Label>
                  <div className="h-9 px-3 rounded-md border border-input bg-muted/50 flex items-center text-sm">
                    {formData.height && formData.weight
                      ? calculateBMI(formData.weight, formData.height)
                      : '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                <Input
                  id="allergies"
                  value={formData.allergies?.join(', ') || ''}
                  onChange={(e) => updateField('allergies', e.target.value.split(',').map(a => a.trim()).filter(Boolean))}
                  placeholder="Penicillin, Peanuts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chronicConditions">Chronic Conditions (comma-separated)</Label>
                <Input
                  id="chronicConditions"
                  value={formData.chronicConditions?.join(', ') || ''}
                  onChange={(e) => updateField('chronicConditions', e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                  placeholder="Hypertension, Diabetes"
                />
              </div>
            </div>
          )}

          {/* Step 4: Initial Visit (Optional) */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Record initial visit details (optional - can be skipped)</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="visit_type">Visit Type</Label>
                  <Select value={initialVisit.visit_type} onValueChange={(val: any) => setInitialVisit({ ...initialVisit, visit_type: val })}>
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
                  <Label htmlFor="department">Department</Label>
                  <Select value={initialVisit.department} onValueChange={(val) => setInitialVisit({ ...initialVisit, department: val })}>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chief_complaint">Chief Complaint / Reason for Visit</Label>
                <Input
                  id="chief_complaint"
                  value={initialVisit.chief_complaint}
                  onChange={(e) => setInitialVisit({ ...initialVisit, chief_complaint: e.target.value })}
                  placeholder="Primary reason for visit"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={initialVisit.diagnosis}
                  onChange={(e) => setInitialVisit({ ...initialVisit, diagnosis: e.target.value })}
                  placeholder="Initial diagnosis or assessment"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit_notes">Clinical Notes</Label>
                <Input
                  id="visit_notes"
                  value={initialVisit.notes}
                  onChange={(e) => setInitialVisit({ ...initialVisit, notes: e.target.value })}
                  placeholder="Additional observations or notes"
                  className="h-9 text-xs"
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-md border">
                <p className="text-xs text-muted-foreground">
                  <strong>Provider:</strong> Dr. System Admin (auto-filled)
                  <br />
                  <strong>Visit Date:</strong> {format(new Date(), 'MMM dd, yyyy')} (today)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {step < 4 ? (
            <Button size="sm" onClick={nextStep} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} className="gap-2">
              <Check className="h-4 w-4" />
              Create Patient
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

AddPatientDialog.displayName = 'AddPatientDialog';
