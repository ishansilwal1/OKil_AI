# PDF Storage in PostgreSQL - Setup Guide

## Overview
This implementation stores all PDFs from the `pdfs` folder (Acts, ordinance, formats) directly in the PostgreSQL database as binary data.

## Database Schema
A new `documents` table has been created with the following structure:
- `id`: Primary key
- `filename`: Name of the PDF file
- `category`: Category (Acts, ordinance, formats)
- `file_data`: Binary PDF content (LargeBinary)
- `file_size`: File size in bytes
- `mime_type`: Content type (application/pdf)
- `created_at`: Upload timestamp
- `updated_at`: Last update timestamp

## How to Upload PDFs

### Step 1: Ensure Backend Server is Running
The database tables will be created automatically when you start the server.

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Step 2: Run the Upload Script
Open a new terminal and run:

```bash
cd backend
python -m scripts.upload_pdfs_to_db
```

This script will:
- ✅ Scan all PDF files in `pdfs/Acts/`, `pdfs/ordinance/`, and `pdfs/formats/`
- ✅ Upload each PDF to the database
- ✅ Skip duplicates (won't re-upload existing files)
- ✅ Show progress with file sizes and status

### Step 3: Verify Upload
The script will show a summary like:
```
📊 Upload Summary:
   ✅ Successfully uploaded: 45 files
   ⏭️  Skipped (duplicates): 0 files
   📦 Total processed: 45 files
```

## API Endpoints

### 1. List All Documents
```http
GET http://localhost:8000/documents
```
Returns metadata for all documents (no binary data).

### 2. Filter by Category
```http
GET http://localhost:8000/documents?category=Acts
GET http://localhost:8000/documents?category=ordinance
GET http://localhost:8000/documents?category=formats
```

### 3. Download Document by ID
```http
GET http://localhost:8000/documents/{document_id}
```
Returns the PDF file directly (opens in browser).

Example:
```http
GET http://localhost:8000/documents/1
```

### 4. Download Document by Filename
```http
GET http://localhost:8000/documents/by-filename/{filename}
```

Example:
```http
GET http://localhost:8000/documents/by-filename/contract_template.pdf
```

Optional: Add category parameter if there are duplicate filenames:
```http
GET http://localhost:8000/documents/by-filename/document.pdf?category=formats
```

### 5. Get Categories with Counts
```http
GET http://localhost:8000/documents/categories/list
```
Returns:
```json
[
  {"category": "Acts", "document_count": 15},
  {"category": "ordinance", "document_count": 20},
  {"category": "formats", "document_count": 10}
]
```

### 6. Delete Document
```http
DELETE http://localhost:8000/documents/{document_id}
```

## Frontend Integration Example

### Fetch Document List
```javascript
const API_BASE = 'http://localhost:8000';

// Get all documents
const response = await fetch(`${API_BASE}/documents`);
const documents = await response.json();

// Filter by category
const acts = await fetch(`${API_BASE}/documents?category=Acts`).then(r => r.json());
```

### Display PDF in Browser
```javascript
// Open PDF in new tab
const documentId = 1;
window.open(`${API_BASE}/documents/${documentId}`, '_blank');

// Or embed in iframe
<iframe 
  src={`${API_BASE}/documents/${documentId}`}
  width="100%" 
  height="600px"
/>
```

### Download PDF
```javascript
const downloadPDF = async (documentId, filename) => {
  const response = await fetch(`${API_BASE}/documents/${documentId}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

## Re-uploading PDFs
If you add new PDFs to the folders:
1. Just run the upload script again: `python -m scripts.upload_pdfs_to_db`
2. It will only upload new files (skips existing ones)

## Benefits of Database Storage
✅ **Fast access**: No file system lookups
✅ **Centralized**: All data in one place
✅ **Backed up**: Included in database backups
✅ **Secure**: Database-level access control
✅ **Searchable**: Easy to query by category/filename
✅ **Scalable**: Works with PostgreSQL replication

## Storage Considerations
- PDFs are stored as binary data (LargeBinary column)
- For very large PDF collections (>1GB), consider:
  - Using database compression
  - Implementing pagination for list endpoints
  - Adding caching for frequently accessed documents

## Troubleshooting

### "Module not found" error
Make sure you're in the `backend` directory when running commands.

### Upload script not finding PDFs
Check that:
- PDFs are in `pdfs/Acts/`, `pdfs/ordinance/`, `pdfs/formats/`
- File extensions are `.pdf` or `.PDF`

### Database connection error
Ensure your `.env` file has correct DATABASE_URL.

## Next Steps
Consider adding:
- Full-text search on PDF content
- PDF thumbnails
- Version control for documents
- User permissions for different categories
- Document upload API endpoint (for adding new PDFs via frontend)
