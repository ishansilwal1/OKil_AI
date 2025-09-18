# Okil AI - Legal RAG System [IN PROGRESS]

An in-development Retrieval-Augmented Generation (RAG) system for Nepali legal documents. Currently building intelligent Q&A capabilities for constitutional, civil, and regulatory law queries.

## 🎯 Project Status

**Current Phase**: Core ML Pipeline Development ✅  
**Status**: In Active Development  
**Last Updated**: September 18, 2025

This is an ongoing project to build a comprehensive legal information system for Nepal. The core machine learning pipeline has been developed and tested, with frontend and backend components planned for future phases.

## ✨ Features Implemented

- **🔍 Hybrid Search**: Advanced keyword + semantic search with result ranking
- **🌐 Bilingual Support**: Native support for Nepali and English legal documents
- **📚 Multi-Source Integration**: Constitution, Civil Code, Land Use, Financial, and Tax law
- **⚡ Optimized Performance**: 300-350 character smart chunking for optimal context
- **🎯 Source Diversity**: Algorithms ensuring varied, relevant results
- **📊 Analytics**: Comprehensive performance metrics and query analysis

## 🏗️ System Architecture

### Data Pipeline
```
Raw Documents → Data Cleaning → Document Chunking → Embedding Generation → RAG System
```

### Core Components
- **Data Cleaner**: Processes raw PDF/text files into clean, standardized format
- **Document Chunker**: Creates optimized chunks with context preservation
- **Embedding Generator**: Generates FAISS vector index for semantic search
- **Legal RAG System**: Main Q&A engine with hybrid search capabilities
- **Demo & Testing**: Comprehensive testing and demonstration tools

## 📁 Project Structure

```
okil-ai/
├── backend/ [PLANNED]            # FastAPI backend (future development)
├── frontend/ [PLANNED]           # React frontend (future development)
├── ml/ [COMPLETED]              # Machine Learning Pipeline ✅
│   ├── data/
│   │   ├── raw/                 # Original legal documents
│   │   └── cleaned/             # Processed, cleaned documents
│   ├── embeddings/              # FAISS indices and embeddings
│   ├── processed/chunks/        # Document chunks and metadata
│   └── scripts/                 # Core processing scripts (6 total)
├── requirements.txt
└── README.md
```

## 🚀 Current Development Setup

### Prerequisites
```bash
pip install sentence-transformers faiss-cpu numpy PyPDF2 pathlib
```

### Available Components (ML Pipeline Only)

1. **Data Cleaning**:
```bash
cd ml/scripts
python data_cleaner.py
```

2. **Document Processing**:
```bash
python document_chunker.py
python embedding_generator.py
```

3. **Test RAG System**:
```bash
python rag_system_test.py
```

4. **Full System Demo**:
```bash
python rag_system_demo.py
```

> **Note**: This is currently a command-line interface. Web interface is planned for future development.

## 📊 Current Performance (ML Pipeline)

**Development Testing Results**:
- **Success Rate**: 100% (8/8 test queries)
- **Average Results per Query**: 3.0
- **Average Relevance Score**: 7.043
- **Documents Indexed**: 5,140 legal documents
- **Language Support**: Nepali (8.381 avg score), English (6.241 avg score)

> **Note**: These are development/testing metrics. Production performance may vary.

## 📚 Legal Documents Currently Processed

| Document | Language | Content | Processing Status |
|----------|----------|---------|-------------------|
| Nepal Constitution | Nepali/English | Constitutional law, fundamental rights | ✅ Processed |
| Civil Code | Nepali/English | Civil law, personal rights | ✅ Processed |
| Land Use Act | Nepali | Land regulations, property rights | ✅ Processed |
| Financial Act | Nepali | Financial regulations, banking | ✅ Processed |
| Property Tax | Nepali | Tax regulations, property assessment | ✅ Processed |

*Additional legal documents can be added by placing them in the `ml/data/raw/` directory.*

## 🔧 Technical Details

### Search Methodology
- **Keyword Search**: TF-IDF based concept matching with 51 legal concepts
- **Semantic Search**: 384-dimensional embeddings using sentence-transformers
- **Hybrid Ranking**: Combined keyword + semantic scoring with source diversity
- **Context Preservation**: Smart chunking maintains legal document structure

### Performance Optimizations
- **Chunk Size**: Optimized 300-350 characters for context balance
- **FAISS Index**: Efficient vector similarity search
- **Source Diversity**: Ensures results from multiple legal sources
- **Bilingual Processing**: Native language detection and processing

## 🧪 Testing & Development

Currently available for development testing:

- **Interactive Testing**: `rag_system_test.py` - Command-line query interface
- **System Demo**: `rag_system_demo.py` - Complete pipeline demonstration with analytics
- **Performance Analysis**: Built-in metrics tracking for development optimization

### Example Development Queries
- "What are the fundamental rights guaranteed by Nepal's Constitution?"
- "कृषि भूमिको प्रयोग सम्बन्धी नियम के छ?" (Agricultural land use regulations)
- "How is property tax calculated in Nepal?"

> **Note**: This is a development environment. Production interface is planned for future phases.

## 📈 Development Progress (September 2025)

### ✅ Completed: Core ML Pipeline
- **Data Processing**: Raw document cleaning and standardization
- **Document Chunking**: Optimized 300-350 character chunks with context preservation
- **Embedding Generation**: FAISS vector index creation for semantic search
- **Hybrid Search**: Combined keyword + semantic search implementation
- **Bilingual Support**: Native Nepali and English processing
- **System Testing**: Command-line interface for development testing
- **Code Quality**: Professional, clean codebase without unnecessary files
- **Performance Optimization**: Achieved 100% success rate in development testing

### ✅ Infrastructure Work
- **File Organization**: Clean separation of raw, cleaned, and processed data
- **Script Modularity**: 6 focused scripts, each with single responsibility
- **Data Pipeline**: Streamlined raw → cleaned → chunked → embedded → searchable
- **Documentation**: Comprehensive setup and usage instructions

## 🔄 Development Roadmap

### Phase 1: Core ML Pipeline ✅ **COMPLETED**
- [x] Document processing and cleaning
- [x] Hybrid search implementation  
- [x] Bilingual support and optimization
- [x] Development testing framework
- [x] Code organization and cleanup

### Phase 2: Web Application [PLANNED]
- [ ] FastAPI backend API development
- [ ] React frontend user interface
- [ ] Database integration for query logging
- [ ] User authentication system
- [ ] Production deployment setup

### Phase 3: Advanced Features [FUTURE]
- [ ] Real-time document updates
- [ ] Advanced legal reasoning capabilities
- [ ] Citation tracking and verification
- [ ] Multi-jurisdiction support expansion

## 🤝 Development & Contributing

This is an active development project. Current contributors can:
- Test the ML pipeline with new legal documents
- Improve search algorithms and performance
- Suggest features for the upcoming web interface
- Report issues with the current command-line system

*Web interface development will begin after core ML pipeline is fully validated.*

## 📄 License & Usage

This project is under active development for educational and research purposes. Please ensure compliance with local laws regarding legal information systems.

---

**🚧 IN DEVELOPMENT - Core ML pipeline completed, web interface coming soon**