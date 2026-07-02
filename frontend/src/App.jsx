import { useState, useEffect, useRef } from 'react'
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
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchDocuments() }, [])

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`)
      setDocuments(res.data.documents)
    } catch {}
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`${API_URL}/upload`, formData)
      setUploadResult({ success: true, message: `${res.data.doc_id} uploaded — ${res.data.chunks_ingested} chunks indexed` })
      setFile(null)
      fetchDocuments()
    } catch {
      setUploadResult({ success: false, message: 'Upload failed. Please try again.' })
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
    } catch {
      setAnswer({ error: 'Query failed. Please try again.' })
    } finally {
      setQuerying(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.pdf')) setFile(dropped)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span className="logo-text">DocuQuery</span>
        </div>
        <p className="tagline">Multilingual document Q&A — powered by RAG + Gemini</p>
      </header>

      <div className="main-grid">
        <div className="left-col">
          <section className="card upload-card">
            <div className="card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <h2>Upload document</h2>
            </div>
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
              {file ? (
                <div className="file-selected">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>{file.name}</span>
                </div>
              ) : (
                <div className="drop-hint">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p>Drop a PDF here or <span className="link">browse</span></p>
                  <p className="hint-sub">English and Turkish supported</p>
                </div>
              )}
            </div>
            <button className="btn-primary" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? <span className="spinner"/> : null}
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
            {uploadResult && (
              <div className={`result-msg ${uploadResult.success ? 'success' : 'error'}`}>
                {uploadResult.success ? '✓' : '✗'} {uploadResult.message}
              </div>
            )}
          </section>

          <section className="card docs-card">
            <div className="card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <h2>Documents <span className="badge">{documents.length}</span></h2>
            </div>
            {documents.length === 0 ? (
              <p className="empty-state">No documents uploaded yet</p>
            ) : (
              <ul className="doc-list">
                {documents.map((doc, i) => (
                  <li key={i} className="doc-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {doc}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="card query-card">
          <div className="card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h2>Ask a question</h2>
          </div>
          <p className="card-subtitle">Ask in English or Turkish — the answer will match your language</p>

          <div className="query-examples">
            {['How many days of annual leave?', 'Yıllık izin hakkı kaç gündür?', 'What is the remote work policy?'].map(q => (
              <button key={q} className="example-chip" onClick={() => setQuestion(q)}>{q}</button>
            ))}
          </div>

          <div className="textarea-wrap">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleQuery() }}
              placeholder="Type your question here..."
              rows={4}
            />
            <span className="shortcut-hint">⌘↵ to send</span>
          </div>

          <button className="btn-primary" onClick={handleQuery} disabled={!question.trim() || querying}>
            {querying ? <span className="spinner"/> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
            {querying ? 'Thinking...' : 'Ask'}
          </button>

          {querying && (
            <div className="thinking-box">
              <div className="thinking-dots"><span/><span/><span/></div>
              <span>Searching documents and generating answer...</span>
            </div>
          )}

          {answer && !answer.error && (
            <div className="answer-box">
              <div className="answer-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Answer
              </div>
              <p className="answer-text">{answer.answer}</p>
              <div className="sources-row">
                <span className="sources-label">Sources:</span>
                {answer.sources.map((s, i) => <span key={i} className="source-chip">{s}</span>)}
              </div>
            </div>
          )}

          {answer?.error && (
            <div className="result-msg error">✗ {answer.error}</div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
