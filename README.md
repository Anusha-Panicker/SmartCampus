# CampusIQ

CampusIQ is a prototype student analytics dashboard built around historical, anonymized records from the Open University Learning Analytics Dataset (OULAD). It presents student-course outcomes, assessment and online learning engagement indicators, and a separate retrospective machine-learning evaluation.

> **Prototype and data notice:** This project is for demonstration and research. Its scores, risk labels, and model outputs are not validated measures for student support or consequential decisions. OULAD is historical research data, not data from a live campus.

## Features

- Dashboard summaries of student-course records, outcomes, and score availability.
- Student Explorer with search, risk filters, pagination, and student profile details.
- Academic Insights and Learning Engagement views.
- Methodology view documenting indicator definitions and model evaluation.
- FastAPI endpoints for analytics, student records and profiles, a proposed score, and saved model results.
- A data integration script to aggregate OULAD source tables into the dashboard's CSV.
- A Random Forest training script that evaluates final-result classification and saves its evaluation results.

## Technology

- **Frontend:** React 19, Vite 6, Recharts, Lucide React, CSS.
- **Backend:** Python, FastAPI, Uvicorn.
- **Data/modeling:** CSV processing, pandas, scikit-learn, and joblib.

## Requirements

- Node.js and npm (the frontend dependencies are locked in `frontend/package-lock.json`).
- Python 3.10 or newer recommended.
- The OULAD CSV tables described below.

The repository does not currently include a Python dependency manifest. Install the backend packages into your chosen Python environment:

```powershell
python -m pip install fastapi uvicorn pandas scikit-learn joblib
```

## Data setup

CampusIQ uses the [Open University Learning Analytics Dataset (OULAD)](https://figshare.com/articles/dataset/OULAD_Open_University_Learning_Analytics_Dataset/5081998), released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The citation and download metadata are also present in `data/oulad/figshare_metadata.json`.

The integration script needs these seven OULAD CSV tables in `data/oulad/` or together in a subdirectory such as `data/oulad/extracted/`:

- `studentInfo.csv`
- `studentAssessment.csv`
- `assessments.csv`
- `studentVle.csv`
- `vle.csv`
- `studentRegistration.csv`
- `courses.csv`

Download the dataset from Figshare and extract the tables together under `data/oulad/`. Then, from the repository root, build the processed file:

```powershell
python backend\services\integrate_data.py
```

This creates `data/processed/student_course_analytics.csv`. The script aggregates one row per student-course-presentation, assessment measures, LMS clicks and active days, registration details, and course metadata. It computes a **proposed demo score** from 60% assessment mean and 40% cohort engagement percentile. Its academic-risk label uses an assessment-mean threshold of 40; records without assessment scores are marked as having insufficient assessment data.

Raw OULAD CSVs, archives, extracted tables, and the generated processed CSV are excluded by `.gitignore`; keep local copies for running the application and do not commit them.

### Dataset citation

Kuzilek, Jakub; Hlosta, Martin; Zdrahal, Zdenek (2017). *OULAD: Open University Learning Analytics Dataset*. figshare. Dataset. <https://doi.org/10.6084/m9.figshare.5081998.v1>

## Run locally

Run these commands from the repository root in separate terminals.

### 1. Start the API

After installing the Python packages and preparing the processed CSV:

```powershell
python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Interactive API documentation is available at <http://127.0.0.1:8000/docs>.

### 2. Start the frontend

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (normally <http://localhost:5173>). The frontend API client currently uses `http://127.0.0.1:8000`; the backend CORS configuration allows the local Vite ports 5173–5178.

### 3. Build or lint the frontend

From `frontend/`:

```powershell
npm run build
npm run lint
```

## API

The API base URL is `http://127.0.0.1:8000`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | API status and docs path. |
| `GET` | `/api/health` | Health check. |
| `GET` | `/api/analytics/summary` | Dataset and outcome summary. |
| `GET` | `/api/students?search=&risk=all&limit=100&offset=0` | Search/filter and page through student-course records. `limit` is 1–1000 at the API boundary. |
| `GET` | `/api/students/{student_id}/profile` | Records and aggregate measures for one student. |
| `GET` | `/api/success-score?academic_score=...&engagement=...` | Calculate the proposed 60/40 demo score; both values must be between 0 and 100. |
| `GET` | `/api/ml/results` | Return saved model evaluation results when available. |

## Optional model evaluation

After generating the processed CSV, run the training script from the repository root:

```powershell
python backend\ml\train_model.py
```

It trains a `RandomForestClassifier` to classify `final_result` as Distinction, Fail, Pass, or Withdrawn. The split is 80/20 by student ID (random state 42), and the script saves metrics to `backend/ml/model_results.json` and the trained pipeline to `backend/ml/student_outcome_model.joblib`. The model file is intentionally ignored because it is a large generated artifact; rerun training to create it locally.

The saved evaluation currently reports 57.73% accuracy and 0.516 macro F1 on 6,520 test records. These are retrospective classification results, not evidence of early-warning performance. The model uses full-period LMS activity and does not use assessment scores as input features.

## Project layout

```text
CampusIQ/
├── backend/
│   ├── main.py                         # FastAPI routes
│   ├── services/
│   │   ├── analytics.py                # Reads processed records for the API
│   │   └── integrate_data.py           # Builds the processed CSV from OULAD
│   └── ml/
│       ├── train_model.py              # Trains and evaluates the classifier
│       └── model_results.json           # Saved evaluation metrics
├── data/
│   ├── oulad/                           # Local OULAD source files
│   └── processed/                       # Generated analytics CSV
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx                      # Dashboard and analytics views
        ├── api.js                       # API client
        ├── App.css
        └── Student360.css
```

## Interpretation and limitations

- The dataset contains historical records from selected Open University course presentations; it is not live campus data.
- The proposed score is a demo calculation, not a validated prediction of future student success.
- Risk labels are project-defined indicators and should not be treated as validated predictions.
- The model's retrospective metrics do not establish its suitability for timely intervention or generalization to other institutions.
- OULAD does not provide every operational campus measure, such as physical attendance, placement outcomes, or student feedback.
- Do not use the dashboard or model for consequential student decisions without appropriate validation, privacy safeguards, and institutional review.
