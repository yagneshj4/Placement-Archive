"""
RAG Pipeline for The Placement Archive
Implements: Preprocessing → Chunking → Embedding → FAISS → Retrieval → LLM Generation
"""

import json
import logging
import re
from typing import Dict, List, Optional, Any
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import asyncio
from concurrent.futures import ThreadPoolExecutor

from config import settings
from database import get_all_approved_experiences, get_experience_by_id

logger = logging.getLogger(__name__)

class RAGPipeline:
    """
    Production-grade RAG pipeline with:
    - Sentence Transformer embeddings
    - FAISS vector storage
    - Retrieval-augmented generation
    """
    
    def __init__(self):
        self.embedding_model: Optional[SentenceTransformer] = None
        self.index: Optional[faiss.Index] = None
        self.id_map: Dict[int, str] = {}  # FAISS ID -> Experience ID
        self.metadata: Dict[str, Dict] = {}  # Experience ID -> metadata
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        self.executor = ThreadPoolExecutor(max_workers=4)
        
    async def initialize(self):
        """Initialize the RAG pipeline"""
        # Load embedding model
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        
        # Load or create FAISS index
        try:
            self._load_index()
            logger.info(f"Loaded existing index with {self.index.ntotal} vectors")
        except Exception as e:
            logger.info(f"Creating new FAISS index: {e}")
            self._create_index()
            
            # Index all existing experiences
            await self.reindex_all()
    
    def _create_index(self):
        """Create a new FAISS index"""
        # Using IndexFlatIP for inner product (cosine similarity after normalization)
        self.index = faiss.IndexFlatIP(self.embedding_dimension)
        self.id_map = {}
        self.metadata = {}
        logger.info("Created new FAISS index")
    
    def _load_index(self):
        """Load existing FAISS index from disk"""
        self.index = faiss.read_index(settings.FAISS_INDEX_PATH)
        
        with open(settings.FAISS_ID_MAP_PATH, 'r') as f:
            data = json.load(f)
            self.id_map = {int(k): v for k, v in data['id_map'].items()}
            self.metadata = data.get('metadata', {})
    
    def _save_index(self):
        """Save FAISS index to disk"""
        faiss.write_index(self.index, settings.FAISS_INDEX_PATH)
        
        with open(settings.FAISS_ID_MAP_PATH, 'w') as f:
            json.dump({
                'id_map': self.id_map,
                'metadata': self.metadata
            }, f)
        logger.info("Index saved to disk")
    
    def get_index_size(self) -> int:
        """Get number of vectors in the index"""
        return self.index.ntotal if self.index else 0
    
    # =====================================================
    # Text Processing
    # =====================================================
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters except basic punctuation
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        return text.strip()
    
    def _create_experience_document(self, experience: Dict) -> str:
        """
        Convert experience data into a searchable document.
        This creates a rich text representation for embedding.
        """
        parts = []
        
        # Header info
        parts.append(f"Company: {experience.get('company_name', 'Unknown')}")
        parts.append(f"Role: {experience.get('role', 'Unknown')}")
        parts.append(f"Year: {experience.get('interview_year', 'Unknown')}")
        
        if experience.get('offer_status'):
            parts.append(f"Result: {experience['offer_status']}")
        
        if experience.get('difficulty_level'):
            parts.append(f"Difficulty: {experience['difficulty_level']}/5")
        
        # Tips
        if experience.get('tips'):
            parts.append(f"Tips: {self._preprocess_text(experience['tips'])}")
        
        # Rounds
        for round_info in experience.get('rounds', []):
            round_text = f"Round {round_info.get('round_number', '?')}: {round_info.get('round_type', 'Unknown')}"
            if round_info.get('description'):
                round_text += f" - {self._preprocess_text(round_info['description'])}"
            parts.append(round_text)
        
        # Questions
        for question in experience.get('questions', []):
            q_text = self._preprocess_text(question.get('question_text', ''))
            if q_text:
                q_type = question.get('question_type', '')
                topic = question.get('topic', '')
                parts.append(f"Question ({q_type}, {topic}): {q_text}")
                
                if question.get('answer_approach'):
                    parts.append(f"Approach: {self._preprocess_text(question['answer_approach'])}")
        
        return "\n".join(parts)
    
    def _chunk_document(self, document: str, experience_id: str) -> List[Dict]:
        """
        Split document into overlapping chunks for embedding.
        Returns list of chunks with metadata.
        """
        if len(document) <= settings.CHUNK_SIZE:
            return [{
                'text': document,
                'experience_id': experience_id,
                'chunk_index': 0
            }]
        
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(document):
            end = start + settings.CHUNK_SIZE
            
            # Try to break at sentence boundary
            if end < len(document):
                last_period = document.rfind('.', start, end)
                if last_period > start + settings.CHUNK_SIZE // 2:
                    end = last_period + 1
            
            chunk_text = document[start:end].strip()
            if chunk_text:
                chunks.append({
                    'text': chunk_text,
                    'experience_id': experience_id,
                    'chunk_index': chunk_index
                })
                chunk_index += 1
            
            start = end - settings.CHUNK_OVERLAP
        
        return chunks
    
    # =====================================================
    # Embedding Operations
    # =====================================================
    
    def _embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts"""
        embeddings = self.embedding_model.encode(
            texts,
            normalize_embeddings=True,  # Normalize for cosine similarity
            show_progress_bar=len(texts) > 10
        )
        return embeddings.astype('float32')
    
    async def add_experience(self, experience: Dict):
        """Add a single experience to the index"""
        try:
            # Create document from experience
            document = self._create_experience_document(experience)
            if not document:
                logger.warning(f"Empty document for experience {experience['id']}")
                return
            
            # Chunk the document
            chunks = self._chunk_document(document, experience['id'])
            
            # Generate embeddings
            texts = [chunk['text'] for chunk in chunks]
            embeddings = await asyncio.get_event_loop().run_in_executor(
                self.executor, self._embed_texts, texts
            )
            
            # Add to index
            start_id = self.index.ntotal
            self.index.add(embeddings)
            
            # Update mappings
            for i, chunk in enumerate(chunks):
                faiss_id = start_id + i
                self.id_map[faiss_id] = experience['id']
                
            # Store metadata
            self.metadata[experience['id']] = {
                'company': experience.get('company_name'),
                'role': experience.get('role'),
                'year': experience.get('interview_year'),
                'document': document[:500]  # Store snippet
            }
            
            self._save_index()
            logger.info(f"Added experience {experience['id']} with {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"Failed to add experience: {e}")
            raise
    
    async def remove_experience(self, experience_id: str):
        """Remove an experience from the index (requires rebuild)"""
        # FAISS doesn't support deletion easily, so we mark for exclusion
        if experience_id in self.metadata:
            del self.metadata[experience_id]
            
        # Remove from id_map
        self.id_map = {k: v for k, v in self.id_map.items() if v != experience_id}
        
        logger.info(f"Marked experience {experience_id} for removal")
    
    async def reindex_all(self):
        """Rebuild the entire index from database"""
        logger.info("Starting full reindex...")
        
        # Clear existing index
        self._create_index()
        
        # Get all experiences
        experiences = await get_all_approved_experiences()
        logger.info(f"Found {len(experiences)} experiences to index")
        
        for experience in experiences:
            try:
                await self.add_experience(experience)
            except Exception as e:
                logger.error(f"Failed to index experience {experience['id']}: {e}")
        
        self._save_index()
        logger.info(f"Reindex complete. Total vectors: {self.index.ntotal}")
    
    # =====================================================
    # Query & Retrieval
    # =====================================================
    
    async def query(
        self,
        query: str,
        company: Optional[str] = None,
        year: Optional[int] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Main RAG query function.
        1. Embed query
        2. Retrieve top-K similar chunks
        3. Generate grounded answer
        """
        # Embed query
        query_embedding = await asyncio.get_event_loop().run_in_executor(
            self.executor, self._embed_texts, [query]
        )
        
        # Search index (get more than needed for filtering)
        search_k = min(top_k * 3, self.index.ntotal) if self.index.ntotal > 0 else 0
        if search_k == 0:
            return self._empty_response()
        
        distances, indices = self.index.search(query_embedding, search_k)
        
        # Process results
        seen_experiences = set()
        sources = []
        
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx == -1 or dist < settings.SIMILARITY_THRESHOLD:
                continue
            
            experience_id = self.id_map.get(idx)
            if not experience_id or experience_id in seen_experiences:
                continue
            
            # Apply filters
            meta = self.metadata.get(experience_id, {})
            if company and company.lower() not in meta.get('company', '').lower():
                continue
            if year and meta.get('year') != year:
                continue
            
            seen_experiences.add(experience_id)
            sources.append({
                'id': experience_id,
                'score': float(dist),
                'snippet': meta.get('document', '')[:300],
                'company': meta.get('company'),
                'role': meta.get('role'),
                'year': meta.get('year')
            })
            
            if len(sources) >= top_k:
                break
        
        if not sources:
            return self._empty_response()
        
        # Generate answer from sources
        answer, confidence = self._generate_answer(query, sources)
        
        # Generate trends if multiple sources
        trends = None
        if len(sources) >= 3:
            trends = self._extract_trends(sources)
        
        return {
            'answer': answer,
            'sources': sources,
            'confidence': confidence,
            'trends': trends
        }
    
    def _empty_response(self) -> Dict[str, Any]:
        """Return empty response when no results found"""
        return {
            'answer': "I couldn't find any relevant interview experiences matching your query. "
                     "Try broadening your search or asking about specific companies or topics.",
            'sources': [],
            'confidence': 0.0,
            'trends': None
        }
    
    def _generate_answer(self, query: str, sources: List[Dict]) -> tuple:
        """
        Generate a grounded answer based on retrieved sources.
        Uses a simple template-based approach for hackathon.
        For production, integrate with LLM.
        """
        if not sources:
            return self._empty_response()['answer'], 0.0
        
        # Calculate confidence based on scores
        avg_score = np.mean([s['score'] for s in sources])
        confidence = min(avg_score + 0.2, 1.0)
        
        # Extract key information
        companies = list(set(s['company'] for s in sources if s.get('company')))
        years = list(set(s['year'] for s in sources if s.get('year')))
        
        # Build answer based on query type
        query_lower = query.lower()
        
        if 'dsa' in query_lower or 'data structure' in query_lower or 'algorithm' in query_lower:
            answer = self._build_dsa_answer(query, sources)
        elif 'process' in query_lower or 'rounds' in query_lower or 'pattern' in query_lower:
            answer = self._build_process_answer(query, sources)
        elif 'difficulty' in query_lower or 'hard' in query_lower or 'easy' in query_lower:
            answer = self._build_difficulty_answer(query, sources)
        elif 'tips' in query_lower or 'prepare' in query_lower or 'advice' in query_lower:
            answer = self._build_tips_answer(query, sources)
        else:
            answer = self._build_general_answer(query, sources)
        
        # Add source attribution
        answer += f"\n\n📚 Based on {len(sources)} interview experience(s) from {', '.join(companies[:3])}"
        if years:
            answer += f" ({min(years)}-{max(years)})"
        
        return answer, confidence
    
    def _build_general_answer(self, query: str, sources: List[Dict]) -> str:
        """Build a general answer from sources"""
        answer_parts = ["Based on interview experiences from your campus:\n"]
        
        for i, source in enumerate(sources[:3], 1):
            snippet = source['snippet'][:200] + "..." if len(source['snippet']) > 200 else source['snippet']
            answer_parts.append(f"\n**{source['company']} ({source['role']}, {source['year']}):**")
            answer_parts.append(snippet)
        
        return "\n".join(answer_parts)
    
    def _build_dsa_answer(self, query: str, sources: List[Dict]) -> str:
        """Build answer for DSA-related queries"""
        answer = "**DSA Questions from Campus Interviews:**\n\n"
        
        for source in sources[:5]:
            company = source['company']
            snippet = source['snippet']
            
            # Extract questions from snippet
            questions = re.findall(r'Question[^:]*:\s*([^\n]+)', snippet)
            if questions:
                answer += f"**{company}:**\n"
                for q in questions[:3]:
                    answer += f"• {q}\n"
                answer += "\n"
        
        if not re.search(r'Question', answer):
            answer += "Common topics include: Arrays, Strings, Trees, Graphs, Dynamic Programming, and System Design.\n"
        
        return answer
    
    def _build_process_answer(self, query: str, sources: List[Dict]) -> str:
        """Build answer for interview process queries"""
        answer = "**Interview Process Overview:**\n\n"
        
        for source in sources[:3]:
            answer += f"**{source['company']} - {source['role']}:**\n"
            
            # Extract rounds from snippet
            rounds = re.findall(r'Round\s*\d+[^:]*:\s*([^\n]+)', source['snippet'])
            if rounds:
                for round_info in rounds:
                    answer += f"• {round_info}\n"
            else:
                answer += "• Technical rounds with coding and system design\n"
            answer += "\n"
        
        return answer
    
    def _build_difficulty_answer(self, query: str, sources: List[Dict]) -> str:
        """Build answer for difficulty-related queries"""
        answer = "**Difficulty Assessment:**\n\n"
        
        difficulty_info = []
        for source in sources:
            if 'Difficulty' in source['snippet']:
                match = re.search(r'Difficulty:\s*(\d)/5', source['snippet'])
                if match:
                    difficulty_info.append({
                        'company': source['company'],
                        'level': int(match.group(1))
                    })
        
        if difficulty_info:
            avg_diff = np.mean([d['level'] for d in difficulty_info])
            answer += f"Average difficulty: **{avg_diff:.1f}/5**\n\n"
            
            for d in difficulty_info[:5]:
                level_text = ['Easy', 'Easy-Medium', 'Medium', 'Medium-Hard', 'Hard'][d['level']-1]
                answer += f"• {d['company']}: {d['level']}/5 ({level_text})\n"
        else:
            answer += "Difficulty levels vary. Most technical interviews are rated Medium to Hard.\n"
        
        return answer
    
    def _build_tips_answer(self, query: str, sources: List[Dict]) -> str:
        """Build answer for preparation tips queries"""
        answer = "**Preparation Tips from Successful Candidates:**\n\n"
        
        for i, source in enumerate(sources[:5], 1):
            # Extract tips from snippet
            tips_match = re.search(r'Tips:\s*([^\n]+(?:\n(?!Round|Question|Company)[^\n]+)*)', source['snippet'])
            if tips_match:
                answer += f"**{source['company']}:** {tips_match.group(1)[:300]}\n\n"
        
        # Add generic tips if none found
        if "Tips:" not in answer:
            answer += """Common recommendations:
• Practice DSA on LeetCode/HackerRank (200+ problems)
• Review core CS fundamentals
• Prepare behavioral questions with STAR method
• Research company-specific interview patterns
• Mock interviews are highly recommended
"""
        
        return answer
    
    def _extract_trends(self, sources: List[Dict]) -> Dict[str, Any]:
        """Extract trends from multiple sources"""
        companies = [s['company'] for s in sources if s.get('company')]
        years = [s['year'] for s in sources if s.get('year')]
        
        return {
            'companies_mentioned': list(set(companies)),
            'year_range': [min(years), max(years)] if years else None,
            'total_experiences': len(sources)
        }
    
    async def find_similar(self, experience_id: str, top_k: int = 5) -> Dict[str, Any]:
        """Find experiences similar to a given experience"""
        if experience_id not in self.metadata:
            raise ValueError(f"Experience {experience_id} not in index")
        
        # Get the document text
        doc_text = self.metadata[experience_id].get('document', '')
        if not doc_text:
            return {'ids': [], 'scores': []}
        
        # Embed and search
        embedding = self._embed_texts([doc_text])
        distances, indices = self.index.search(embedding, top_k + 5)
        
        # Filter results
        seen = {experience_id}
        results = []
        
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            exp_id = self.id_map.get(idx)
            if exp_id and exp_id not in seen:
                seen.add(exp_id)
                results.append({'id': exp_id, 'score': float(dist)})
                if len(results) >= top_k:
                    break
        
        return {
            'ids': [r['id'] for r in results],
            'scores': [r['score'] for r in results]
        }
    
    async def analyze_trends(
        self,
        company: Optional[str] = None,
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """Analyze trends across experiences"""
        relevant_exp = []
        
        for exp_id, meta in self.metadata.items():
            if company and company.lower() not in meta.get('company', '').lower():
                continue
            if year and meta.get('year') != year:
                continue
            relevant_exp.append(meta)
        
        if not relevant_exp:
            return {'data': [], 'insights': ['No data available for the specified filters.']}
        
        # Extract trends
        companies = {}
        for exp in relevant_exp:
            c = exp.get('company', 'Unknown')
            companies[c] = companies.get(c, 0) + 1
        
        data = [
            {'company': c, 'count': count}
            for c, count in sorted(companies.items(), key=lambda x: -x[1])[:10]
        ]
        
        insights = [
            f"Total experiences analyzed: {len(relevant_exp)}",
            f"Top company: {data[0]['company']} with {data[0]['count']} experiences" if data else "No data"
        ]
        
        return {'data': data, 'insights': insights}
