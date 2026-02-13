# 🎯 THE PLACEMENT ARCHIVE - Demo Script for Judges

## Quick Pitch (30 seconds)
> "The Placement Archive converts real student interview experiences into a searchable, intelligent preparation system. Seniors share their experiences, our RAG pipeline learns from them, and juniors get AI-powered answers grounded in actual experiences - no hallucinations, just real insights."

---

## 🚀 Demo Flow (5 minutes)

### Setup Before Demo
1. Ensure all services are running
2. Seed demo data: `node demo-data/seed.js`
3. Open browser to `http://localhost:5173`
4. Have 2 browser tabs ready (Senior & Junior views)

---

### Part 1: Landing Page (30 sec)

**What to show:**
- Animated landing page with glass morphism design
- Key stats (if seeded): "1000+ experiences, 8000+ questions"
- Dual portal explanation

**What to say:**
> "Our platform has two portals - seniors contribute their experiences, juniors leverage them through AI. This creates a knowledge flywheel specific to your institution."

---

### Part 2: Senior Portal - Data Ingestion (1.5 min)

**Login:**
- Email: `senior1@demo.com`  
- Password: `Demo@123`

**Navigate to:** Submit Experience

**What to show:**
1. Multi-step form with validation
2. Add company: "Google", Role: "SDE L3"
3. Add interview rounds:
   - Round 1: Online Assessment
   - Round 2: Technical (add 2-3 questions)
4. Add tips and resources
5. Show review page

**What to say:**
> "Seniors submit structured experiences - company, role, rounds, actual questions asked, and preparation tips. This structured format is key for our RAG pipeline."

**Don't submit** - Just show the flow, then navigate to existing experiences.

---

### Part 3: Junior Portal - AI Query (2 min) ⭐ MAIN DEMO

**Switch to Junior account:**
- Email: `junior1@demo.com`
- Password: `Demo@123`

**Navigate to:** Ask AI (/ask)

**Demo Query 1:** Basic company query
```
What kind of questions does Google ask for SDE interviews?
```

**What to show:**
- AI processing animation
- Grounded answer with citations
- Source experiences listed below
- Confidence score

**What to say:**
> "Watch how the RAG pipeline retrieves relevant experiences and generates an answer. Notice the source citations - every claim is backed by actual experiences, eliminating hallucinations."

**Demo Query 2:** Specific preparation query
```
How should I prepare for Amazon's behavioral rounds?
```

**What to show:**
- Different response with LP focus
- Multiple source experiences
- Follow-up suggestions

**What to say:**
> "The system understands context and retrieves relevant information. For Amazon, it pulls Leadership Principles discussions from actual experiences."

**Demo Query 3:** Comparative query
```
What's the difference between Microsoft and Google interviews?
```

**What to say:**
> "It can even compare companies based on aggregated experiences from seniors who've interviewed at multiple places."

---

### Part 4: Analytics Dashboard (30 sec)

**Navigate to:** Analytics

**What to show:**
- Company-wise distribution charts
- Difficulty heatmap
- Question type breakdown
- Selection rate trends

**What to say:**
> "Aggregated analytics help students identify patterns - which companies are harder, what topics are trending, success rates by difficulty level."

---

### Part 5: Technical Architecture (30 sec)

**Show README or diagram:**

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React +   │────▶│  Node.js    │────▶│   FastAPI    │
│   Tailwind  │     │  + Prisma   │     │   RAG + FAISS│
└─────────────┘     └─────────────┘     └──────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────────────────────┐
                    │        PostgreSQL           │
                    └─────────────────────────────┘
```

**What to say:**
> "Three-tier architecture: React frontend, Node.js API layer, and Python AI microservice. The RAG pipeline uses sentence transformers for embeddings and FAISS for similarity search."

---

## 🔑 Key Technical Points to Highlight

### RAG Pipeline (Most Impressive)
- **Embedding Model**: sentence-transformers/all-MiniLM-L6-v2
- **Vector Store**: FAISS with L2 similarity
- **Chunking**: Overlapping chunks for context preservation
- **Grounding**: Answers cite specific experiences - no hallucinations

### Why This Wins
1. **Real Problem**: Students struggle with placement prep
2. **Unique Solution**: Institution-specific knowledge base
3. **AI Innovation**: RAG prevents generic AI answers
4. **Scalable**: Works for any college/institution
5. **Full Stack**: Production-ready implementation

---

## 💬 Anticipated Questions & Answers

**Q: How is this different from GPT/ChatGPT?**
> "ChatGPT gives generic answers. Our system is grounded in actual experiences from your institution. Every answer cites real experiences - no hallucinations."

**Q: How does the RAG pipeline work?**
> "When a query comes in, we embed it using the same model as our experiences. FAISS finds the top-k similar chunks, we pass those as context to generate a grounded response with citations."

**Q: What about data quality/moderation?**
> "We have a moderation system - experiences go through review before being indexed. Admins can flag and remove inappropriate content."

**Q: How would you handle scale?**
> "FAISS supports approximate nearest neighbor for millions of vectors. We can shard by institution. The stateless architecture allows horizontal scaling."

**Q: What's next for this project?**
> "Fine-tuning on domain data, adding resume review, mock interview simulator, and integration with placement cells."

---

## 🎨 Design Highlights to Mention

- **Glass Morphism UI** - Modern, professional look
- **Dark Mode** - Easy on eyes for long study sessions
- **Responsive Design** - Works on mobile for on-the-go prep
- **Framer Motion** - Smooth animations throughout
- **Accessibility** - Keyboard navigation, ARIA labels

---

## 🛠 If Demo Breaks

**Backend down:**
```bash
cd backend && npm run dev
```

**AI Service down:**
```bash
cd ai-service && uvicorn main:app --reload --port 8000
```

**Database connection issues:**
```bash
# Reset and reseed
psql -U postgres -c "DROP DATABASE placement_archive;"
psql -U postgres -c "CREATE DATABASE placement_archive;"
node demo-data/seed.js
```

**FAISS index missing:**
Hit the `/api/ai/rebuild-index` endpoint

---

## 📊 Demo Credentials Quick Reference

| Role   | Email              | Password  |
|--------|-------------------|-----------|
| Senior | senior1@demo.com  | Demo@123  |
| Senior | senior2@demo.com  | Demo@123  |
| Junior | junior1@demo.com  | Demo@123  |
| Admin  | admin@demo.com    | Admin@123 |

---

## ⏱ Time Breakdown

| Section | Duration |
|---------|----------|
| Landing + Pitch | 0:30 |
| Senior Portal | 1:30 |
| Junior AI Query | 2:00 |
| Analytics | 0:30 |
| Architecture | 0:30 |
| **Total** | **5:00** |

---

## Final Words

> "The Placement Archive isn't just another study app - it's a knowledge preservation system that makes institutional wisdom searchable and actionable through AI. Every graduating batch's experiences become a permanent resource for future batches."

**Good luck! 🚀**
