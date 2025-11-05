// Clinical command center - Real-time hospital operations overview

import { memo } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KPIMetricCard } from '@/components/dashboard/KPIMetricCard';
import { CriticalAlertsList } from '@/components/dashboard/CriticalAlertsList';
import { RiskDistributionChart } from '@/components/dashboard/RiskDistributionChart';
import { VitalsSparklines } from '@/components/dashboard/VitalsSparklines';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MedicationOverview } from '@/components/dashboard/MedicationOverview';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Users, AlertTriangle, FileText, Calendar, AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    kpiMetrics,
    riskDistribution,
    vitalsTrends,
    medicationStats,
    recentActivity,
    criticalPatients,
    isLoading,
    error,
  } = useDashboardData();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-5 h-96" />
          <Skeleton className="lg:col-span-4 h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    logger.error('Dashboard error:', error);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clinical Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load dashboard data</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
