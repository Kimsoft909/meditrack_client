// Custom medical-themed patient quick info card

import { memo } from 'react';
import { User, Phone, Mail, Calendar, AlertTriangle, Heart, Droplet } from 'lucide-react';
import { Patient } from '@/types/patient';
import { RiskBadge } from '@/components/RiskBadge';
import { BMIIndicator } from '@/components/BMIIndicator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface PatientQuickInfoProps {
  patient: Patient;
}

export const PatientQuickInfo = memo(({ patient }: PatientQuickInfoProps) => {
  const lastVisitDays = Math.floor((Date.now() - patient.lastVisit.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="medical-card sticky top-4">
      {/* Header with gradient and medical pattern */}
      <div className="relative h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-t-xl overflow-hidden">
        <div className="absolute inset-0 medical-grid-pattern opacity-30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${
              patient.riskLevel === 'critical' ? 'animate-pulse bg-destructive/30' : ''
            }`} />
            <div className="relative w-20 h-20 rounded-full bg-muted border-4 border-background flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="pt-12 px-4 pb-4 space-y-4">
        <div className="text-center">
          <h2 className="font-bold text-lg mb-1">{patient.name}</h2>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">{patient.id}</Badge>
            <RiskBadge level={patient.riskLevel} />
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{patient.age}</div>
            <div className="text-xs text-muted-foreground">Years</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{patient.sex}</div>
            <div className="text-xs text-muted-foreground">Sex</div>
          </div>
        </div>

        {/* Blood Type & BMI */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
            <Droplet className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">Blood Type:</span>
            <span className="text-sm font-bold text-red-600">{patient.bloodType || 'N/A'}</span>
          </div>
          
          <BMIIndicator 
            bmi={patient.bmi} 
            weight={patient.weight} 
            height={patient.height}
            compact
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{patient.contactNumber}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{patient.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">DOB: {format(patient.dateOfBirth, 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {/* Allergies */}
        {patient.allergies.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Allergies</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {patient.allergies.map((allergy, idx) => (
                <Badge key={idx} variant="destructive" className="text-xs">
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last Visit */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          <Heart className="h-3 w-3 inline mr-1" />
          Last visit: {lastVisitDays === 0 ? 'Today' : `${lastVisitDays} days ago`}
        </div>
      </div>
    </div>
  );
});

PatientQuickInfo.displayName = 'PatientQuickInfo';
