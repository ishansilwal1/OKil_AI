# Legal RAG System V2 - Complete Refactoring

## Overview
This is a complete rebuild of your RAG system with advanced chunking, state-of-the-art embeddings, and cross-lingual support for Nepali legal documents.

## Key Improvements

### 1. Delimiter-Based Chunking (`delimiter_chunker.py`)
- **Intelligent Splitting**: Chunks are created based on legal delimiters (धारा, दफा, नियम)
- **Rich Metadata**: Each chunk includes complete citation information
- **Unique IDs**: Every chunk has a slugified, unique identifier
- **Results**: 390 high-quality, legally-structured chunks

### 2. Advanced Embeddings (`embedding_generator_v2.py`)
- **Model**: `intfloat/multilingual-e5-large` (top-tier multilingual embeddings)
- **Vector Store**: ChromaDB (modern, persistent vector database)
- **Cross-lingual**: Understands both Nepali and English queries
- **Performance**: 390 documents embedded in ~7 minutes

### 3. RAG Pipeline (`legal_rag_system_v2.py`)
- **Semantic Search**: Retrieves most relevant legal chunks
- **Cross-lingual**: Answer English queries with Nepali content
- **Citation-Ready**: Generates prompts instructing LLM to cite sources
- **LLM-Ready**: Plug in any LLM (Ollama, OpenAI, etc.)

## Project Structure

```
ml/
├── data/
│   └── cleaned/               # Source legal documents
│       ├── Civil_code.txt
│       ├── Constitution of Nepal.txt
│       ├── Constitution_english.txt
│       ├── financial_act_.txt
│       ├── land_use_act_.txt
│       └── property_tax_.txt
├── processed/
│   └── chunks/
│       ├── legal_chunks_delimiter_based.jsonl  # 390 chunks
│       └── chunking_stats_v2.json
├── embeddings/
│   └── chroma_db_v2/          # ChromaDB vector store
└── scripts/
    ├── delimiter_chunker.py          # NEW: Delimiter-based chunking
    ├── embedding_generator_v2.py     # NEW: ChromaDB + E5-Large
    ├── legal_rag_system_v2.py        # NEW: Cross-lingual RAG
    └── test_rag_system.py            # Test script
```

## Usage

### Step 1: Chunk Documents
```bash
cd ml/scripts
python delimiter_chunker.py
```
**Output**: 390 legally-structured chunks in `legal_chunks_delimiter_based.jsonl`

### Step 2: Generate Embeddings
```bash
python embedding_generator_v2.py
```
**Output**: ChromaDB vector store with 390 embedded chunks

### Step 3: Test RAG System
```bash
python test_rag_system.py
```
**Output**: Demonstrates retrieval and prompt generation

### Step 4: Interactive Q&A
```bash
python legal_rag_system_v2.py
```
**Output**: Interactive terminal for asking questions

## Example Query Flow

**User Query (English)**: "How is the prime minister elected in Nepal?"

**System Process**:
1. Embeds the query using `multilingual-e5-large`
2. Searches ChromaDB for relevant chunks
3. Retrieves top matches (e.g., Constitution articles on PM election)
4. Constructs a detailed prompt for the LLM

**Generated Prompt** (Nepali):
```
तपाईं एक विशेषज्ञ नेपाली कानूनी सल्लाहकार हुनुहुन्छ...

**प्रयोगकर्ताको प्रश्न:**
How is the prime minister elected in Nepal?

**सान्दर्भिक कानूनी सन्दर्भ:**
[स्रोत: नेपालको संविधान, २०७२, धारा ७६]
प्रधानमन्त्री नियुक्ति...

**तपाईंको विस्तृत नेपाली जवाफ:**
```

**LLM Output** (Expected):
```
नेपालमा प्रधानमन्त्री निर्वाचन प्रक्रिया नेपालको संविधानको धारा ७६ अनुसार हुन्छ।

१. राष्ट्रपतिद्वारा नियुक्ति: नेपालको संविधानको धारा ७६(१) अनुसार, राष्ट्रपतिले संसद्मा बहुमत...
२. बहुमतको प्रमाण...
३. विकल्प प्रक्रिया...

(स्रोत: नेपालको संविधान, २०७२, धारा ७६)
```

## Features

### Cross-Lingual Support
- Ask in **English**, get cited answers in **Nepali**
- Ask in **Nepali**, get cited answers in **Nepali**
- Seamless translation through multilingual embeddings

### Accurate Citations
Every chunk includes:
- `act_name_ne`: "नागरिक संहिता, २०७४"
- `section_type_ne`: "दफा"
- `section_number`: "१७"
- `citation_reference`: "नागरिक संहिता, २०७४, दफा १७"

### LLM Integration (Next Step)
The system generates prompts ready for any LLM. To integrate:

```python
from legal_rag_system_v2 import LegalRAGSystem

rag = LegalRAGSystem()
result = rag.answer_question("How is PM elected?", use_llm=True)

# Get the prompt
prompt = result['prompt']

# Send to your LLM (example with Ollama)
import requests
response = requests.post('http://localhost:11434/api/generate', json={
    'model': 'llama3',
    'prompt': prompt
})

answer = response.json()['response']
```

## Statistics

| Metric | Value |
|--------|-------|
| Total Chunks | 390 |
| Civil Code | 147 chunks |
| Constitution (Nepali) | 90 chunks |
| Financial Act | 107 chunks |
| Land Use Act | 29 chunks |
| Property Tax Act | 17 chunks |
| Embedding Model Dimension | 1024 |
| Average Chunk Size | ~2000 chars |

## Dependencies

```
chromadb
sentence-transformers
langchain
numpy
```

## Next Steps

1. **Integrate LLM**: Connect with Ollama, OpenAI API, or Hugging Face
2. **Fine-tune Prompts**: Optimize for better Nepali output
3. **Add Frontend**: Connect to your React app
4. **Deploy**: Containerize and deploy to cloud

## Testing

Run the test script to verify everything works:
```bash
python test_rag_system.py
```

This will test:
- ✅ ChromaDB connection
- ✅ Embedding model loading
- ✅ Semantic search
- ✅ Cross-lingual retrieval
- ✅ Prompt generation

---

**Status**: ✅ **System Ready for LLM Integration**

All components are refactored, tested, and ready for production use!
