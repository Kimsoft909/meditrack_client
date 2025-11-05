// Patients list page - Searchable table with filters and quick actions

import { memo, useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/RiskBadge';
import { AddPatientDialog } from '@/components/AddPatientDialog';
import { patientService } from '@/services/patientService';
import { PatientStatus, RiskLevel } from '@/types/patient';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Patient } from '@/types/patient';

const PatientsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch patients from backend
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientService.getPatients({
        page: currentPage,
        pageSize: 50,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        riskLevel: riskFilter !== 'all' ? riskFilter : undefined,
      });
      
      setPatients(response.patients);
      setTotalPatients(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      logger.error('Failed to fetch patients', error);
      toast.error(error.response?.data?.detail || 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchQuery, statusFilter, riskFilter]);

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchPatients();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? 'Loading...' : `Showing ${patients.length} of ${totalPatients} patients`}
          </p>
        </div>
        <AddPatientDialog onSuccess={handleRefresh} />
      </div>

      {/* Search and Filters - Redesigned */}
      <Card className="bg-gradient-to-r from-card to-card/50 border-primary/10">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-xs bg-background/50"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground hidden lg:block" />
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as PatientStatus | 'all')}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={PatientStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={PatientStatus.DISCHARGED}>Discharged</SelectItem>
                </SelectContent>
              </Select>

              {/* Risk Filter */}
              <Select value={riskFilter} onValueChange={(val) => setRiskFilter(val as RiskLevel | 'all')}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-background/50">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value={RiskLevel.CRITICAL}>Critical</SelectItem>
                  <SelectItem value={RiskLevel.HIGH}>High</SelectItem>
                  <SelectItem value={RiskLevel.MODERATE}>Moderate</SelectItem>
                  <SelectItem value={RiskLevel.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Age</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Sex</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Last Visit</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Risk</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No patients found</p>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr 
                      key={patient.id}
                      className="border-b border-border hover:bg-accent transition-smooth"
                    >
                      <td className="py-2.5 px-3 text-xs font-medium">{patient.id}</td>
                      <td className="py-2.5 px-3 text-xs font-medium">{patient.name}</td>
                      <td className="py-2.5 px-3 text-xs">{patient.age}</td>
                      <td className="py-2.5 px-3 text-xs">{patient.sex}</td>
                      <td className="py-2.5 px-3 text-xs">{format(patient.lastVisit, 'MMM d, yyyy')}</td>
                      <td className="py-2.5 px-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            patient.status === PatientStatus.ACTIVE 
                              ? 'status-stable' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <RiskBadge level={patient.riskLevel} compact />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link to={`/patient/${patient.id}`}>
                          <Button variant="outline" size="sm" className="btn-compact">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-compact"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-compact"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(PatientsList);
