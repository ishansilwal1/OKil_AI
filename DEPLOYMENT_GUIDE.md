# OKIL AI - Google Cloud Deployment Guide

## 🚀 Deploy to Google Cloud Run with Auto-Updates

### Prerequisites
1. Google Cloud account (Free $300 credit for new users)
2. GitHub repository (you have: OKil_AI)
3. Google Cloud SDK installed

---

## 📦 Part 1: Prepare Your Code

### 1. Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY ./app ./app

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile** (`frontend/okil-ai/Dockerfile`):
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf** (`frontend/okil-ai/nginx.conf`):
```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Create docker-compose.yml (for local testing)

**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/okil_ai_db
      - Groq_API_KEY=${GROQ_API_KEY}
    depends_on:
      - db
    volumes:
      - ./ml:/app/ml

  frontend:
    build: ./frontend/okil-ai
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=okil_ai_db
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## ☁️ Part 2: Google Cloud Setup

### 1. Install Google Cloud SDK

**Windows:**
```powershell
# Download and install from:
# https://cloud.google.com/sdk/docs/install

# After installation, initialize:
gcloud init
```

### 2. Create Google Cloud Project

```bash
# Login
gcloud auth login

# Create project
gcloud projects create okil-ai-prod --name="OKIL AI Production"

# Set as active project
gcloud config set project okil-ai-prod

# Enable required APIs
gcloud services enable \
    run.googleapis.com \
    sql-component.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com
```

### 3. Create Cloud SQL PostgreSQL Database

```bash
# Create database instance
gcloud sql instances create okil-ai-db \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create okil_ai_db \
    --instance=okil-ai-db

# Create user
gcloud sql users create appuser \
    --instance=okil-ai-db \
    --password=YOUR_APP_PASSWORD
```

### 4. Store Secrets

```bash
# Store database password
echo -n "postgresql://appuser:YOUR_APP_PASSWORD@/okil_ai_db?host=/cloudsql/okil-ai-prod:us-central1:okil-ai-db" | \
    gcloud secrets create DATABASE_URL --data-file=-

# Store Groq API key
echo -n "YOUR_GROQ_API_KEY" | \
    gcloud secrets create GROQ_API_KEY --data-file=-
```

---

## 🔄 Part 3: Auto-Deploy Setup

### 1. Create Cloud Build Configuration

**`cloudbuild.yaml`** (in root directory):
```yaml
steps:
  # Build Backend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/okil-backend:$COMMIT_SHA'
      - './backend'
    id: 'build-backend'

  # Build Frontend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/okil-frontend:$COMMIT_SHA'
      - './frontend/okil-ai'
    id: 'build-frontend'

  # Push Backend Image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/okil-backend:$COMMIT_SHA'
    id: 'push-backend'

  # Push Frontend Image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/okil-frontend:$COMMIT_SHA'
    id: 'push-frontend'

  # Deploy Backend to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'okil-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/okil-backend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--add-cloudsql-instances'
      - 'okil-ai-prod:us-central1:okil-ai-db'
      - '--update-secrets'
      - 'DATABASE_URL=DATABASE_URL:latest,GROQ_API_KEY=GROQ_API_KEY:latest'
    id: 'deploy-backend'

  # Deploy Frontend to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'okil-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/okil-frontend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
    id: 'deploy-frontend'

images:
  - 'gcr.io/$PROJECT_ID/okil-backend:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/okil-frontend:$COMMIT_SHA'

options:
  machineType: 'E2_HIGHCPU_8'
```

### 2. Connect GitHub to Cloud Build

```bash
# Connect your GitHub repository
gcloud builds triggers create github \
    --name="okil-ai-deploy" \
    --repo-name="OKil_AI" \
    --repo-owner="ishansilwal1" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml"
```

---

## 🎯 Part 4: First Deployment

### Manual Deploy (First Time)

```bash
# Build and deploy backend
cd backend
gcloud builds submit --tag gcr.io/okil-ai-prod/okil-backend
gcloud run deploy okil-backend \
    --image gcr.io/okil-ai-prod/okil-backend \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --add-cloudsql-instances okil-ai-prod:us-central1:okil-ai-db \
    --update-secrets DATABASE_URL=DATABASE_URL:latest,GROQ_API_KEY=GROQ_API_KEY:latest

# Build and deploy frontend
cd ../frontend/okil-ai
gcloud builds submit --tag gcr.io/okil-ai-prod/okil-frontend
gcloud run deploy okil-frontend \
    --image gcr.io/okil-ai-prod/okil-frontend \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated
```

---

## ✨ Part 5: Auto-Deploy is Active!

**Now every time you push to GitHub main branch:**

```bash
git add .
git commit -m "Update features"
git push origin main
```

**What happens automatically:**
1. ✅ Cloud Build detects push
2. ✅ Builds Docker images
3. ✅ Runs tests (if configured)
4. ✅ Deploys to Cloud Run
5. ✅ Updates live site
6. ✅ Zero downtime deployment

**Your app will be live at:**
- Backend: `https://okil-backend-xxxxx.run.app`
- Frontend: `https://okil-frontend-xxxxx.run.app`

---

## 💰 Cost Estimate

**For low traffic (~1000 requests/day):**
- Cloud Run Backend: ~$5/month
- Cloud Run Frontend: ~$3/month
- Cloud SQL (f1-micro): ~$10/month
- **Total: ~$18/month**

**Free tier includes:**
- 2 million requests/month (Cloud Run)
- 180 hours/month (Cloud SQL)

---

## 🔧 Update Environment Variables

```bash
# Update secrets anytime
echo -n "NEW_API_KEY" | gcloud secrets versions add GROQ_API_KEY --data-file=-

# Redeploy to use new secrets
gcloud run services update okil-backend --region us-central1
```

---

## 📊 Monitor Your App

```bash
# View logs
gcloud run services logs read okil-backend --region us-central1

# View metrics
gcloud run services describe okil-backend --region us-central1
```

---

## 🎉 Done!

Your app is now:
- ✅ Live on Google Cloud
- ✅ Auto-deploys on git push
- ✅ Scales automatically
- ✅ Has managed database
- ✅ SSL/HTTPS enabled
- ✅ Global CDN

