# Legal RAG System - Production Files

## 🎯 Core System Files

### 1. **legal_rag_groq.py** (Main System)
Your production RAG system using:
- Groq API with llama-3.3-70b-versatile
- ChromaDB vector store
- multilingual-e5-large embeddings
- Cross-lingual support (English query → Nepali answer)

**Usage:**
```bash
cd "D:\okil ai\ml\scripts"
python legal_rag_groq.py
```

### 2. **delimiter_chunker.py** (Document Processing)
Chunks legal documents by section headers (धारा/दफा/नियम).

**Usage:**
```bash
cd "D:\okil ai"
python "ml\scripts\delimiter_chunker.py"
```

**Output:** `ml/processed/chunks/legal_chunks_delimiter_based.jsonl`

### 3. **embedding_generator_v2.py** (Vector Database)
Generates embeddings and stores in ChromaDB.

**Usage:**
```bash
cd "D:\okil ai"
.\venv\Scripts\Activate.ps1
python "ml\scripts\embedding_generator_v2.py"
```

**Output:** `ml/embeddings/chroma_db_v2/`

### 4. **clean_source_files.py** (Preprocessing)
Cleans source documents:
- Removes www.lawcommission.gov.np references
- Adds newlines before section headers
- Normalizes spacing

**Usage:**
```bash
cd "D:\okil ai"
python "ml\scripts\clean_source_files.py"
```

## 📁 Data Pipeline

```
ml/data/cleaned/              → Source files (6 legal documents)
      ↓
ml/scripts/clean_source_files.py  → Preprocess
      ↓
ml/scripts/delimiter_chunker.py   → Extract 390 chunks
      ↓
ml/processed/chunks/legal_chunks_delimiter_based.jsonl
      ↓
ml/scripts/embedding_generator_v2.py  → Generate embeddings
      ↓
ml/embeddings/chroma_db_v2/    → Vector database (390 documents)
      ↓
ml/scripts/legal_rag_groq.py   → Query interface
```

## ✅ System Status

- **Chunks:** 390 legal sections extracted
- **Embeddings:** 390 documents in ChromaDB
- **Model:** intfloat/multilingual-e5-large (1024 dims)
- **LLM:** Groq llama-3.3-70b-versatile
- **Query Time:** < 5 seconds per query
- **Answer Quality:** ✅ Complete, properly cited responses

## 🚀 Quick Start

1. **Activate virtual environment:**
   ```bash
   cd "D:\okil ai"
   .\venv\Scripts\Activate.ps1
   ```

2. **Run the RAG system:**
   ```bash
   cd ml\scripts
   python legal_rag_groq.py
   ```

3. **Ask questions:**
   - English: "What are the fundamental rights?"
   - Nepali: "नागरिकताको प्रकार के के छन्?"

## 📝 Notes

- Source files are in Nepali (Devanagari script)
- System supports cross-lingual queries
- All answers are in Nepali with proper legal citations
- Groq API key required (stored in .env file)
