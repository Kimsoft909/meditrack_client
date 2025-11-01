// Clinical command center - Real-time hospital operations overview

import { memo } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { KPIMetricCard } from '@/components/dashboard/KPIMetricCard';
import { CriticalAlertsList } from '@/components/dashboard/CriticalAlertsList';
import { RiskDistributionChart } from '@/components/dashboard/RiskDistributionChart';
import { VitalsSparklines } from '@/components/dashboard/VitalsSparklines';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MedicationOverview } from '@/components/dashboard/MedicationOverview';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Users, AlertTriangle, FileText, Calendar } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    kpiMetrics,
    riskDistribution,
    vitalsTrends,
    medicationStats,
    recentActivity,
    criticalPatients,
  } = useDashboardData();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clinical Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link to="/patients">
          <Button size="sm">
            View All Patients
          </Button>
        </Link>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIMetricCard
          title="Active Patients"
          value={kpiMetrics.activePatients}
          icon={Users}
          trend={kpiMetrics.trends.activePatients}
          variant="success"
          onClick={() => navigate('/patients')}
        />
        <KPIMetricCard
          title="Critical Cases"
          value={kpiMetrics.criticalCases}
          icon={AlertTriangle}
          trend={kpiMetrics.trends.criticalCases}
          variant="critical"
          onClick={() => navigate('/patients')}
        />
        <KPIMetricCard
          title="Pending Reviews"
          value={kpiMetrics.pendingReviews}
          icon={FileText}
          trend={kpiMetrics.trends.pendingReviews}
          variant="warning"
          onClick={() => navigate('/ai-analysis')}
        />
        <KPIMetricCard
          title="Today's Appointments"
          value={kpiMetrics.todayAppointments}
          icon={Calendar}
          trend={kpiMetrics.trends.todayAppointments}
          variant="default"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column - Critical Alerts (40% width) */}
        <div className="lg:col-span-5">
          <CriticalAlertsList patients={criticalPatients} />
        </div>

        {/* Center Column - Clinical Insights (35% width) */}
        <div className="lg:col-span-4 space-y-5">
          <RiskDistributionChart data={riskDistribution} />
          <VitalsSparklines trends={vitalsTrends} />
        </div>

        {/* Right Column - Quick Stats (25% width) */}
        <div className="lg:col-span-3 space-y-5">
          <MedicationOverview stats={medicationStats} />
          <ActivityFeed events={recentActivity} />
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);
