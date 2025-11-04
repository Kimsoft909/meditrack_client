// PDF export utilities for medical documents using jsPDF

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Medication, Visit, Patient } from '@/types/patient';

/**
 * Export patient prescriptions to PDF
 */
export const exportPrescriptionsPDF = (
  patient: Patient,
  medications: Medication[],
  providerName: string = 'Dr. System Admin'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL PRESCRIPTION', pageWidth / 2, 20, { align: 'center' });
  
  // Patient Info Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(200);
  doc.rect(15, 30, pageWidth - 30, 35);
  
  let yPos = 38;
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, 20, yPos);
  doc.text(`DOB: ${format(patient.dateOfBirth, 'MM/dd/yyyy')}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Age: ${patient.age} years`, 20, yPos);
  doc.text(`Sex: ${patient.sex}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Contact: ${patient.contactNumber}`, 20, yPos);
  
  if (patient.allergies.length > 0) {
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`⚠ Allergies: ${patient.allergies.join(', ')}`, 20, yPos);
    doc.setTextColor(0, 0, 0);
  }
  
  // Medications
  yPos = 75;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIBED MEDICATIONS', 20, yPos);
  doc.setDrawColor(0);
  doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
  
  yPos += 10;
  const activeMeds = medications.filter(m => !m.endDate);
  
  activeMeds.forEach((med, index) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${med.name}`, 20, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dosage: ${med.dosage}`, 25, yPos);
    doc.text(`Frequency: ${med.frequency}`, 100, yPos);
    
    yPos += 5;
    if (med.route) {
      doc.text(`Route: ${med.route}`, 25, yPos);
      yPos += 5;
    }
    
    doc.text(`Instructions: ${med.instructions}`, 25, yPos);
    
    yPos += 5;
    doc.text(`Start Date: ${format(med.startDate, 'MM/dd/yyyy')}`, 25, yPos);
    doc.text(`Refills: ${med.refillsRemaining}`, 100, yPos);
    
    yPos += 10;
    doc.setDrawColor(230);
    doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
  });
  
  // Footer
  yPos = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Prescribed by:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(providerName, 20, yPos + 6);
  
  doc.text('Date:', pageWidth - 60, yPos);
  doc.text(format(new Date(), 'MM/dd/yyyy'), pageWidth - 60, yPos + 6);
  
  yPos += 15;
  doc.line(20, yPos, 80, yPos);
  doc.text('Signature', 20, yPos + 5);
  
  // Save
  const fileName = `Prescription_${patient.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};

/**
 * Export visit history to PDF
 */
export const exportVisitHistoryPDF = (
  patient: Patient,
  visits: Visit[],
  providerName: string = 'Dr. System Admin'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('VISIT HISTORY REPORT', pageWidth / 2, 20, { align: 'center' });
  
  // Patient Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(200);
  doc.rect(15, 30, pageWidth - 30, 25);
  
  let yPos = 38;
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, 20, yPos);
  doc.text(`DOB: ${format(patient.dateOfBirth, 'MM/dd/yyyy')}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Age: ${patient.age} years`, 20, yPos);
  doc.text(`Sex: ${patient.sex}`, 120, yPos);
  
  // Visits
  yPos = 65;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VISIT RECORDS', 20, yPos);
  doc.setDrawColor(0);
  doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
  
  yPos += 10;
  const sortedVisits = [...visits].sort((a, b) => b.date.getTime() - a.date.getTime());
  
  sortedVisits.forEach((visit, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Visit header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const visitType = visit.visit_type || (visit.reason?.toLowerCase().includes('emergency') ? 'emergency' : 'routine');
    doc.text(`Visit ${index + 1} - ${format(visit.date, 'MMMM dd, yyyy')}`, 20, yPos);
    doc.setFontSize(9);
    doc.text(`[${visitType.toUpperCase()}]`, pageWidth - 50, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (visit.department) {
      doc.text(`Department: ${visit.department}`, 25, yPos);
      yPos += 5;
    }
    
    if (visit.provider || visit.doctorName) {
      doc.text(`Provider: ${visit.provider || visit.doctorName}`, 25, yPos);
      yPos += 5;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Chief Complaint:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    doc.text(visit.chief_complaint || visit.reason || 'N/A', 25, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnosis:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    const diagnosisLines = doc.splitTextToSize(visit.diagnosis, pageWidth - 50);
    doc.text(diagnosisLines, 25, yPos);
    yPos += diagnosisLines.length * 5;
    
    if (visit.treatment) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Treatment:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const treatmentLines = doc.splitTextToSize(visit.treatment, pageWidth - 50);
      doc.text(treatmentLines, 25, yPos);
      yPos += treatmentLines.length * 5;
    }
    
    if (visit.notes) {
      yPos += 3;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      const notesLines = doc.splitTextToSize(`Notes: ${visit.notes}`, pageWidth - 50);
      doc.text(notesLines, 25, yPos);
      yPos += notesLines.length * 4;
    }
    
    yPos += 8;
    doc.setDrawColor(230);
    doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
  });
  
  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Generated by:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(providerName, 20, yPos + 6);
  
  doc.text('Date:', pageWidth - 60, yPos);
  doc.text(format(new Date(), 'MM/dd/yyyy'), pageWidth - 60, yPos + 6);
  
  // Save
  const fileName = `VisitHistory_${patient.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
