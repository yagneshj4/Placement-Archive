# Deployment Guide - The Placement Archive

Complete deployment instructions for local development and production environments.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+
- Redis (optional, for caching)

---

## Local Development Setup

### 1. Clone and Setup

```bash
# Clone the repository
cd placement-archive

# Setup environment files
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
```

### 2. Database Setup

```bash
# Start PostgreSQL (if not running)
# Windows: Use pgAdmin or services.msc
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE placement_archive;"

# Run schema migrations
psql -U postgres -d placement_archive -f database/schema.sql
```

### 3. Backend Setup (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Update .env with your database credentials
# DATABASE_URL="postgresql://postgres:password@localhost:5432/placement_archive"

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

Backend will run on `http://localhost:3001`

### 4. AI Service Setup (Python/FastAPI)

```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

AI Service will run on `http://localhost:8000`

### 5. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 6. Seed Demo Data

```bash
cd demo-data

# Run seeder
node seed.js
```

---

## Production Deployment

### Option 1: Docker Compose (Recommended)

Create `docker-compose.yml` in root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: placement_archive
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/placement_archive
      JWT_SECRET: ${JWT_SECRET}
      AI_SERVICE_URL: http://ai-service:8000
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  ai-service:
    build: ./ai-service
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/placement_archive
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    volumes:
      - faiss_index:/app/faiss_index

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
      - ai-service

volumes:
  postgres_data:
  faiss_index:
```

**Backend Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

**AI Service Dockerfile** (`ai-service/Dockerfile`):

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Run with:

```bash
docker-compose up -d
```

### Option 2: Cloud Deployment (Railway/Render)

#### Railway Deployment

1. **Connect GitHub Repository**
2. **Add Services:**
   - PostgreSQL (Plugin)
   - Backend (Node.js)
   - AI Service (Python)
   - Frontend (Static)

3. **Set Environment Variables** in Railway dashboard

#### Render Deployment

1. **Create PostgreSQL Database**
2. **Deploy Backend as Web Service**
3. **Deploy AI Service as Web Service**
4. **Deploy Frontend as Static Site**

### Option 3: AWS/GCP Deployment

```
Architecture:
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront/CDN                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐ │
│    │   S3/Static  │    │  ECS/GKE     │    │  ECS/GKE    │ │
│    │   Frontend   │    │  Backend     │    │  AI Service │ │
│    └──────────────┘    └──────────────┘    └─────────────┘ │
│                              │                    │        │
│                              ▼                    ▼        │
│                        ┌─────────────────────────────┐     │
│                        │      RDS PostgreSQL         │     │
│                        └─────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Reference

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/placement_archive

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://your-domain.com/auth/google/callback

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### AI Service (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/placement_archive

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# FAISS
FAISS_INDEX_PATH=./faiss_index
TOP_K_RESULTS=5

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Health Checks

After deployment, verify all services:

```bash
# Backend
curl http://localhost:3001/api/health

# AI Service
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173
```

---

## Performance Optimization

### Backend
- Enable response compression
- Use connection pooling (Prisma default)
- Add Redis caching for frequent queries

### AI Service
- Pre-warm FAISS index on startup
- Use batch embedding for new experiences
- Optimize chunk sizes for better retrieval

### Frontend
- Enable gzip compression in nginx
- Use CDN for static assets
- Lazy load route components

---

## Monitoring & Logging

### Recommended Tools
- **Logging**: Winston (backend), Loguru (AI service)
- **Monitoring**: PM2 (backend), Prometheus + Grafana
- **Error Tracking**: Sentry
- **APM**: DataDog or New Relic

### PM2 Setup (Production)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start npm --name "backend" -- start

# Start AI service
pm2 start uvicorn --name "ai-service" -- main:app --host 0.0.0.0 --port 8000

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall/network settings

2. **AI Service Model Loading Slow**
   - First load downloads the model (~90MB)
   - Subsequent loads use cached model
   - Consider pre-downloading in Dockerfile

3. **CORS Errors**
   - Verify FRONTEND_URL in backend .env
   - Check AI service CORS settings

4. **FAISS Index Not Found**
   - Run `/api/ai/rebuild-index` endpoint
   - Check FAISS_INDEX_PATH permissions

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT_SECRET (32+ random chars)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable SQL injection protection (Prisma default)
- [ ] Set secure cookie options
- [ ] Implement input validation
- [ ] Add request logging

---

## Support

For issues during deployment:
1. Check logs: `docker-compose logs -f` or `pm2 logs`
2. Verify environment variables
3. Check service health endpoints
4. Review database connectivity
