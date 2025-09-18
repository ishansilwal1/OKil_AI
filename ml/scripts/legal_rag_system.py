#!/usr/bin/env python3
"""
Enhanced Smart RAG Q&A System for Nepal Legal Corpus
Integrates with new optimized legal corpus embeddings (5,120 chunks)
"""

import json
import re
from pathlib import Path
import argparse
import numpy as np
from typing import List, Dict, Tuple, Optional
import sys


class EnhancedLegalRAG:
    def __init__(self, base_dir: str = "D:/okil ai/ml"):
        self.base_dir = Path(base_dir)
        self.embeddings_dir = self.base_dir / "embeddings"
        
        # Load the new legal corpus
        self.meta_path = self.embeddings_dir / "legal_corpus_meta.json"
        self.faiss_path = self.embeddings_dir / "legal_corpus_faiss.index"
        self.embeddings_path = self.embeddings_dir / "legal_corpus_embeddings.npy"
        
        self.meta = []
        self.index = None
        self.embeddings = None
        self.keyword_index = {}
        
        # Load components
        self._load_corpus()
        self._load_search_index()
        self._create_keyword_index()
    
    def _load_corpus(self):
        """Load legal corpus metadata"""
        if self.meta_path.exists():
            with open(self.meta_path, 'r', encoding='utf-8') as f:
                self.meta = json.load(f)
            print(f"Loaded {len(self.meta)} legal documents")
        else:
            raise FileNotFoundError(f"Legal corpus metadata not found: {self.meta_path}")
    
    def _load_search_index(self):
        """Load FAISS index or embeddings"""
        try:
            import faiss
            if self.faiss_path.exists():
                self.index = faiss.read_index(str(self.faiss_path))
                print(f"Loaded FAISS index with {self.index.ntotal} vectors")
                return
        except ImportError:
            print("FAISS not available, falling back to numpy embeddings")
        
        if self.embeddings_path.exists():
            self.embeddings = np.load(str(self.embeddings_path)).astype("float32")
            print(f"Loaded embeddings: {self.embeddings.shape}")
        else:
            raise FileNotFoundError("No search index found")
    
    def _create_keyword_index(self):
        """Create enhanced keyword index for legal concepts"""
        print("Building keyword index...")
        
        # Enhanced legal keywords covering all document types
        keywords = {
            # Constitutional Rights (Nepal Constitution)
            'मौलिक अधिकार': ['fundamental rights', 'मौलिक अधिकार', 'basic rights', 'हक', 'अधिकार'],
            'स्वतन्त्रता': ['freedom', 'liberty', 'स्वतन्त्रता', 'independence', 'autonomy'],
            'समानता': ['equality', 'equal', 'समानता', 'बराबर', 'सामान', 'discrimination'],
            'न्याय': ['justice', 'न्याय', 'judicial', 'fair trial', 'due process'],
            'जीवनको अधिकार': ['right to life', 'जीवन', 'life', 'बाँच्न', 'सम्मानपूर्वक'],
            'शिक्षाको अधिकार': ['right to education', 'शिक्षा', 'education', 'learning'],
            'स्वास्थ्यको अधिकार': ['right to health', 'स्वास्थ्य', 'health', 'healthcare', 'medical'],
            
            # Government Structure
            'संसद': ['parliament', 'संसद', 'legislative', 'legislature', 'assembly'],
            'प्रधानमन्त्री': ['prime minister', 'प्रधानमन्त्री', 'pm', 'head of government'],
            'राष्ट्रपति': ['president', 'राष्ट्रपति', 'head of state'],
            'न्यायपालिका': ['judiciary', 'न्यायपालिका', 'court', 'judicial branch'],
            'कार्यपालिका': ['executive', 'कार्यपालिका', 'executive branch'],
            'नगरपालिका': ['municipality', 'नगरपालिका', 'municipal', 'local government'],
            'सरकार': ['government', 'सरकार', 'administration', 'authority'],
            
            # Legal Framework
            'धारा': ['article', 'section', 'धारा', 'clause', 'provision'],
            'संविधान': ['constitution', 'संविधान', 'constitutional', 'supreme law'],
            'कानून': ['law', 'legal', 'कानून', 'legislation', 'statute', 'act'],
            'ऐन': ['act', 'ऐन', 'legislation', 'statute'],
            'नियम': ['rule', 'regulation', 'नियम', 'procedure'],
            'अदालत': ['court', 'अदालत', 'tribunal', 'judicial body'],
            
            # Civil Law (from civilcode.txt)
            'नागरिक संहिता': ['civil code', 'नागरिक संहिता', 'civil law', 'private law'],
            'सम्पत्ति': ['property', 'सम्पत्ति', 'asset', 'estate', 'ownership'],
            'मालिकाना हक': ['ownership right', 'मालिकाना', 'proprietary', 'title'],
            'करार': ['contract', 'करार', 'agreement', 'deal'],
            'परिवार': ['family', 'परिवार', 'domestic', 'household'],
            'विवाह': ['marriage', 'विवाह', 'matrimony', 'wedding'],
            'विवाद': ['dispute', 'विवाद', 'conflict', 'litigation'],
            
            # Financial Law
            'वित्तीय': ['financial', 'वित्तीय', 'fiscal', 'monetary'],
            'बजेट': ['budget', 'बजेट', 'appropriation', 'allocation'],
            'कर': ['tax', 'कर', 'taxation', 'levy', 'duty'],
            'राजस्व': ['revenue', 'राजस्व', 'income', 'collection'],
            'बैंक': ['bank', 'बैंक', 'banking', 'financial institution'],
            'ऋण': ['loan', 'debt', 'ऋण', 'credit', 'borrowing'],
            
            # Land Law
            'जग्गा': ['land', 'जग्गा', 'plot', 'territory'],
            'भूमि': ['land', 'भूमि', 'soil', 'ground', 'terrain'],
            'भूमि उपयोग': ['land use', 'भूमि उपयोग', 'land utilization'],
            'नापी': ['survey', 'नापी', 'measurement', 'mapping'],
            'दाखिल खारेज': ['registration', 'दाखिल खारेज', 'transfer', 'mutation'],
            'लालपुर्जा': ['title deed', 'लालपुर्जा', 'ownership certificate'],
            
            # Tax Law
            'सम्पत्ति कर': ['property tax', 'सम्पत्ति कर', 'real estate tax'],
            'आयकर': ['income tax', 'आयकर', 'personal tax'],
            'भन्सार': ['customs', 'भन्सार', 'import duty', 'tariff'],
            'महसुल': ['fee', 'महसुल', 'charge', 'assessment'],
            
            # Elections & Citizenship
            'निर्वाचन': ['election', 'निर्वाचन', 'electoral', 'voting', 'poll'],
            'नागरिकता': ['citizenship', 'नागरिकता', 'nationality', 'citizen'],
            'मतदान': ['voting', 'मतदान', 'ballot', 'poll'],
            'उम्मेदवार': ['candidate', 'उम्मेदवार', 'nominee', 'aspirant'],
            
            # Administrative
            'मन्त्रिपरिषद': ['cabinet', 'council of ministers', 'मन्त्रिपरिषद'],
            'सेवा': ['service', 'सेवा', 'administration', 'bureaucracy'],
            'निकाय': ['body', 'निकाय', 'organization', 'institution'],
            'आयोग': ['commission', 'आयोग', 'committee', 'board']
        }
        
        self.keyword_index = {}
        
        for idx, entry in enumerate(self.meta):
            text = entry.get("text", "").lower()
            source = entry.get("source", "")
            
            # Index by legal concepts
            for concept, terms in keywords.items():
                for term in terms:
                    if term.lower() in text:
                        if concept not in self.keyword_index:
                            self.keyword_index[concept] = []
                        if idx not in self.keyword_index[concept]:
                            self.keyword_index[concept].append(idx)
        
        print(f"Keyword index built: {len(self.keyword_index)} concepts")
    
    def _get_contextual_source_weights(self, query_lower: str) -> dict:
        """Get source weights based on query context"""
        # Base weights (balanced)
        base_weights = {
            'nepal_constitution_ne': 1.2,
            'nepal_constitution_en': 1.2,
            'constitution_english': 1.2,
            'civilcode': 1.2,
            'Financial_Act': 1.2,
            'Land_use_act': 1.2,
            'Property_Tax': 1.2,
            'sambidhan_pdf': 1.2
        }
        
        # Context-specific boosts
        context_boosts = {
            # Land and property related
            'land': {'Land_use_act': 0.6, 'civilcode': 0.3},
            'भूमि': {'Land_use_act': 0.6, 'civilcode': 0.3},
            'जग्गा': {'Land_use_act': 0.6, 'civilcode': 0.3},
            'property': {'civilcode': 0.5, 'Property_Tax': 0.4},
            'सम्पत्ति': {'civilcode': 0.5, 'Property_Tax': 0.4},
            'subdivision': {'Land_use_act': 0.7},
            'कित्ताकाट': {'Land_use_act': 0.7},
            
            # Tax related
            'tax': {'Property_Tax': 0.6, 'Financial_Act': 0.3},
            'कर': {'Property_Tax': 0.6, 'Financial_Act': 0.3},
            'revenue': {'Financial_Act': 0.5, 'Property_Tax': 0.3},
            'राजस्व': {'Financial_Act': 0.5, 'Property_Tax': 0.3},
            
            # Financial and banking
            'bank': {'Financial_Act': 0.7},
            'बैंक': {'Financial_Act': 0.7},
            'financial': {'Financial_Act': 0.6},
            'वित्तीय': {'Financial_Act': 0.6},
            'loan': {'Financial_Act': 0.5, 'civilcode': 0.2},
            'ऋण': {'Financial_Act': 0.5, 'civilcode': 0.2},
            
            # Civil matters
            'marriage': {'civilcode': 0.7},
            'विवाह': {'civilcode': 0.7},
            'contract': {'civilcode': 0.6},
            'करार': {'civilcode': 0.6},
            'family': {'civilcode': 0.5},
            'परिवार': {'civilcode': 0.5},
            'inheritance': {'civilcode': 0.6},
            'उत्तराधिकार': {'civilcode': 0.6},
            
            # Constitutional (only boost when explicitly constitutional queries)
            'fundamental rights': {'nepal_constitution_ne': 0.4, 'nepal_constitution_en': 0.4, 'constitution_english': 0.3},
            'मौलिक अधिकार': {'nepal_constitution_ne': 0.5, 'nepal_constitution_en': 0.3},
            'constitution': {'nepal_constitution_ne': 0.3, 'nepal_constitution_en': 0.3, 'constitution_english': 0.3},
            'संविधान': {'nepal_constitution_ne': 0.4, 'nepal_constitution_en': 0.3},
            'parliament': {'nepal_constitution_ne': 0.3, 'nepal_constitution_en': 0.3, 'constitution_english': 0.3},
            'संसद': {'nepal_constitution_ne': 0.4, 'nepal_constitution_en': 0.3},
        }
        
        # Apply context boosts
        contextual_weights = base_weights.copy()
        for keyword, source_boosts in context_boosts.items():
            if keyword in query_lower:
                for source, boost in source_boosts.items():
                    if source in contextual_weights:
                        contextual_weights[source] += boost
        
        return contextual_weights
    
    def keyword_search(self, query: str, debug: bool = False) -> List[Tuple[int, float]]:
        """Enhanced keyword search with source weighting"""
        query_lower = query.lower()
        matches = {}
        
        if debug:
            print(f"Keyword search for: '{query}'")
        
        # Enhanced keyword matching
        keywords = {
            'मौलिक अधिकार': ['fundamental rights', 'मौलिक अधिकार', 'basic rights', 'हक', 'अधिकार'],
            'स्वतन्त्रता': ['freedom', 'liberty', 'स्वतन्त्रता', 'independence', 'autonomy'],
            'समानता': ['equality', 'equal', 'समानता', 'बराबर', 'सामान', 'discrimination'],
            'न्याय': ['justice', 'न्याय', 'judicial', 'fair trial', 'due process'],
            'जीवनको अधिकार': ['right to life', 'जीवन', 'life', 'बाँच्न', 'सम्मानपूर्वक'],
            'शिक्षाको अधिकार': ['right to education', 'शिक्षा', 'education', 'learning'],
            'स्वास्थ्यको अधिकार': ['right to health', 'स्वास्थ्य', 'health', 'healthcare', 'medical'],
            'संसद': ['parliament', 'संसद', 'legislative', 'legislature', 'assembly'],
            'प्रधानमन्त्री': ['prime minister', 'प्रधानमन्त्री', 'pm', 'head of government'],
            'राष्ट्रपति': ['president', 'राष्ट्रपति', 'head of state'],
            'न्यायपालिका': ['judiciary', 'न्यायपालिका', 'court', 'judicial branch'],
            'कार्यपालिका': ['executive', 'कार्यपालिका', 'executive branch'],
            'नगरपालिका': ['municipality', 'नगरपालिका', 'municipal', 'local government'],
            'सरकार': ['government', 'सरकार', 'administration', 'authority'],
            'धारा': ['article', 'section', 'धारा', 'clause', 'provision'],
            'संविधान': ['constitution', 'संविधान', 'constitutional', 'supreme law'],
            'कानून': ['law', 'legal', 'कानून', 'legislation', 'statute', 'act'],
            'ऐन': ['act', 'ऐन', 'legislation', 'statute'],
            'नियम': ['rule', 'regulation', 'नियम', 'procedure'],
            'अदालत': ['court', 'अदालत', 'tribunal', 'judicial body'],
            'नागरिक संहिता': ['civil code', 'नागरिक संहिता', 'civil law', 'private law'],
            'सम्पत्ति': ['property', 'सम्पत्ति', 'asset', 'estate', 'ownership'],
            'करार': ['contract', 'करार', 'agreement', 'deal'],
            'विवाह': ['marriage', 'विवाह', 'matrimony', 'wedding'],
            'वित्तीय': ['financial', 'वित्तीय', 'fiscal', 'monetary'],
            'कर': ['tax', 'कर', 'taxation', 'levy', 'duty'],
            'जग्गा': ['land', 'जग्गा', 'plot', 'territory'],
            'भूमि': ['land', 'भूमि', 'soil', 'ground', 'terrain'],
            'निर्वाचन': ['election', 'निर्वाचन', 'electoral', 'voting', 'poll'],
            'नागरिकता': ['citizenship', 'नागरिकता', 'nationality', 'citizen']
        }
        
        # Dynamic source weighting based on query context
        source_weights = self._get_contextual_source_weights(query_lower)
        
        # Search by keyword concepts
        for concept, doc_ids in self.keyword_index.items():
            if concept not in keywords:
                continue
                
            terms = keywords[concept]
            match_score = 0
            
            # Check if any concept terms match the query
            for term in terms:
                if term.lower() in query_lower:
                    match_score += 2.0  # Base score for term match
                    if debug:
                        print(f"  ✓ Term match: '{term}' in concept '{concept}'")
            
            # Add documents with source weighting
            if match_score > 0:
                for doc_id in doc_ids:
                    if doc_id < len(self.meta):
                        doc = self.meta[doc_id]
                        source = doc.get('source', '')
                        source_weight = source_weights.get(source, 1.0)
                        
                        final_score = match_score * source_weight
                        
                        if doc_id in matches:
                            matches[doc_id] = max(matches[doc_id], final_score)
                        else:
                            matches[doc_id] = final_score
        
        # Direct text matching in documents
        for idx, entry in enumerate(self.meta):
            text = entry.get("text", "").lower()
            source = entry.get("source", "")
            
            # Count query word matches
            query_words = query_lower.split()
            word_matches = sum(1 for word in query_words if word in text)
            
            if word_matches > 0:
                text_score = word_matches * 0.5  # Lower weight for direct text matches
                source_weight = source_weights.get(source, 1.0)
                final_score = text_score * source_weight
                
                if idx in matches:
                    matches[idx] = max(matches[idx], final_score)
                else:
                    matches[idx] = final_score
        
        # Convert to sorted list
        results = [(doc_id, score) for doc_id, score in matches.items()]
        results.sort(key=lambda x: x[1], reverse=True)
        
        if debug:
            print(f"  Keyword search found {len(results)} matches")
            for i, (doc_id, score) in enumerate(results[:5]):
                doc = self.meta[doc_id]
                print(f"    {i+1}. Score: {score:.2f}, Source: {doc.get('source', 'unknown')}")
        
        return results
    
    def semantic_search(self, query: str, top_k: int = 50, debug: bool = False) -> List[Tuple[int, float]]:
        """Semantic search using embeddings"""
        if debug:
            print(f"🧠 Semantic search for: '{query}'")
        
        try:
            from sentence_transformers import SentenceTransformer
            
            # Use same model as corpus generation
            model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", device="cpu")
            query_embedding = model.encode([query], normalize_embeddings=True)
            
            if self.index is not None:
                # Use FAISS for fast search
                scores, indices = self.index.search(query_embedding.astype('float32'), top_k)
                results = [(int(indices[0][i]), float(scores[0][i])) for i in range(len(indices[0]))]
            else:
                # Fallback to numpy cosine similarity
                similarities = np.dot(query_embedding, self.embeddings.T).flatten()
                top_indices = np.argsort(similarities)[::-1][:top_k]
                results = [(int(idx), float(similarities[idx])) for idx in top_indices]
            
            if debug:
                print(f"  Semantic search found {len(results)} matches")
                for i, (doc_id, score) in enumerate(results[:5]):
                    if doc_id < len(self.meta):
                        doc = self.meta[doc_id]
                        print(f"    {i+1}. Score: {score:.3f}, Source: {doc.get('source', 'unknown')}")
            
            return results
            
        except Exception as e:
            print(f"Semantic search error: {e}")
            return []
    
    def combine_results(self, keyword_results: List[Tuple[int, float]], 
                       semantic_results: List[Tuple[int, float]], 
                       debug: bool = False) -> List[Tuple[int, float, str]]:
        """Combine and rank keyword + semantic results"""
        combined = {}
        
        # Add keyword results with higher weight
        for doc_id, score in keyword_results:
            combined[doc_id] = {
                'keyword_score': score,
                'semantic_score': 0.0,
                'combined_score': score * 1.5  # Higher weight for keyword matches
            }
        
        # Add semantic results
        for doc_id, score in semantic_results:
            if doc_id in combined:
                combined[doc_id]['semantic_score'] = score
                combined[doc_id]['combined_score'] += score * 1.0
            else:
                combined[doc_id] = {
                    'keyword_score': 0.0,
                    'semantic_score': score,
                    'combined_score': score * 1.0
                }
        
        # Sort by combined score with balanced source consideration
        final_results = []
        for doc_id, scores in combined.items():
            if doc_id < len(self.meta):
                doc = self.meta[doc_id]
                
                # No automatic source boosting - let contextual weights handle it
                # This ensures fair ranking across all sources
                
                # Determine match type
                if scores['keyword_score'] > 0 and scores['semantic_score'] > 0:
                    match_type = "keyword+semantic"
                elif scores['keyword_score'] > 0:
                    match_type = "keyword"
                else:
                    match_type = "semantic"
                
                final_results.append((doc_id, scores['combined_score'], match_type))
        
        final_results.sort(key=lambda x: x[1], reverse=True)
        
        if debug:
            print(f"  🔗 Combined {len(final_results)} results")
            for i, (doc_id, score, match_type) in enumerate(final_results[:5]):
                doc = self.meta[doc_id]
                print(f"    {i+1}. Score: {score:.2f}, Type: {match_type}, Source: {doc.get('source', 'unknown')}")
        
        return final_results
    
    def search(self, query: str, top_k: int = 10, debug: bool = False) -> List[Dict]:
        """Main search function combining keyword and semantic search"""
        if debug:
            print(f"\n{'='*60}")
            print(f"ENHANCED LEGAL SEARCH")
            print(f"Query: '{query}'")
            print(f"{'='*60}")
        
        # Perform both searches
        keyword_results = self.keyword_search(query, debug=debug)
        semantic_results = self.semantic_search(query, top_k=50, debug=debug)
        
        # Combine results
        combined_results = self.combine_results(keyword_results, semantic_results, debug=debug)
        
        # Format final results
        final_results = []
        for i, (doc_id, score, match_type) in enumerate(combined_results[:top_k]):
            if doc_id < len(self.meta):
                doc = self.meta[doc_id]
                
                # Extract article/section number if available
                text = doc.get('text', '')
                article_num = self._extract_article_number(text)
                
                final_results.append({
                    'rank': i + 1,
                    'text': text,
                    'source': doc.get('source', 'unknown'),
                    'score': round(score, 3),
                    'match_type': match_type,
                    'article_number': article_num,
                    'char_count': doc.get('char_count', len(text)),
                    'chunk_id': doc.get('chunk_id', ''),
                    'metadata': doc.get('metadata', {})
                })
        
        if debug:
            print(f"\nFINAL RESULTS ({len(final_results)} items)")
            for result in final_results:
                print(f"  {result['rank']}. [{result['match_type']}] Score: {result['score']}")
                print(f"     Source: {result['source']} | Article: {result['article_number']}")
                print(f"     Text: {result['text']}")
                print()
        
        return final_results
    
    def _extract_article_number(self, text: str) -> str:
        """Extract article/dhara number from text"""
        # Look for धारा NN or Article NN
        nepali_match = re.search(r'धारा\s*(\d+)', text)
        english_match = re.search(r'article\s*(\d+)', text, re.IGNORECASE)
        section_match = re.search(r'section\s*(\d+)', text, re.IGNORECASE)
        
        if nepali_match:
            return f"धारा {nepali_match.group(1)}"
        elif english_match:
            return f"Article {english_match.group(1)}"
        elif section_match:
            return f"Section {section_match.group(1)}"
        return ""


