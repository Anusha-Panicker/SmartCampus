
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function apiRequest(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export function getApiHealth() {
  return apiRequest("/api/health");
}

export function getAnalyticsSummary() {
  return apiRequest("/api/analytics/summary");
}

export function getStudents({
  search = "",
  risk = "all",
  limit = 100,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({
    search,
    risk,
    limit: String(limit),
    offset: String(offset),
  });

  return apiRequest(`/api/students?${params.toString()}`);
}

// NEW: Fetch a student's complete Student 360 profile.
export function getStudentProfile(studentId) {
  if (studentId === undefined || studentId === null || studentId === "") {
    throw new Error("A valid student ID is required.");
  }

  return apiRequest(
    `/api/students/${encodeURIComponent(studentId)}/profile`
  );
}


export async function calculateSuccessScore(inputs) {
  const params = new URLSearchParams({
    academic_score: String(inputs.academic_score),
    attendance: String(inputs.attendance),
    engagement: String(inputs.engagement),
  });

  const response = await fetch(
    `${API_BASE}/api/success-score?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to calculate Student Success Score");
  }

  return response.json();
}


export function getMlResults() {
  return apiRequest("/api/ml/results");
}
