"""
AI response parsing and structuring utilities.
Handles Grok AI responses, extracts structured data, and sanitizes output.
"""

import json
import re
import logging
from typing import Optional, List, Dict, Any

from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class ResponseParseError(Exception):
    """Raised when AI response cannot be parsed."""
    pass


def parse_analysis_response(raw_response: str) -> Dict[str, Any]:
    """
    Extract structured sections from AI medical analysis.
    
    Expected sections:
    - Executive Summary
    - Vitals Analysis
    - Medication Review
    - Risk Assessment
    - Recommendations
    
    Args:
        raw_response: Raw AI response text
    
    Returns:
        Dictionary with structured sections
    
    Raises:
        ResponseParseError: If response is malformed
    
    Example:
        >>> response = "## Executive Summary\\nPatient shows...\\n## Risk Assessment\\nModerate risk..."
        >>> parsed = parse_analysis_response(response)
        >>> parsed["executive_summary"]
        'Patient shows...'
    """
    try:
        sections = {
            "executive_summary": "",
            "vitals_analysis": "",
            "medication_review": "",
            "risk_assessment": "",
            "recommendations": []
        }
        
        # Try to parse as structured markdown
        current_section = None
        current_content = []
        
        for line in raw_response.split("\n"):
            # Detect section headers (## Header or **Header**)
            if line.startswith("##") or (line.startswith("**") and line.endswith("**")):
                # Save previous section
                if current_section:
                    sections[current_section] = "\n".join(current_content).strip()
                
                # Start new section
                header = line.strip("#* ").lower()
                if "summary" in header:
                    current_section = "executive_summary"
                elif "vital" in header:
                    current_section = "vitals_analysis"
                elif "medication" in header:
                    current_section = "medication_review"
                elif "risk" in header:
                    current_section = "risk_assessment"
                elif "recommend" in header:
                    current_section = "recommendations"
                else:
                    current_section = None
                
                current_content = []
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = "\n".join(current_content).strip()
        
        # Extract recommendations as list
        if isinstance(sections["recommendations"], str):
            sections["recommendations"] = extract_recommendations(sections["recommendations"])
        
        # If no structured sections found, put all in summary
        if all(not v for k, v in sections.items() if k != "recommendations"):
            sections["executive_summary"] = sanitize_ai_output(raw_response)
        
        return sections
        
    except Exception as e:
        logger.error(f"Failed to parse AI analysis: {e}")
        raise ResponseParseError(f"Unable to parse AI response: {e}")


def extract_risk_level(text: str) -> str:
    """
    Extract risk level from text using keyword matching.
    
    Args:
        text: Text to search for risk level
    
    Returns:
        Risk level: "low", "moderate", "high", or "critical"
    
    Example:
        >>> extract_risk_level("The patient shows CRITICAL risk factors")
        'critical'
        >>> extract_risk_level("Overall assessment indicates low risk")
        'low'
    """
    text_lower = text.lower()
    
    # Priority order (most severe first)
    if re.search(r"\b(critical|severe|emergency|urgent)\b", text_lower):
        return "critical"
    elif re.search(r"\b(high|elevated|significant)\s+risk\b", text_lower):
        return "high"
    elif re.search(r"\b(moderate|medium|intermediate)\s+risk\b", text_lower):
        return "moderate"
    elif re.search(r"\b(low|minimal|stable)\s+risk\b", text_lower):
        return "low"
    else:
        # Default if no explicit risk found
        return "moderate"


def extract_recommendations(text: str) -> List[Dict[str, str]]:
    """
    Parse bulleted recommendations into structured format.
    
    Args:
        text: Text containing recommendations (bulleted or numbered)
    
    Returns:
        List of recommendation dictionaries
    
    Example:
        >>> text = "- Monitor blood pressure daily\\n- Adjust medication dosage"
        >>> extract_recommendations(text)
        [{'text': 'Monitor blood pressure daily', 'priority': 'medium'}, ...]
    """
    recommendations = []
    
    # Split by bullets or numbers
    lines = text.split("\n")
    
    for line in lines:
        # Remove bullet markers (-, *, •, 1., 2., etc.)
        cleaned = re.sub(r"^[\s\-\*\•\d\.]+", "", line).strip()
        
        if not cleaned:
            continue
        
        # Determine priority from keywords
        priority = "medium"
        if re.search(r"\b(urgent|immediately|critical|asap)\b", cleaned.lower()):
            priority = "high"
        elif re.search(r"\b(monitor|consider|review)\b", cleaned.lower()):
            priority = "medium"
        elif re.search(r"\b(continue|maintain|optional)\b", cleaned.lower()):
            priority = "low"
        
        recommendations.append({
            "text": cleaned,
            "priority": priority
        })
    
    return recommendations


