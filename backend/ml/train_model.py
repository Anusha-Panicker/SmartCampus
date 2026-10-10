import json
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report,
    confusion_matrix
)

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "processed" / "student_course_analytics.csv"
OUT = ROOT / "backend" / "ml" / "model_results.json"
MODEL = ROOT / "backend" / "ml" / "student_outcome_model.joblib"

df = pd.read_csv(DATA)
target = "final_result"

numeric = [
    "num_of_prev_attempts", "studied_credits",
    "total_lms_clicks", "active_lms_days",
    "module_presentation_length"
]
categorical = [
    "gender", "region", "highest_education",
    "age_band", "code_module", "code_presentation"
]
features = numeric + categorical

required = features + [target, "id_student"]
missing = [c for c in required if c not in df.columns]
if missing:
    raise ValueError(f"Missing required columns: {missing}")

df = df[required].copy()
df = df.dropna(subset=[target])
df[target] = df[target].astype(str).str.strip()
df = df[df[target].isin(["Pass", "Distinction", "Fail", "Withdrawn"])]

# Keep each student entirely in either train or test to reduce identity leakage.
student_ids = df["id_student"].astype(str)
unique_students = student_ids.unique()

if len(unique_students) < 5:
    raise ValueError("Not enough unique students for a train/test split.")

# Split by student ID, not by individual course record.
train_ids, test_ids = train_test_split(
    unique_students, test_size=0.20, random_state=42
)
train = df[student_ids.isin(train_ids)]
test = df[student_ids.isin(test_ids)]

X_train = train[features]
y_train = train[target]
X_test = test[features]
y_test = test[target]

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])
categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])
preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric),
    ("categorical", categorical_pipeline, categorical)
])

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ))
])

model.fit(X_train, y_train)
predictions = model.predict(X_test)

report = classification_report(
    y_test, predictions, output_dict=True, zero_division=0
)
results = {
    "model": "RandomForestClassifier",
    "dataset": "OULAD",
    "target": target,
    "features": features,
    "split": "80/20 by student ID",
    "train_records": int(len(train)),
    "test_records": int(len(test)),
    "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
    "macro_f1": round(float(f1_score(
        y_test, predictions, average="macro", zero_division=0
    )), 4),
    "classification_report": report,
    "confusion_matrix": confusion_matrix(
        y_test, predictions, labels=model.classes_
    ).tolist(),
    "class_labels": model.classes_.tolist(),
    "limitations": [
        "Retrospective classification, not a validated early-warning system.",
        "Full-period LMS activity may not be available early in a course.",
        "No assessment scores used as model inputs."
    ]
}

import joblib
joblib.dump(model, MODEL)
OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps({
    "status": "success",
    "train_records": results["train_records"],
    "test_records": results["test_records"],
    "accuracy": results["accuracy"],
    "macro_f1": results["macro_f1"],
    "class_labels": results["class_labels"],
    "results_file": str(OUT),
    "model_file": str(MODEL)
}, indent=2))
print("\nPer-class evaluation:")
print(classification_report(y_test, predictions, zero_division=0))
print("Confusion matrix (rows=true, columns=predicted):")
print(confusion_matrix(y_test, predictions, labels=model.classes_))