def main():
    """Interactive Q&A session"""
    print("Enhanced Nepal Legal RAG System")
    print("=" * 50)
    print("Using optimized legal corpus with 5,120 chunks")
    print("Sources: Constitution, Civil Code, Financial Act, Land Use Act, Property Tax")
    print("=" * 50)
    
    try:
        # Initialize RAG system
        rag = EnhancedLegalRAG()
        
        print(f"\nSystem initialized successfully!")
        print(f"Corpus Statistics:")
        print(f"   - Total documents: {len(rag.meta)}")
        print(f"   - Search index: {'FAISS' if rag.index else 'NumPy embeddings'}")
        print(f"   - Keyword concepts: {len(rag.keyword_index)}")
        
        print(f"\nExample queries:")
        print(f"   - मौलिक अधिकारहरू के के छन्?")
        print(f"   - What are the fundamental rights in Nepal?")
        print(f"   - भूमि उपयोगको नियम के छ?")
        print(f"   - Property tax कसरी तिर्ने?")
        print(f"   - Civil marriage को कानून")
        
        print(f"\nReady for questions! (Type 'quit' to exit)")
        print("=" * 50)
        
        while True:
            try:
                query = input("\n❓ Your question: ").strip()
                
                if query.lower() in ['quit', 'exit', 'q']:
                    break
                
                if not query:
                    continue
                
                # Search for answers
                results = rag.search(query, top_k=5, debug=True)
                
                if results:
                    print(f"\n📖 Top {len(results)} Results:")
                    print("-" * 50)
                    
                    for result in results:
                        print(f"\n{result['rank']}. [{result['match_type'].upper()}] Score: {result['score']}")
                        print(f"   Source: {result['source']}")
                        if result['article_number']:
                            print(f"   Article: {result['article_number']}")
                        print(f"   Text: {result['text']}")
                        print(f"   Characters: {result['char_count']}")
                        print("-" * 30)
                else:
                    print("\nNo relevant results found.")
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\nError: {e}")
    
    except Exception as e:
        print(f"Failed to initialize system: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()