// Professional medication table with action menu

import { memo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Medication, Patient, MedicationCreate } from '@/types/patient';
import { MoreVertical, Edit, Eye, RefreshCw, StopCircle, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { EditMedicationDialog } from './EditMedicationDialog';
import { RefillMedicationDialog } from './RefillMedicationDialog';
import { exportPrescriptionsPDF } from '@/utils/pdfExport';

interface MedicationTableProps {
  patientId: string;
  patient: Patient;
  medications: Medication[];
  onUpdate?: () => void;
}

export const MedicationTable = memo(({ patientId, patient, medications, onUpdate }: MedicationTableProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    route: '',
    prescribedBy: '',
    indication: '',
    notes: '',
  });

  const handleRefillClick = (med: Medication) => {
    setSelectedMed(med);
    setRefillDialogOpen(true);
  };

  const handleEditClick = (med: Medication) => {
    setSelectedMed(med);
    setEditDialogOpen(true);
  };

  const handleExportPDF = () => {
    try {
      exportPrescriptionsPDF(patient, medications);
      toast.success('Prescriptions exported to PDF');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  const handleDiscontinue = async (med: Medication) => {
    try {
      await patientService.discontinueMedication(med.id);
      logger.info('Medication discontinued', { medicationId: med.id });
      toast.success(`${med.name} has been discontinued`);
      onUpdate?.();
    } catch (error: any) {
      logger.error('Failed to discontinue medication', error);
      toast.error(error.response?.data?.detail || 'Failed to discontinue medication');
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const medicationData: MedicationCreate = {
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        route: newMed.route || undefined,
        prescribed_by: newMed.prescribedBy || undefined,
        indication: newMed.indication || undefined,
        notes: newMed.notes || undefined,
      };

      await patientService.addMedication(patientId, medicationData);
      logger.info('Medication added', { patientId });
      
      toast.success('New prescription recorded');
      setAddDialogOpen(false);
      setNewMed({
        name: '',
        dosage: '',
        frequency: '',
        route: '',
        prescribedBy: '',
        indication: '',
        notes: '',
      });
      onUpdate?.();
    } catch (error: any) {
      logger.error('Failed to add medication', error);
      toast.error(error.response?.data?.detail || 'Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeMedications = medications.filter(m => !m.endDate);
  const discontinuedMedications = medications.filter(m => m.endDate);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Current Medications</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-2">
            <Download className="h-3 w-3" />
            Export Prescriptions
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Medication
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drug Name</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Prescriber</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeMedications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No active medications
                </TableCell>
              </TableRow>
            ) : (
              activeMedications.map((med) => (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.name}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{format(med.startDate, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{med.prescribedBy || 'Not specified'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="status-stable">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedMed(med); setViewDialogOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(med)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Extend Duration (Disabled)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDiscontinue(med)} className="text-destructive">
                          <StopCircle className="h-4 w-4 mr-2" />
                          Discontinue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {discontinuedMedications.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Show discontinued medications ({discontinuedMedications.length})
          </summary>
          <div className="mt-2 border rounded-lg overflow-hidden opacity-60">
            <Table>
              <TableBody>
                {discontinuedMedications.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium line-through">{med.name}</TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>
                      {format(med.startDate, 'MMM dd, yyyy')} - {med.endDate && format(med.endDate, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{med.prescribedBy}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="status-critical">Discontinued</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}

      {/* Add Medication Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMedication} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="medName">Drug Name *</Label>
                <Input
                  id="medName"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Input
                  id="frequency"
                  value={newMed.frequency}
                  onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                  placeholder="e.g., twice daily"
                  required
                />
              </div>
              <div>
                <Label htmlFor="route">Route</Label>
                <Input
                  id="route"
                  value={newMed.route}
                  onChange={(e) => setNewMed({ ...newMed, route: e.target.value })}
                  placeholder="e.g., oral, IV"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prescriber">Prescriber</Label>
              <Input
                id="prescriber"
                value={newMed.prescribedBy}
                onChange={(e) => setNewMed({ ...newMed, prescribedBy: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="indication">Indication (Reason)</Label>
              <Input
                id="indication"
                value={newMed.indication}
                onChange={(e) => setNewMed({ ...newMed, indication: e.target.value })}
                placeholder="Why is this medication prescribed?"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes / Instructions</Label>
              <Input
                id="notes"
                value={newMed.notes}
                onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                placeholder="Special instructions or notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Medication'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medication Details</DialogTitle>
          </DialogHeader>
          {selectedMed && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Drug Name</Label>
                  <p className="font-semibold">{selectedMed.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dosage</Label>
                  <p className="font-semibold">{selectedMed.dosage}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Frequency</Label>
                <p className="font-semibold">{selectedMed.frequency}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Instructions</Label>
                <p>{selectedMed.instructions}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Prescribed By</Label>
                  <p>{selectedMed.prescribedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Indication</Label>
                  <p className="text-sm">{selectedMed.indication || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p>{format(selectedMed.startDate, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{selectedMed.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Medication Dialog */}
      <EditMedicationDialog
        medication={selectedMed}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onUpdate}
      />

      {/* Refill Medication Dialog */}
      <RefillMedicationDialog
        medication={selectedMed}
        open={refillDialogOpen}
        onOpenChange={setRefillDialogOpen}
        onSuccess={onUpdate}
      />
    </div>
  );
});

MedicationTable.displayName = 'MedicationTable';
