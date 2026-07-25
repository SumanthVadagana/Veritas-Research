# 🔍 Veritas Research

> **Autonomous Multi-Agent Research & Fact-Verification System**  
> Built for **InnovaHack GenAI Domain · PS1**

Veritas Research orchestrates a team of specialized AI agents powered by **Google Gemini AI** and **Tavily Search** that **plan, search, critique, fact-check, and synthesize** — delivering verified, cited answers with live streaming updates.

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│  Next.js 15 Frontend (App Router)   │
│  • Live SSE agent timeline          │
│  • Synthesis + Citation viewer      │
│  • Fact-check confidence scoring    │
└─────────────┬───────────────────────┘
              │ HTTP / SSE
              ▼
┌─────────────────────────────────────┐
│  FastAPI Backend (Python 3.11)      │
│  ┌─────────────────────────────┐   │
│  │  Orchestrator               │   │
│  │  ┌──────────────────────┐  │   │
│  │  │ 1. ResearcherAgent   │──┼───┼→ Tavily Search (gemini-1.5-flash)
│  │  │ 2. VerifierAgent     │  │   │  ← Google Gemini 1.5 Flash
│  │  │ 3. CriticAgent       │  │   │  ← Google Gemini 1.5 Flash
│  │  │ 4. SynthesizerAgent  │  │   │  ← Google Gemini 1.5 Pro
│  │  └──────────────────────┘  │   │
│  └─────────────────────────────┘   │
└─────────────┬───────────────────────┘
              │ SQLAlchemy async
              ▼
┌─────────────────────────────────────┐
│  SQLite (dev) / PostgreSQL (prod)   │
│  / Supabase                         │
└─────────────────────────────────────┘
```

---

## 🤖 Agent Pipeline

| # | Agent | Model | Role |
|---|-------|-------|------|
| 1 | **Researcher** | Google Gemini 1.5 Flash | Decomposes query into sub-searches, runs Tavily web search, extracts claims & scores source credibility |
| 2 | **Verifier** | Google Gemini 1.5 Flash | Cross-references claims across sources, assigns verified/disputed/unverified verdicts |
| 3 | **Critic** | Google Gemini 1.5 Flash | Audits methodology, detects contradictions, hallucinations, weak evidence & bias |
| 4 | **Synthesizer** | Google Gemini 1.5 Pro | Authors final citation-backed report with executive summary & claim confidence scores |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and **npm** 10+
- **Python** 3.11+
- API keys: [Google AI Studio (Gemini)](https://aistudio.google.com) + [Tavily AI](https://tavily.com)

### 1. Clone & configure

```bash
git clone <repo-url>
cd Veritas-Research

# Copy env template and fill in your API keys
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=AIzaSy...
TAVILY_API_KEY=tvly-...
GEMINI_FLASH_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Linux / macOS
# venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Copy env
cp .env.example .env

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### 4. Run both together (from root)

```bash
npm install          # installs concurrently
npm run dev          # starts both frontend + backend
```

---

## 📁 Project Structure

```
Veritas-Research/
├── frontend/                 # Next.js 15 App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Landing page
│   │   ├── research/
│   │   │   ├── page.tsx      # Live research dashboard
│   │   │   └── [id]/page.tsx # Session detail
│   │   └── history/page.tsx  # Past sessions
│   ├── components/
│   │   ├── AgentTimeline.tsx
│   │   ├── QueryInput.tsx
│   │   ├── SourceCard.tsx
│   │   ├── FactCheckBadge.tsx
│   │   ├── SynthesisPanel.tsx
│   │   └── MarkdownRenderer.tsx
│   ├── hooks/
│   │   └── useResearchStream.ts
│   └── lib/
│       └── api.ts
│
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── orchestrator.py   # Multi-agent pipeline
│   │   ├── agents/
│   │   │   ├── base.py       # Google Gemini SDK wrapper
│   │   │   ├── researcher.py
│   │   │   ├── verifier.py
│   │   │   ├── critic.py
│   │   │   └── synthesizer.py
│   │   ├── routers/
│   │   │   ├── research.py   # POST /api/research (SSE)
│   │   │   ├── stream.py     # SSE GET endpoint
│   │   │   ├── history.py
│   │   │   └── feedback.py
│   │   └── utils/
│   │       ├── tavily_client.py
│   │       ├── credibility.py
│   │       └── sse_helpers.py
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── requirements.txt
│
├── .env.example
├── package.json
└── README.md
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/research` | Create session & return SSE stream |
| `GET` | `/api/stream/{id}` | SSE stream (live agent events) |
| `GET` | `/api/history` | List past sessions |
| `GET` | `/api/sessions/{id}` | Full session detail |
| `POST` | `/api/feedback` | Submit session feedback |
| `GET` | `/health` | Health check |

### SSE Event Types

```jsonc
// Progress status
{ "type": "status", "phase": "researcher", "message": "...", "progress": 0.35 }

// Researcher findings
{ "type": "researcher", "sub_queries": [...], "sources": [...], "claims": [...] }

// Verifier claims
{ "type": "verifier", "verified_claims": [{ "claim": "...", "verdict": "verified", "confidence_score": 0.92 }] }

// Critic assessment
{ "type": "critic", "critique": { "quality_score": 8, "contradictions_detected": [...] } }

// Final Synthesizer report
{ "type": "final_report", "synthesis": "## Answer...", "overall_confidence": 0.88 }

// Pipeline complete
{ "type": "complete", "session_id": "uuid" }
```

---

## 🛢️ Database

### SQLite (development — default)
Works out of the box. Database file created at `backend/veritas.db`.

### PostgreSQL (production)
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/veritas
```

### Supabase
```env
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host].supabase.co:5432/postgres
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (AI Studio) |
| `TAVILY_API_KEY` | ✅ | Tavily Search API key |
| `DATABASE_URL` | ✅ | Database connection string |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend URL for frontend |
| `FRONTEND_URL` | — | CORS origin (default: localhost:3000) |
| `GEMINI_FLASH_MODEL` | — | Fast model (default: gemini-1.5-flash) |
| `GEMINI_PRO_MODEL` | — | Pro synthesis model (default: gemini-1.5-pro) |
| `USE_LOCAL_NLP` | — | Enable spaCy/sentence-transformers |
| `DEBUG` | — | Enable SQL query logging |

---

## 🧪 Demo Mode (No API Keys)

If `GEMINI_API_KEY` or `TAVILY_API_KEY` are not set, the system falls back to **mock responses** so you can verify the UI and pipeline without burning API credits.

---

## 📄 License

MIT — Built for InnovaHack GenAI Domain PS1
