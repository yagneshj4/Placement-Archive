"""
The Placement Archive - AI Microservice
FastAPI + RAG Pipeline with FAISS
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from contextlib import asynccontextmanager

from rag_pipeline import RAGPipeline
from database import get_experience_by_id, get_all_approved_experiences
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize RAG pipeline
rag_pipeline: Optional[RAGPipeline] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global rag_pipeline
    logger.info("Initializing RAG pipeline...")
    rag_pipeline = RAGPipeline()
    await rag_pipeline.initialize()
    logger.info("RAG pipeline initialized successfully")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="Placement Archive AI Service",
    description="RAG-powered AI service for interview experience retrieval",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Request/Response Models
# =====================================================

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    company: Optional[str] = None
    year: Optional[int] = Field(None, ge=2015, le=2030)
    top_k: int = Field(5, ge=1, le=20)

class Source(BaseModel):
    experience_id: str
    relevance_score: float
    snippet: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    confidence: float
    trends: Optional[Dict[str, Any]] = None

class EmbedRequest(BaseModel):
    experience_id: str

class EmbedResponse(BaseModel):
    success: bool
    message: str
    embedding_id: Optional[str] = None

class SimilarRequest(BaseModel):
    experience_id: str
    top_k: int = Field(5, ge=1, le=20)

class SimilarResponse(BaseModel):
    similar_ids: List[str]
    scores: List[float]

class TrendsResponse(BaseModel):
    trends: List[Dict[str, Any]]
    insights: List[str]

# =====================================================
# API Endpoints
# =====================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "rag_initialized": rag_pipeline is not None,
        "index_size": rag_pipeline.get_index_size() if rag_pipeline else 0
    }

@app.post("/api/query", response_model=QueryResponse)
async def query_experiences(request: QueryRequest):
    """
    Query the RAG system with a natural language question.
    Returns a grounded answer based only on stored experiences.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        logger.info(f"Processing query: {request.query[:50]}...")
        
        # Perform RAG query
        result = await rag_pipeline.query(
            query=request.query,
            company=request.company,
            year=request.year,
            top_k=request.top_k
        )
        
        return QueryResponse(
            answer=result["answer"],
            sources=[
                Source(
                    experience_id=src["id"],
                    relevance_score=src["score"],
                    snippet=src["snippet"]
                )
                for src in result["sources"]
            ],
            confidence=result["confidence"],
            trends=result.get("trends")
        )
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/embed", response_model=EmbedResponse)
async def embed_experience(request: EmbedRequest, background_tasks: BackgroundTasks):
    """
    Generate embeddings for a new experience and add to the index.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        # Get experience data
        experience = await get_experience_by_id(request.experience_id)
        if not experience:
            raise HTTPException(status_code=404, detail="Experience not found")
        
        # Add to index in background
        background_tasks.add_task(
            rag_pipeline.add_experience,
            experience
        )
        
        return EmbedResponse(
            success=True,
            message="Embedding generation started",
            embedding_id=request.experience_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embed error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/embed/{experience_id}")
async def remove_embedding(experience_id: str):
    """
    Remove an experience from the vector index.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        await rag_pipeline.remove_experience(experience_id)
        return {"success": True, "message": "Embedding removed"}
    except Exception as e:
        logger.error(f"Remove embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/similar", response_model=SimilarResponse)
async def find_similar(experience_id: str, top_k: int = 5):
    """
    Find similar experiences to a given experience.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        similar = await rag_pipeline.find_similar(experience_id, top_k)
        return SimilarResponse(
            similar_ids=similar["ids"],
            scores=similar["scores"]
        )
    except Exception as e:
        logger.error(f"Similar search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trends", response_model=TrendsResponse)
async def get_trends(company: Optional[str] = None, year: Optional[int] = None):
    """
    Get AI-generated trend analysis from the experience data.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        trends = await rag_pipeline.analyze_trends(company=company, year=year)
        return TrendsResponse(
            trends=trends["data"],
            insights=trends["insights"]
        )
    except Exception as e:
        logger.error(f"Trends error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reindex")
async def reindex_all_endpoint():
    """
    Reindex all experiences (admin operation).
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        await rag_pipeline.reindex_all()
        return {"success": True, "message": "Reindexing complete", "index_size": rag_pipeline.get_index_size()}
    except Exception as e:
        logger.error(f"Reindex error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """
    Get RAG pipeline statistics.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    return {
        "index_size": rag_pipeline.get_index_size(),
        "embedding_dimension": rag_pipeline.embedding_dimension,
        "model_name": settings.EMBEDDING_MODEL
    }

# =====================================================
# Run Server
# =====================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
