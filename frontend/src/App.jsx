import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [querying, setQuerying] = useState(false)
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`)
      setDocuments(res.data.documents)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`${API_URL}/upload`, formData)
      setUploadResult({ success: true, message: `✅ ${res.data.doc_id} uploaded — ${res.data.chunks_ingested} chunks` })
      fetchDocuments()
    } catch (err) {
      setUploadResult({ success: false, message: '❌ Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const handleQuery = async () => {
    if (!question.trim()) return
    setQuerying(true)
    setAnswer(null)
    try {
      const res = await axios.post(`${API_URL}/query`, { question })
      setAnswer(res.data)
    } catch (err) {
      setAnswer({ error: 'Query failed. Please try again.' })
    } finally {
      setQuerying(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>DocuQuery</h1>
        <p>Multilingual Document Q&A — powered by RAG + Google Gemini</p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Upload Document</h2>
          <p className="subtitle">PDF files only — English and Turkish supported</p>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files[0])}
            className="file-input"
          />
          <button onClick={handleUpload} disabled={!file || uploading} className="btn">
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
          {uploadResult && (
            <p className={uploadResult.success ? 'success' : 'error'}>{uploadResult.message}</p>
          )}
        </section>

        <section className="card">
          <h2>Uploaded Documents</h2>
          {documents.length === 0 ? (
            <p className="subtitle">No documents uploaded yet.</p>
          ) : (
            <ul className="doc-list">
              {documents.map((doc, i) => (
                <li key={i}>📄 {doc}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card query-card">
        <h2>Ask a Question</h2>
        <p className="subtitle">Ask in English or Turkish — the answer will match your language</p>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="e.g. How many days of annual leave do employees get? / Yıllık izin hakkı kaç gündür?"
          rows={3}
        />
        <button onClick={handleQuery} disabled={!question.trim() || querying} className="btn">
          {querying ? 'Thinking...' : 'Ask'}
        </button>

        {answer && !answer.error && (
          <div className="answer-box">
            <p className="answer-text">{answer.answer}</p>
            <p className="sources">Sources: {answer.sources.join(', ')}</p>
          </div>
        )}
        {answer?.error && <p className="error">{answer.error}</p>}
      </section>
    </div>
  )
}

export default App
