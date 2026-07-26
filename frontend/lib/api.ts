const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://veritas-backend-5e3o.onrender.com";


// ─── Types (mirror backend Pydantic schemas) ──────────────────────────────────

export interface UserSummary {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface AgentOutputRecord {
  id: string;
  session_id: string;
  agent_name: string;
  event_type: string;
  message: string;
  payload?: Record<string, unknown>;
  duration_ms?: number;
  tokens_used?: number;
  model_used?: string;
  created_at: string;
}

export interface SourceRecord {
  id: string;
  url: string;
  title?: string;
  domain?: string;
  snippet?: string;
  relevance_score?: number;
  source_index?: number;
  is_primary: boolean;
  retrieved_at: string;
}

export interface ClaimRecord {
  id: string;
  claim_text: string;
  verdict: "verified" | "disputed" | "unverified";
  confidence: "high" | "medium" | "low";
  confidence_score?: number;
  explanation?: string;
  supporting_sources: number;
  contrasting_sources: number;
  created_at: string;
}

export interface FinalReportRecord {
  id: string;
  session_id: string;
  synthesis: string;
  executive_summary?: string;
  confidence_score?: number;
  word_count?: number;
  model_used?: string;
  tokens_used?: number;
  generation_time_ms?: number;
  created_at: string;
}

export interface SessionSummary {
  id: string;
  query: string;
  status: string;
  depth: number;
  confidence_score?: number;
  created_at: string;
  completed_at?: string;
}

export interface SessionDetail {
  id: string;
  query: string;
  status: string;
  depth: number;
  confidence_score?: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  user?: UserSummary;
  agent_outputs: AgentOutputRecord[];
  sources: SourceRecord[];
  claims: ClaimRecord[];
  final_report?: FinalReportRecord;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getHistory(
  limit = 20,
  offset = 0
): Promise<SessionSummary[]> {
  const res = await fetch(
    `${API_URL}/api/history?limit=${limit}&offset=${offset}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
  return res.json();
}

export async function getSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${API_URL}/api/sessions/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Session not found: ${res.status}`);
  return res.json();
}

export async function submitFeedback(body: {
  session_id?: string;
  report_id?: string;
  rating?: number;
  accuracy_rating?: number;
  completeness_rating?: number;
  comment?: string;
  is_helpful?: boolean;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Feedback submission failed: ${res.status}`);
  return res.json();
}

export interface ImageAnalysisResult {
  session_id: string | null;
  extracted_text: string;
  has_text: boolean;
  image_description: string;
  realness_score: number;
  realness_label: string;
  manipulation_signals: string[];
  ai_generation_indicators: string[];
  metadata_notes: string;
  content_warnings: string[];
  fact_checkable: boolean;
}

export async function analyzeImage(file: File): Promise<ImageAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/analyze-image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface PdfAnalysisResult {
  session_id: string | null;
  filename: string;
  page_count: number;
  char_count: number;
  word_count: number;
  document_title: string;
  document_type: string;
  main_topic: string;
  summary: string;
  research_query: string;
  key_claims: Array<{
    claim: string;
    importance: "high" | "medium" | "low";
    page_hint: number;
  }>;
  red_flags: string[];
  language: string;
  extracted_text_preview: string;
  fact_checkable: boolean;
}

export async function analyzePdf(file: File): Promise<PdfAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/analyze-pdf`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "PDF analysis failed" }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function loginApi(email: string, password: string): Promise<{ id: string; email: string; name: string; role: string }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(errData.detail || "Authentication failed");
  }
  return res.json();
}

export async function signupApi(email: string, password: string, name: string): Promise<{ id: string; email: string; name: string; role: string }> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Signup failed" }));
    throw new Error(errData.detail || "Registration failed");
  }
  return res.json();
}


