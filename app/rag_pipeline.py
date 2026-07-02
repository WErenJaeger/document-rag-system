import os
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
import google.generativeai as genai

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

class DocumentRAGPipeline:
    def __init__(self, chroma_path="app/chroma_db", google_api_key=None):
        print("Loading embedding model...")
        self.embedder = SentenceTransformer(EMBEDDING_MODEL)
        
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
        
        api_key = google_api_key or os.environ.get("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        print("Pipeline ready.")

    def extract_text_from_pdf(self, pdf_path):
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    def chunk_text(self, text, chunk_size=500, overlap=50):
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap
        return chunks

    def ingest_pdf(self, pdf_path, doc_id):
        print(f"Processing {pdf_path}...")
        text = self.extract_text_from_pdf(pdf_path)
        chunks = self.chunk_text(text)

        embeddings = self.embedder.encode(chunks).tolist()
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"source": doc_id, "chunk_index": i} for i in range(len(chunks))]

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )
        print(f"Ingested {len(chunks)} chunks from {doc_id}")
        return len(chunks)

    def retrieve_relevant_chunks(self, query, top_k=3):
        query_embedding = self.embedder.encode([query]).tolist()
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k
        )
        return results['documents'][0], results['metadatas'][0]

    def answer_question(self, question, top_k=3):
        chunks, metadatas = self.retrieve_relevant_chunks(question, top_k=top_k)
        context = "\n\n---\n\n".join(chunks)

        prompt = f"""You are a helpful assistant answering questions based on the provided document excerpts.
Answer in the same language as the question. If the answer isn't in the provided context, say so clearly.

Document excerpts:
{context}

Question: {question}

Answer:"""

        response = self.model.generate_content(prompt)

        return {
            "answer": response.text,
            "sources": [m["source"] for m in metadatas]
        }
