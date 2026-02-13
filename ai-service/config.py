"""
Configuration settings for the AI service
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/placement_archive"
    
    # Embedding model
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # FAISS
    FAISS_INDEX_PATH: str = "./data/faiss_index"
    FAISS_ID_MAP_PATH: str = "./data/id_map.json"
    
    # LLM settings (for answer generation)
    USE_LOCAL_LLM: bool = True
    LLM_MODEL: str = "microsoft/Phi-3-mini-4k-instruct"
    LLM_API_KEY: str = ""
    LLM_API_URL: str = ""
    
    # RAG settings
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    TOP_K_DEFAULT: int = 5
    SIMILARITY_THRESHOLD: float = 0.0
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure data directory exists
os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)