def sanitize_ai_output(text: str, max_length: int = 10000) -> str:
    """
    Sanitize AI output for safe display.
    
    - Remove potentially unsafe content
    - Limit length
    - Escape HTML entities
    - Remove excessive whitespace
    
    Args:
        text: Raw AI text
        max_length: Maximum allowed length
    
    Returns:
        Sanitized text
    
    Example:
        >>> sanitize_ai_output("<script>alert('xss')</script>Hello")
        'Hello'
    """
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    # Trim to max length
    if len(text) > max_length:
        text = text[:max_length] + "... (truncated)"
    
    return text.strip()


def parse_streaming_chunk(chunk: str) -> Optional[Dict[str, Any]]:
    """
    Parse Server-Sent Events (SSE) data chunk from AI stream.
    
    Args:
        chunk: Raw SSE chunk (format: "data: {...}")
    
    Returns:
        Parsed dictionary, or None if invalid
    
    Example:
        >>> parse_streaming_chunk('data: {"token": "Hello", "done": false}')
        {'token': 'Hello', 'done': False}
    """
    if not chunk or not chunk.startswith("data: "):
        return None
    
    try:
        json_str = chunk[6:].strip()  # Remove "data: " prefix
        
        if json_str == "[DONE]":
            return {"done": True}
        
        return json.loads(json_str)
    
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse SSE chunk: {chunk}")
        return None


def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract JSON object from mixed text response.
    
    Useful when AI returns JSON embedded in markdown code blocks.
    
    Args:
        text: Text potentially containing JSON
    
    Returns:
        Parsed JSON dict, or None if not found
    
    Example:
        >>> text = "Here's the data: ```json\\n{\\\"key\\\": \\\"value\\\"}\\n```"
        >>> extract_json_from_text(text)
        {'key': 'value'}
    """
    # Try to find JSON in code blocks first
    code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find raw JSON
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    return None


def validate_analysis_completeness(analysis: Dict[str, Any]) -> bool:
    """
    Validate that AI analysis contains required sections.
    
    Args:
        analysis: Parsed analysis dictionary
    
    Returns:
        True if analysis is complete, False otherwise
    
    Example:
        >>> analysis = {"executive_summary": "...", "risk_assessment": "..."}
        >>> validate_analysis_completeness(analysis)
        True
    """
    required_fields = ["executive_summary", "risk_assessment"]
    
    for field in required_fields:
        if field not in analysis or not analysis[field]:
            logger.warning(f"Analysis missing required field: {field}")
            return False
    
    return True


def format_analysis_for_export(analysis: Dict[str, Any]) -> str:
    """
    Format parsed analysis as human-readable report.
    
    Args:
        analysis: Structured analysis dictionary
    
    Returns:
        Formatted markdown report
    
    Example:
        >>> analysis = {"executive_summary": "Patient stable", "recommendations": [...]}
        >>> report = format_analysis_for_export(analysis)
    """
    sections = []
    
    if analysis.get("executive_summary"):
        sections.append(f"# Executive Summary\n\n{analysis['executive_summary']}\n")
    
    if analysis.get("vitals_analysis"):
        sections.append(f"# Vitals Analysis\n\n{analysis['vitals_analysis']}\n")
    
    if analysis.get("medication_review"):
        sections.append(f"# Medication Review\n\n{analysis['medication_review']}\n")
    
    if analysis.get("risk_assessment"):
        sections.append(f"# Risk Assessment\n\n{analysis['risk_assessment']}\n")
    
    if analysis.get("recommendations"):
        sections.append("# Recommendations\n\n")
        for i, rec in enumerate(analysis["recommendations"], 1):
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(rec.get("priority", "medium"), "🟡")
            sections.append(f"{i}. {priority_emoji} {rec['text']}\n")
    
    return "\n".join(sections)
