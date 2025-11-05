// Patient profile page - Comprehensive patient view with tabbed interface

import { memo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientQuickInfo } from '@/components/PatientQuickInfo';
import { EditPatientDialog } from '@/components/EditPatientDialog';
import { BMIIndicator } from '@/components/BMIIndicator';
import { MedicationTable } from '@/components/MedicationTable';
import { VisitHistoryTable } from '@/components/VisitHistoryTable';
import { VitalsChart } from '@/components/VitalsChart';
import { AddVitalReadingForm } from '@/components/AddVitalReadingForm';
import { patientService } from '@/services/patientService';
import { ArrowLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { Patient, Visit, Medication, Vitals, VitalResponse, MedicationResponse, VisitResponse } from '@/types/patient';

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  // Fetch patient data
  const fetchPatientData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const patientData = await patientService.getPatientById(id);
      setPatient(patientData);

      // Fetch related data
      const [vitalsData, medicationsData, visitsData] = await Promise.all([
        patientService.getPatientVitals(id).catch(() => []),
        patientService.getPatientMedications(id, false).catch(() => []),
        patientService.getPatientVisits(id).catch(() => []),
      ]);

      // Transform vitals
      setVitals(vitalsData.map((v: VitalResponse) => ({
        id: v.id,
        timestamp: new Date(v.timestamp),
        bloodPressureSystolic: v.blood_pressure_systolic,
        bloodPressureDiastolic: v.blood_pressure_diastolic,
        heartRate: v.heart_rate,
        temperature: v.temperature,
        oxygenSaturation: v.oxygen_saturation,
        bloodGlucose: v.blood_glucose,
      })));

      // Transform medications
      setMedications(medicationsData.map((m: MedicationResponse) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        startDate: new Date(m.start_date || new Date()),
        endDate: m.end_date ? new Date(m.end_date) : undefined,
        prescribedBy: m.prescribed_by || 'Not specified',
        prescriptionNumber: 'N/A',
        instructions: m.notes || '',
        refillsRemaining: 0,
        indication: m.indication,
        notes: m.notes,
        drug_id: m.drug_id,
        is_active: m.is_active,
      })));

      // Transform visits
      setVisits(visitsData.map((v: VisitResponse) => ({
        id: v.id,
        date: new Date(v.visit_date),
        visit_type: v.visit_type,
        department: v.department,
        provider: v.provider,
        chief_complaint: v.chief_complaint,
        diagnosis: v.diagnosis || '',
        treatment: v.treatment,
        notes: v.notes || '',
      })));

      logger.info('Patient profile data loaded', { patientId: id });
    } catch (error: any) {
      logger.error('Failed to fetch patient data', error);
      toast.error(error.response?.data?.detail || 'Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleUpdate = () => {
    fetchPatientData();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 max-w-[1400px] mx-auto animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-muted rounded"></div>
          <div className="flex-1">
            <div className="h-6 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="h-96 bg-muted rounded-lg"></div>
          <div className="lg:col-span-3 h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Patient not found</p>
          <Link to="/patients">
            <Button size="sm">Back to Patients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-[1400px] mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Link to="/patients">
          <Button variant="outline" size="sm" className="btn-compact gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
          <p className="text-xs text-muted-foreground">Patient ID: {patient.id}</p>
        </div>
        <EditPatientDialog patient={patient} onSuccess={handleUpdate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - Patient Quick Info */}
        <PatientQuickInfo patient={patient} />

        {/* Main Content - Tabbed Interface */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="vitals" className="text-xs">Vitals</TabsTrigger>
              <TabsTrigger value="treatment" className="text-xs">Treatment</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* BMI & Physical Metrics */}
              {patient.height && patient.weight && (
                <BMIIndicator 
                  bmi={patient.bmi || 0}
                  weight={patient.weight}
                  height={patient.height}
                />
              )}

              {/* Health Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="medical-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Chronic Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.chronicConditions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No chronic conditions recorded</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {patient.chronicConditions.map((condition, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium border border-warning/20"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="medical-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Allergies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.allergies.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No known allergies</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies.map((allergy, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="medical-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Last visit: {format(patient.lastVisit, 'MMMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vitals Tab */}
            <TabsContent value="vitals" className="space-y-4 mt-4">
              {/* Add Vital Reading */}
              <AddVitalReadingForm patientId={patient.id} onSuccess={handleUpdate} />

              {vitals.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No vital signs recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-2">Add a reading above to start tracking vitals</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="medical-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Heart Rate & O2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VitalsChart 
                        vitals={vitals} 
                        dataKeys={['heartRate', 'oxygenSaturation']}
                        height={240}
                      />
                    </CardContent>
                  </Card>

                  <Card className="medical-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Blood Pressure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VitalsChart 
                        vitals={vitals} 
                        dataKeys={['systolic', 'diastolic']}
                        height={240}
                      />
                    </CardContent>
                  </Card>

                  <Card className="medical-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Temperature</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VitalsChart 
                        vitals={vitals} 
                        dataKeys={['temperature']}
                        height={240}
                      />
                    </CardContent>
                  </Card>

                  {vitals.some(v => v.bloodGlucose) && (
                    <Card className="medical-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Blood Glucose</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <VitalsChart 
                          vitals={vitals} 
                          dataKeys={['bloodGlucose']}
                          height={240}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Treatment Tab */}
            <TabsContent value="treatment" className="space-y-4 mt-4">
              <MedicationTable 
                medications={medications} 
                patientId={patient.id}
                patient={patient}
                onUpdate={handleUpdate}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <VisitHistoryTable 
                visits={visits} 
                patientId={patient.id}
                patient={patient}
                onUpdate={handleUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default memo(PatientProfile);
