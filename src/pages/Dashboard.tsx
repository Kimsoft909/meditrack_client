// Dashboard page - Today's clinical snapshot with alerts and patient trends

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { RiskBadge } from '@/components/RiskBadge';
import { VitalsChart } from '@/components/VitalsChart';
import { mockDashboardStats, mockPatients } from '@/utils/mockData';
import { RiskLevel } from '@/types/patient';
import { Activity, Users, Pill, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // Filter patients needing attention (high risk or critical)
  const patientsAtRisk = mockPatients.filter(
    (p) => p.riskLevel === RiskLevel.HIGH || p.riskLevel === RiskLevel.CRITICAL
  );

  // Get recent activity trend from most recent patient
  const recentPatient = mockPatients.find(p => p.id === 'P001');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link to="/patients">
          <Button size="sm" className="btn-compact">
            View All Patients
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patients at Risk"
          value={mockDashboardStats.patientsAtRisk}
          icon={AlertTriangle}
          variant="critical"
          subtitle="Require attention"
        />
        <StatCard
          title="Active Patients"
          value={mockDashboardStats.activePatients}
          icon={Users}
          variant="success"
          subtitle="Under care"
        />
        <StatCard
          title="Med Changes Today"
          value={mockDashboardStats.medicationChanges}
          icon={Pill}
          variant="warning"
          subtitle="Pending review"
        />
        <StatCard
          title="Pending AI Reports"
          value={mockDashboardStats.pendingReports}
          icon={FileText}
          variant="default"
          subtitle="Ready to review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Critical Alerts Panel */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-card to-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Patients Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patientsAtRisk.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No critical alerts at this time
              </p>
            ) : (
              patientsAtRisk.map((patient) => (
                <Link 
                  key={patient.id} 
                  to={`/patient/${patient.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-smooth">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{patient.name}</p>
                        <RiskBadge level={patient.riskLevel} compact />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patient.chronicConditions.join(', ') || 'No chronic conditions'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last visit: {format(patient.lastVisit, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="btn-compact ml-2">
                      View
                    </Button>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Total Patients</span>
                <span className="text-2xl font-bold text-primary">{mockDashboardStats.totalPatients}</span>
              </div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Critical Cases</span>
                <span className="text-2xl font-bold text-destructive">
                  {mockPatients.filter(p => p.riskLevel === RiskLevel.CRITICAL).length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Immediate attention needed</p>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Stable Patients</span>
                <span className="text-2xl font-bold text-success">
                  {mockPatients.filter(p => p.riskLevel === RiskLevel.LOW).length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">No immediate concerns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Patient Vitals Trend */}
      {recentPatient && (
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Vitals Trend - {recentPatient.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VitalsChart 
              vitals={recentPatient.vitals} 
              dataKeys={['heartRate', 'oxygenSaturation', 'systolic']}
              height={250}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(Dashboard);
