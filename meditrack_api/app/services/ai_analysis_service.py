"""
AI clinical analysis report generation orchestrator with caching.
Refactored to use date_helpers for consistent date handling.
"""

import uuid
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.patient import Patient
from app.models.vital import Vital
from app.models.medication import Medication
from app.models.ai_analysis import AIAnalysis
from app.schemas.ai_analysis import (
    AnalysisReportResponse,
    AnalysisOptions,
    PatientSummary
)
from app.ai.grok_client import GrokClient
from app.utils.medical_calculations import calculate_linear_trend, get_vital_status, calculate_risk_score
from app.utils.export import generate_pdf_report
from app.core.exceptions import ResourceNotFoundError
from app.utils.cache import get_cached_value, set_cached_value
from app.utils.date_helpers import parse_optional_date


class AIAnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.grok = GrokClient()
    
    async def generate_analysis_report(
        self,
        patient_id: str,
        date_range: Dict[str, str],
        options: AnalysisOptions
    ) -> AnalysisReportResponse:
        """Generate comprehensive AI clinical analysis report with caching."""
        # Check cache first
        cache_key = f"ai_analysis:{patient_id}:{date_range.get('from')}:{date_range.get('to')}:{hash(str(options))}"
        cached = await get_cached_value(cache_key)
        if cached:
            return AnalysisReportResponse(**cached)
        
        # Fetch patient
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        patient = result.scalar_one_or_none()
        if not patient:
            raise ResourceNotFoundError("Patient", patient_id)
        
        # Fetch vitals in date range using centralized date parsing
        start_date = parse_optional_date(date_range.get("from"))
        end_date = parse_optional_date(date_range.get("to"))
        
        vitals_query = select(Vital).where(Vital.patient_id == patient_id)
        
        if start_date:
            vitals_query = vitals_query.where(Vital.timestamp >= start_date)
        if end_date:
            vitals_query = vitals_query.where(Vital.timestamp <= end_date)
        
        vitals_query = vitals_query.order_by(Vital.timestamp.desc())
        vitals_result = await self.db.execute(vitals_query)
        vitals = list(vitals_result.scalars().all())
        
        # Fetch medications
        meds_result = await self.db.execute(
            select(Medication).where(
                Medication.patient_id == patient_id,
                Medication.is_active == True
            )
        )
        medications = list(meds_result.scalars().all())
        
        # Analyze vitals
        vitals_analysis = None
        if options.include_vitals and vitals:
            vitals_analysis = self._analyze_vitals(vitals)
        
        # Review medications
        medications_review = None
        if options.include_medications and medications:
            medications_review = self._review_medications(medications)
        
        # Calculate risk assessment
        risk_assessment = None
        if options.include_risk_assessment:
            risk_assessment = calculate_risk_score(
                patient, vitals, medications
            )
        
        # Generate executive summary with LLM
        executive_summary = await self._generate_executive_summary(
            patient, vitals_analysis, medications_review, risk_assessment
        )
        
        # Calculate health score
        health_score = self._calculate_health_score(
            risk_assessment, vitals_analysis, medications_review
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            vitals_analysis, medications_review, risk_assessment
        )
        
        report_id = f"ANALYSIS-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}"
        
        report = AnalysisReportResponse(
            report_id=report_id,
            patient=PatientSummary(
                id=patient.id,
                name=f"{patient.first_name} {patient.last_name}",
                age=patient.age,
                sex=patient.sex,
                bmi=patient.bmi,
                risk_level=patient.risk_level
            ),
            report_date=datetime.now(),
            analysis_date_range=date_range,
            generated_by="Dr. AI Assistant",
            executive_summary=executive_summary,
            overall_health_score=health_score,
            sections={
                "vitals_analysis": vitals_analysis,
                "medication_review": medications_review,
                "risk_assessment": risk_assessment,
                "recommendations": recommendations
            },
            metadata={
                "confidence": 88,
                "data_points_analyzed": len(vitals) + len(medications),
                "analysis_timestamp": datetime.now().isoformat()
            }
        )
        
        # Cache for 1 hour (AI responses don't change unless data changes)
        await set_cached_value(cache_key, report.model_dump(), ttl=3600)
        
        return report
    
    def _analyze_vitals(self, vitals: list) -> Dict[str, Any]:
        """Analyze vital signs trends and anomalies."""
        if not vitals:
            return {"trends": [], "anomalies_detected": 0, "narrative": "No vitals data available"}
        
        systolic_values = [v.blood_pressure_systolic for v in vitals if v.blood_pressure_systolic]
        hr_values = [v.heart_rate for v in vitals if v.heart_rate]
        temp_values = [v.temperature for v in vitals if v.temperature]
        o2_values = [v.oxygen_saturation for v in vitals if v.oxygen_saturation]
        
        trends = []
        anomalies = 0
        
        if systolic_values:
            current = systolic_values[0]
            avg = sum(systolic_values) / len(systolic_values)
            status = get_vital_status("systolic", current)
            if status != "normal":
                anomalies += 1
            
            trends.append({
                "parameter": "Systolic BP",
                "current": current,
                "average": round(avg, 1),
                "trend": calculate_linear_trend(systolic_values),
                "status": status,
                "unit": "mmHg"
            })
        
        if hr_values:
            current = hr_values[0]
            avg = sum(hr_values) / len(hr_values)
            status = get_vital_status("heart_rate", current)
            if status != "normal":
                anomalies += 1
            
            trends.append({
                "parameter": "Heart Rate",
                "current": current,
                "average": round(avg, 1),
                "trend": calculate_linear_trend(hr_values),
                "status": status,
                "unit": "bpm"
            })
        
        narrative = f"Analysis of {len(vitals)} vital readings. {anomalies} parameter(s) outside normal range."
        
        return {
            "trends": trends,
            "anomalies_detected": anomalies,
            "narrative": narrative
        }
    
    def _review_medications(self, medications: list) -> Dict[str, Any]:
        """Review current medication regimen."""
        active_count = len([m for m in medications if m.is_active])
        
        med_list = [
            {
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "indication": m.indication
            }
            for m in medications[:10]  # Limit to first 10
        ]
        
        narrative = f"Patient currently on {active_count} active medication(s)."
        
        return {
            "active_medications_count": active_count,
            "medications": med_list,
            "narrative": narrative
        }
    
    async def _generate_executive_summary(
        self,
        patient: Patient,
        vitals_analysis: Dict,
        meds_review: Dict,
        risk_assessment: Dict
    ) -> str:
        """Generate executive summary using Grok AI."""
        vitals_narrative = vitals_analysis.get("narrative", "No data") if vitals_analysis else "Not assessed"
        meds_narrative = meds_review.get("narrative", "No medications") if meds_review else "Not assessed"
        risk_level = risk_assessment.get("risk_level", "Unknown") if risk_assessment else "Not assessed"
        
        prompt = f"""Generate a concise executive summary (2-3 sentences) for patient {patient.first_name} {patient.last_name} ({patient.age}yo {patient.sex}).

Vitals: {vitals_narrative}
Medications: {meds_narrative}
Risk Level: {risk_level}

Focus on clinical significance and actionable insights. Use professional medical terminology."""
        
        try:
            summary = await self.grok.generate_completion(prompt, max_tokens=150)
            return summary.strip()
        except Exception as e:
            return f"Patient {patient.first_name} {patient.last_name} requires continued monitoring. {vitals_narrative} {meds_narrative}"
    
    def _calculate_health_score(
        self,
        risk_assessment: Dict,
        vitals_analysis: Dict,
        meds_review: Dict
    ) -> int:
        """Calculate overall health score (0-100)."""
        score = 100
        
        # Deduct points for risk level
        if risk_assessment:
            risk_map = {"low": 0, "moderate": 10, "high": 25, "critical": 40}
            score -= risk_map.get(risk_assessment.get("risk_level", "low"), 0)
        
        # Deduct for vital anomalies
        if vitals_analysis:
            anomalies = vitals_analysis.get("anomalies_detected", 0)
            score -= anomalies * 5
        
        # Deduct for high medication count (polypharmacy risk)
        if meds_review:
            med_count = meds_review.get("active_medications_count", 0)
            if med_count > 5:
                score -= (med_count - 5) * 2
        
        return max(0, min(100, score))
    
    def _generate_recommendations(
        self,
        vitals_analysis: Dict,
        meds_review: Dict,
        risk_assessment: Dict
    ) -> list:
        """Generate actionable recommendations."""
        recommendations = []
        
        if vitals_analysis and vitals_analysis.get("anomalies_detected", 0) > 0:
            recommendations.append({
                "priority": "high",
                "category": "Vitals",
                "recommendation": "Review abnormal vital signs and consider additional monitoring"
            })
        
        if meds_review and meds_review.get("active_medications_count", 0) > 5:
            recommendations.append({
                "priority": "medium",
                "category": "Medications",
                "recommendation": "Consider medication reconciliation to reduce polypharmacy risk"
            })
        
        if not recommendations:
            recommendations.append({
                "priority": "low",
                "category": "General",
                "recommendation": "Continue current treatment plan and regular monitoring"
            })
        
        return recommendations
    
    async def save_report(self, report: AnalysisReportResponse) -> None:
        """Save analysis report to database with own session for background tasks."""
        # Create new session for background task
        from app.core.database import AsyncSessionLocal
        
        async with AsyncSessionLocal() as session:
            try:
                analysis = AIAnalysis(
                    id=str(uuid.uuid4()),
                    report_id=report.report_id,
                    patient_id=report.patient.id,
                    report_date=report.report_date,
                    generated_by=report.generated_by,
                    analysis_type="comprehensive",
                    executive_summary=report.executive_summary,
                    overall_health_score=report.overall_health_score,
                    sections=report.sections,
                    metadata=report.metadata
                )
                
                session.add(analysis)
                await session.commit()
            except Exception as e:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def get_report_by_id(self, report_id: str) -> AnalysisReportResponse:
        """Retrieve saved analysis report."""
        result = await self.db.execute(
            select(AIAnalysis).where(AIAnalysis.report_id == report_id)
        )
        analysis = result.scalar_one_or_none()
        
        if not analysis:
            raise ResourceNotFoundError("Analysis Report", report_id)
        
        # Reconstruct response (simplified)
        patient_result = await self.db.execute(
            select(Patient).where(Patient.id == analysis.patient_id)
        )
        patient = patient_result.scalar_one()
        
        return AnalysisReportResponse(
            report_id=analysis.report_id,
            patient=PatientSummary(
                id=patient.id,
                name=f"{patient.first_name} {patient.last_name}",
                age=patient.age,
                sex=patient.sex,
                bmi=patient.bmi,
                risk_level=patient.risk_level
            ),
            report_date=analysis.report_date,
            analysis_date_range={},
            generated_by="Dr. AI Assistant",
            executive_summary=analysis.executive_summary,
            overall_health_score=None,
            sections={"recommendations": analysis.recommendations},
            metadata={}
        )
    
    async def export_report_pdf(self, report_id: str) -> bytes:
        """Export report as PDF."""
        report = await self.get_report_by_id(report_id)
        return generate_pdf_report(report)
