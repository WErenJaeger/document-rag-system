# Document RAG System

**Multilingual Retrieval-Augmented Generation (RAG) system** for intelligent document Q&A, supporting both English and Turkish. Built with FastAPI, ChromaDB, Google Gemini, Docker, and Kubernetes.

## Overview

Upload PDF documents and ask natural language questions about their content — in English or Turkish. The system retrieves the most relevant document sections and generates accurate, context-aware answers using Google Gemini.

## Architecture
PDF Upload → Text Extraction → Chunking → Multilingual Embedding → ChromaDB
↓
User Question → Embedding → Vector Search → Context Retrieval → Gemini API → Answer

## Tech Stack

| Layer | Technology |
|---|---|
| **API** | FastAPI, Uvicorn |
| **PDF Processing** | pypdf |
| **Embeddings** | sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`) |
| **Vector Database** | ChromaDB |
| **LLM** | Google Gemini 2.5 Flash-Lite (free tier) |
| **MLOps** | MLflow (experiment tracking) |
| **Containerization** | Docker (multi-stage build) |
| **Orchestration** | Kubernetes (Minikube) |

## Features

- **Multilingual support**: Processes and answers in both English and Turkish
- **REST API**: 5 endpoints with auto-generated Swagger documentation
- **Experiment tracking**: MLflow logs all pipeline runs, ingestion metrics, and query parameters
- **Production-ready**: Containerized with Docker, deployed on Kubernetes with health checks, resource limits, and liveness/readiness probes

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root |
| GET | `/health` | Health check |
| POST | `/upload` | Upload and process a PDF |
| POST | `/query` | Ask a question about uploaded documents |
| GET | `/documents` | List uploaded documents |

## Quick Start

### Local Development

```bash
git clone https://github.com/WErenJaeger/document-rag-system.git
cd document-rag-system
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GOOGLE_API_KEY="your-api-key"
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
docker build -t docuquery:latest .
docker run -p 8000:8000 -e GOOGLE_API_KEY="your-api-key" docuquery:latest
```

### Kubernetes (Minikube)

```bash
minikube start --driver=docker --memory=4096 --cpus=2
kubectl create secret generic docuquery-secrets --from-literal=google-api-key="your-api-key"
minikube image load docuquery:latest
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
minikube service docuquery-service --url
```

## MLflow Tracking

```bash
mlflow ui --host 127.0.0.1 --port 5001
```

Open `http://127.0.0.1:5001` to view experiment runs, parameters, and metrics.

## Example Usage

```bash
# Upload a document
curl -X POST http://localhost:8000/upload -F "file=@document.pdf"

# Ask a question (English)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How many days of annual leave do employees get?"}'

# Ask a question (Turkish)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Uzaktan çalışma politikası nedir?"}'
```

## Sample Output

```json
{
  "answer": "Employees are entitled to 14 days of paid annual leave per year for the first 5 years of employment. After 5 years of service, this increases to 20 days per year.",
  "sources": ["hr_policy_en", "hr_policy_tr"]
}
```

## Author

[GitHub - WErenJaeger](https://github.com/WErenJaeger)
