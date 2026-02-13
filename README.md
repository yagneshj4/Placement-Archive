# 🎯 THE PLACEMENT ARCHIVE

> "Your interview pain becomes someone else's placement gain."

A dual-portal AI-powered web application that converts real student interview experiences into a searchable, intelligent preparation system using RAG (Retrieval-Augmented Generation).

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Node.js API    │────▶│  PostgreSQL     │
│  (Vite+Tailwind)│     │  (Express)      │     │  (Metadata)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  FastAPI AI     │────▶│  FAISS          │
                        │  Microservice   │     │  (Vector DB)    │
                        └─────────────────┘     └─────────────────┘
```

## 🚀 Features

### Senior Portal (Data Ingestion)
- ✅ College email / Google OAuth authentication
- ✅ Structured interview experience submission
- ✅ PDF upload support
- ✅ Spam detection + moderation queue
- ✅ Auto-embedding generation

### Junior Portal (AI Intelligence)
- ✅ Natural language Q&A
- ✅ Semantic search over campus experiences
- ✅ RAG-powered answers (no hallucinations)
- ✅ Source attribution
- ✅ Trend analysis

### Analytics Dashboard
- ✅ Company-wise trends
- ✅ Most asked topics
- ✅ Difficulty heatmap
- ✅ Year-over-year analysis

## 📁 Project Structure

```
placement-archive/
├── frontend/                 # React + Vite + Tailwind
├── backend/                  # Node.js + Express API
├── ai-service/              # FastAPI RAG Pipeline
├── database/                # PostgreSQL schema & migrations
├── demo-data/               # Sample dataset
├── docs/                    # Documentation
└── docker/                  # Docker configurations
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express, Prisma ORM |
| AI Service | FastAPI, LangChain, Sentence Transformers |
| Database | PostgreSQL |
| Vector DB | FAISS |
| Auth | JWT + Google OAuth |

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Docker (optional)

### Installation

```bash
# Clone and setup
cd placement-archive

# Backend setup
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev

# AI Service setup
cd ../ai-service
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Frontend setup
cd ../frontend
npm install
npm run dev
```

## 📊 API Endpoints

### Backend (Port 3001)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/experiences` - Submit experience
- `GET /api/experiences` - List experiences
- `GET /api/analytics/*` - Analytics endpoints

### AI Service (Port 8000)
- `POST /api/embed` - Generate embeddings
- `POST /api/query` - RAG query
- `GET /api/trends` - AI-generated trends

## 🎬 Demo

See [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the judges presentation walkthrough.

## 📝 License

MIT License - Built for hackathon demonstration purposes.
"# Placement-Archive" 
