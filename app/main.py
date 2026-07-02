import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.rag_pipeline import DocumentRAGPipeline

app = FastAPI(
    title="DocuQuery API",
    description="Multilingual Document Q&A System using RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = DocumentRAGPipeline()

UPLOAD_DIR = "app/data/uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class QueryRequest(BaseModel):
    question: str
    top_k: int = 3


class QueryResponse(BaseModel):
    answer: str
    sources: list[str]


@app.get("/")
def root():
    return {"message": "DocuQuery API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc_id = file.filename.replace(".pdf", "").replace(" ", "_")
    chunks_count = pipeline.ingest_pdf(file_path, doc_id)

    return {
        "message": "PDF uploaded and processed successfully",
        "doc_id": doc_id,
        "chunks_ingested": chunks_count
    }


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = pipeline.answer_question(request.question, top_k=request.top_k)
    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"]
    )


@app.get("/documents")
def list_documents():
    files = os.listdir(UPLOAD_DIR)
    pdfs = [f for f in files if f.endswith(".pdf")]
    return {"documents": pdfs, "count": len(pdfs)}
