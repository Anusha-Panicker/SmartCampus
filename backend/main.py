
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json

from services.analytics import (
    get_summary,
    get_students,
    get_student_profile,
)

app = FastAPI(
    title="CampusIQ API",
    description="Student academic analytics and decision-support API",
    version="1.0.0",
)

# Allow the React/Vite frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
        "http://localhost:5178",
        "http://127.0.0.1:5178",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent
MODEL_RESULTS_FILE = ROOT / "ml" / "model_results.json"


@app.get("/")
def root():
    return {
        "message": "CampusIQ API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "CampusIQ API",
    }


@app.get("/api/analytics/summary")
def analytics_summary():
    try:
        return get_summary()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


@app.get("/api/students")
def students(
    search: str = Query(default=""),
    risk: str = Query(default="all"),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
):
    try:
        return get_students(
            search=search,
            risk=risk,
            limit=limit,
            offset=offset,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


@app.get("/api/students/{student_id}/profile")
def student_profile(student_id: str):
    try:
        profile = get_student_profile(student_id)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found in the OULAD dataset.",
        )

    return profile


@app.get("/api/success-score")
def success_score(
    academic_score: float = Query(..., ge=0, le=100),
    engagement: float = Query(..., ge=0, le=100),
):
    score = academic_score * 0.60 + engagement * 0.40

    if score >= 75:
        category = "High"
    elif score >= 50:
        category = "Moderate"
    else:
        category = "Low"

    return {
        "success_score": round(score, 2),
        "category": category,
        "weights": {
            "academic": 0.60,
            "engagement": 0.40,
        },
        "is_demo": True,
        "note": (
            "Proposed demo score using academic performance and "
            "LMS engagement. This is not a validated prediction "
            "of future student success."
        ),
    }


@app.get("/api/ml/results")
def ml_results():
    if not MODEL_RESULTS_FILE.exists():
        return {
            "available": False,
            "message": (
                "Model evaluation results have not been generated yet."
            ),
            "is_demo": True,
        }

    try:
        with MODEL_RESULTS_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            results = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not read the saved model results.",
        ) from exc

    return {
        "available": True,
        "results": results,
        "is_demo": True,
    }
