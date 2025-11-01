// Patient profile page - Comprehensive patient view with tabbed interface

import { memo, useState } from 'react';
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

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const patient = patientService.getPatientById(id || '');

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

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
                    <CardTitle className="text-sm font-semibold">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{patient.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Relationship</span>
                        <span className="font-medium">{patient.emergencyContact.relationship}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{patient.emergencyContact.phone}</span>
                      </div>
                    </div>
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
              <AddVitalReadingForm patientId={patient.id} vitalType="bp" onSuccess={handleUpdate} />

              {/* Vital Signs Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="medical-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Heart Rate & O2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VitalsChart 
                      vitals={patient.vitals} 
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
                      vitals={patient.vitals} 
                      dataKeys={['systolic', 'diastolic']}
                      height={240}
                    />
                  </CardContent>
                </Card>
              </div>

              {patient.vitals.some(v => v.bloodGlucose) && (
                <Card className="medical-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Blood Glucose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VitalsChart 
                      vitals={patient.vitals.filter(v => v.bloodGlucose).map(v => ({ ...v, glucose: v.bloodGlucose }))} 
                      dataKeys={['glucose']}
                      height={240}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Treatment Tab */}
            <TabsContent value="treatment" className="space-y-4 mt-4">
              <MedicationTable 
                medications={patient.medications} 
                patientId={patient.id}
                onUpdate={handleUpdate}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <VisitHistoryTable visits={patient.visits} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default memo(PatientProfile);
