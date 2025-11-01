// Professional medication table with action menu

import { memo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Medication } from '@/types/patient';
import { MoreVertical, Edit, Eye, RefreshCw, StopCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { patientService } from '@/services/patientService';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface MedicationTableProps {
  patientId: string;
  medications: Medication[];
  onUpdate?: () => void;
}

export const MedicationTable = memo(({ patientId, medications, onUpdate }: MedicationTableProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    prescriptionNumber: '',
    instructions: '',
    refillsRemaining: 0,
  });

  const handleRefill = (med: Medication) => {
    const result = patientService.refillMedication(patientId, med.id);
    if (result) {
      toast({ title: 'Refill processed', description: `${med.name} refill recorded` });
      onUpdate?.();
    } else {
      toast({ title: 'Error', description: 'No refills remaining', variant: 'destructive' });
    }
  };

  const handleDiscontinue = (med: Medication) => {
    const result = patientService.discontinueMedication(patientId, med.id);
    if (result) {
      toast({ title: 'Medication discontinued', description: `${med.name} has been discontinued` });
      onUpdate?.();
    }
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    const result = patientService.addMedication(patientId, {
      ...newMed,
      startDate: new Date(),
    });
    
    if (result) {
      toast({ title: 'Medication added', description: 'New prescription recorded' });
      setAddDialogOpen(false);
      setNewMed({
        name: '',
        dosage: '',
        frequency: '',
        prescribedBy: '',
        prescriptionNumber: '',
        instructions: '',
        refillsRemaining: 0,
      });
      onUpdate?.();
    }
  };

  const activeMedications = medications.filter(m => !m.endDate);
  const discontinuedMedications = medications.filter(m => m.endDate);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Current Medications</h3>
        <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
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
              <TableHead className="text-center">Refills</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeMedications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                  <TableCell>{med.prescribedBy}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={med.refillsRemaining > 0 ? 'secondary' : 'destructive'}>
                      {med.refillsRemaining}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleRefill(med)} disabled={med.refillsRemaining <= 0}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refill
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
                <Label htmlFor="medName">Drug Name</Label>
                <Input
                  id="medName"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="prescriber">Prescriber</Label>
              <Input
                id="prescriber"
                value={newMed.prescribedBy}
                onChange={(e) => setNewMed({ ...newMed, prescribedBy: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="rxNumber">Prescription Number</Label>
              <Input
                id="rxNumber"
                value={newMed.prescriptionNumber}
                onChange={(e) => setNewMed({ ...newMed, prescriptionNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Input
                id="instructions"
                value={newMed.instructions}
                onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="refills">Refills Remaining</Label>
              <Input
                id="refills"
                type="number"
                value={newMed.refillsRemaining}
                onChange={(e) => setNewMed({ ...newMed, refillsRemaining: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Medication</Button>
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
                  <Label className="text-muted-foreground">Prescription #</Label>
                  <p className="font-mono text-sm">{selectedMed.prescriptionNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p>{format(selectedMed.startDate, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Refills Remaining</Label>
                  <p>{selectedMed.refillsRemaining}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

MedicationTable.displayName = 'MedicationTable';
