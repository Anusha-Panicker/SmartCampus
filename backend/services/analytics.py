
import csv
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "processed" / "student_course_analytics.csv"


def load_records():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Processed dataset not found: {DATA_FILE}"
        )

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def as_number(value):
    try:
        return float(value) if value not in ("", None, "?") else None
    except (ValueError, TypeError):
        return None


def get_summary():
    records = load_records()

    outcomes = Counter(
        row.get("final_result", "Unknown") for row in records
    )
    risks = Counter(
        row.get("academic_risk", "Unknown") for row in records
    )

    scored = [
        score
        for row in records
        if (score := as_number(row.get("success_score"))) is not None
    ]

    return {
        "total_records": len(records),
        "unique_students": len({
            row.get("id_student", "") for row in records
        }),
        "course_presentations": len({
            (row.get("code_module", ""), row.get("code_presentation", ""))
            for row in records
        }),
        "outcomes": dict(outcomes),
        "risk_distribution": dict(risks),
        "records_without_scores": sum(
            row.get("score_available") != "yes" for row in records
        ),
        "average_success_score": (
            round(sum(scored) / len(scored), 2) if scored else None
        ),
        "data_source": "OULAD",
        "is_demo": True,
        "score_methodology": (
            "Proposed demo score: 60% assessment mean + "
            "40% cohort engagement percentile."
        ),
    }


def get_students(search="", risk="all", limit=100, offset=0):
    records = load_records()

    search_term = str(search or "").strip().casefold()
    risk_filter = str(risk or "all").strip().casefold()

    filtered = []

    for row in records:
        searchable_fields = (
            row.get("id_student", ""),
            row.get("code_module", ""),
            row.get("code_presentation", ""),
        )

        # Search by student ID, course code, or presentation code.
        if search_term and not any(
            search_term in str(value).casefold()
            for value in searchable_fields
        ):
            continue

        # Apply risk filtering without case-sensitivity issues.
        student_risk = str(
            row.get("academic_risk", "")
        ).strip().casefold()

        if risk_filter != "all" and student_risk != risk_filter:
            continue

        filtered.append(row)

    # Validate pagination values.
    limit = max(1, min(int(limit), 500))
    offset = max(0, int(offset))

    return {
        "total": len(filtered),
        "offset": offset,
        "limit": limit,
        "students": filtered[offset:offset + limit],
    }


def get_student_profile(student_id):
    """
    Return available OULAD records and summary metrics
    for a student across their course presentations.
    """
    records = load_records()

    student_records = [
        row for row in records
        if row.get("id_student") == str(student_id)
    ]

    if not student_records:
        return None

    scores = [
        score
        for row in student_records
        if (score := as_number(row.get("assessment_mean"))) is not None
    ]

    total_clicks = sum(
        int(as_number(row.get("total_lms_clicks")) or 0)
        for row in student_records
    )

    total_active_days = sum(
        int(as_number(row.get("active_lms_days")) or 0)
        for row in student_records
    )

    return {
        "student_id": str(student_id),
        "course_count": len(student_records),
        "average_assessment_mean": (
            round(sum(scores) / len(scores), 2) if scores else None
        ),
        "total_lms_clicks": total_clicks,
        "total_active_lms_days": total_active_days,
        "records": student_records,
        "data_source": "OULAD",
        "is_demo": True,
    }
