
import csv
from pathlib import Path
from bisect import bisect_right
from collections import defaultdict
from statistics import mean

ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = ROOT / "data" / "oulad"
OUTPUT = ROOT / "data" / "processed" / "student_course_analytics.csv"


def find_source():
    required = {
        "studentInfo.csv",
        "studentAssessment.csv",
        "assessments.csv",
        "studentVle.csv",
        "vle.csv",
        "studentRegistration.csv",
        "courses.csv",
    }

    for folder in [DATA_ROOT, *DATA_ROOT.rglob("*")]:
        if not folder.is_dir():
            continue
        files = {p.name for p in folder.iterdir() if p.is_file()}
        if required.issubset(files):
            return folder

    raise FileNotFoundError(
        "Could not find a directory containing all seven OULAD CSV files."
    )


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)


def number(value):
    if value is None or value.strip() in ("", "?"):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def main():
    source = find_source()
    print(f"Source directory: {source}")

    # 1. One record per student-course-presentation.
    students = {}
    for row in read_csv(source / "studentInfo.csv"):
        key = (
            row["id_student"],
            row["code_module"],
            row["code_presentation"],
        )
        students[key] = row

    print(f"Student-course records: {len(students):,}")

    # 2. Assessment metadata.
    assessment_meta = {}
    for row in read_csv(source / "assessments.csv"):
        assessment_meta[row["id_assessment"]] = row

    assessment_scores = defaultdict(list)
    weighted_sum = defaultdict(float)
    weight_sum = defaultdict(float)
    submitted_count = defaultdict(int)

    for row in read_csv(source / "studentAssessment.csv"):
        score = number(row["score"])
        meta = assessment_meta.get(row["id_assessment"])

        if score is None or meta is None:
            continue

        key = (
            row["id_student"],
            meta["code_module"],
            meta["code_presentation"],
        )

        assessment_scores[key].append(score)
        submitted_count[key] += 1

        weight = number(meta["weight"])
        if weight is not None and weight > 0:
            weighted_sum[key] += score * weight
            weight_sum[key] += weight

    print(f"Assessment groups: {len(assessment_scores):,}")

    # 3. Aggregate LMS activity in one streaming pass.
    clicks = defaultdict(int)
    active_days = defaultdict(set)
    activity_rows = 0

    for row in read_csv(source / "studentVle.csv"):
        key = (
            row["id_student"],
            row["code_module"],
            row["code_presentation"],
        )

        click_count = number(row["sum_click"]) or 0
        clicks[key] += int(click_count)

        day = number(row["date"])
        if day is not None and click_count > 0:
            active_days[key].add(int(day))

        activity_rows += 1
        if activity_rows % 1_000_000 == 0:
            print(f"LMS rows processed: {activity_rows:,}")

    print(f"Total LMS rows processed: {activity_rows:,}")

    # 4. Registration and course metadata.
    registrations = {}
    for row in read_csv(source / "studentRegistration.csv"):
        key = (
            row["id_student"],
            row["code_module"],
            row["code_presentation"],
        )
        registrations[key] = row

    courses = {}
    for row in read_csv(source / "courses.csv"):
        courses[(row["code_module"], row["code_presentation"])] = row

    # 5. Combine all information without using final_result
    # to calculate the Success Score or risk indicators.
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    fields = [
        "id_student", "code_module", "code_presentation",
        "gender", "region", "highest_education", "age_band",
        "num_of_prev_attempts", "studied_credits",
        "final_result", "assessment_mean", "assessment_weighted_mean",
        "assessments_submitted", "total_lms_clicks",
        "active_lms_days", "date_registration", "date_unregistration",
        "module_presentation_length", "engagement_percentile",
        "success_score", "academic_risk", "score_available",
    ]

    keys = sorted(students)
    click_values = [clicks.get(key, 0) for key in keys]
    sorted_clicks = sorted(click_values)

    def percentile(value):
        if not sorted_clicks:
            return 0.0
        less_equal = bisect_right(sorted_clicks, value)
        return round(100 * less_equal / len(sorted_clicks), 2)

    with OUTPUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()

        for key in keys:
            student = students[key]
            scores = assessment_scores.get(key, [])
            total_clicks = clicks.get(key, 0)

            available = bool(scores)
            avg_score = round(mean(scores), 2) if available else None

            wsum = weight_sum.get(key, 0.0)
            weighted_avg = (
                round(weighted_sum[key] / wsum, 2)
                if wsum > 0 else None
            )

            engagement = percentile(total_clicks)

            # Proposed demo formula, not a validated prediction model.
            if available:
                success_score = round(
                    0.60 * avg_score + 0.40 * engagement, 2
                )
                academic_risk = (
                    "At risk" if avg_score < 40 else "Lower risk"
                )
            else:
                success_score = None
                academic_risk = "Insufficient assessment data"

            reg = registrations.get(key, {})
            course = courses.get((key[1], key[2]), {})

            writer.writerow({
                "id_student": key[0],
                "code_module": key[1],
                "code_presentation": key[2],
                "gender": student.get("gender", ""),
                "region": student.get("region", ""),
                "highest_education": student.get("highest_education", ""),
                "age_band": student.get("age_band", ""),
                "num_of_prev_attempts": student.get("num_of_prev_attempts", ""),
                "studied_credits": student.get("studied_credits", ""),
                "final_result": student.get("final_result", ""),
                "assessment_mean": avg_score if avg_score is not None else "",
                "assessment_weighted_mean": (
                    weighted_avg if weighted_avg is not None else ""
                ),
                "assessments_submitted": submitted_count.get(key, 0),
                "total_lms_clicks": total_clicks,
                "active_lms_days": len(active_days.get(key, set())),
                "date_registration": reg.get("date_registration", ""),
                "date_unregistration": reg.get("date_unregistration", ""),
                "module_presentation_length": course.get(
                    "module_presentation_length", ""
                ),
                "engagement_percentile": engagement,
                "success_score": (
                    success_score if success_score is not None else ""
                ),
                "academic_risk": academic_risk,
                "score_available": "yes" if available else "no",
            })

    print(f"\nCreated: {OUTPUT}")
    print(f"Output records: {len(keys):,}")
    print("Success Score: 60% assessment mean + 40% cohort engagement percentile")
    print("Academic risk threshold: assessment mean below 40")
    print("These are proposed demo rules, not validated predictions.")
    print("Placement outcomes and physical attendance are not available in OULAD.")


if __name__ == "__main__":
    main()
