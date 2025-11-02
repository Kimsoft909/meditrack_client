"""PDF/CSV export utilities."""

from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def generate_pdf_report(report) -> bytes:
    """Generate PDF report from analysis data."""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, f"Clinical Analysis Report - {report.report_id}")
    
    # Patient info
    c.setFont("Helvetica", 12)
    y = 720
    c.drawString(50, y, f"Patient: {report.patient.name}")
    y -= 20
    c.drawString(50, y, f"Age: {report.patient.age} | Sex: {report.patient.sex} | BMI: {report.patient.bmi}")
    
    # Executive summary
    y -= 40
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Executive Summary")
    y -= 20
    c.setFont("Helvetica", 10)
    
    # Wrap text
    summary_lines = report.executive_summary.split('. ')
    for line in summary_lines[:5]:
        if y < 50:
            break
        c.drawString(50, y, line[:80])
        y -= 15
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.read()
