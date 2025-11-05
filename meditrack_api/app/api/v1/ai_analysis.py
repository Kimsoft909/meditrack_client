"""
AI-powered clinical analysis report generation.
"""

from fastapi import APIRouter, Depends, status, BackgroundTasks, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.ai_analysis import (
    AnalysisRequest,
    AnalysisReportResponse
)
from app.services.ai_analysis_service import AIAnalysisService
from app.models.user import User


router = APIRouter(prefix="/ai-analysis", tags=["AI Analysis"])


@router.post("/generate", response_model=AnalysisReportResponse)
async def generate_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive AI clinical analysis report.
    
    Includes:
    - Executive summary (LLM-generated)
    - Vitals analysis (trend detection, anomalies)
    - Medication review (adherence, interactions)
    - Risk assessment (calculated risk score)
    - Actionable recommendations
    
    Processing time: 3-5 seconds
    """
    service = AIAnalysisService(db)
    
    report = await service.generate_analysis_report(
        patient_id=request.patient_id,
        date_range=request.date_range,
        options=request.options
    )
    
    background_tasks.add_task(service.save_report, report)
    
    return report


@router.get("/{report_id}", response_model=AnalysisReportResponse)
async def get_analysis_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve previously generated analysis report."""
    service = AIAnalysisService(db)
    return await service.get_report_by_id(report_id)


@router.get("/{report_id}/export/pdf")
async def export_report_pdf(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export report as PDF."""
    service = AIAnalysisService(db)
    pdf_bytes = await service.export_report_pdf(report_id)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=analysis_{report_id}.pdf",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
