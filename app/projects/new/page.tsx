'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Upload, FileText, Loader2, ChevronRight, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  'Uploading script...',
  'Reading content...',
  'Identifying structure...',
  'Generating scenes...',
  'Building tasks...',
  'Ready for review ✓',
]

export default function NewProjectPage() {
  const router = useRouter()
  const { user } = useUser()
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState('')
  const [projectTitle, setProjectTitle] = useState('')

  const handleFile = (f: File) => {
    const allowed = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(f.type) && !f.name.match(/\.(txt|pdf|docx)$/i)) {
      setError('Please upload a TXT, PDF, or DOCX file')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB')
      return
    }
    setFile(f)
    setError('')
    if (!projectTitle) setProjectTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleProcess = async () => {
    if (!file || !user) return
    setIsProcessing(true)
    setError('')

    try {
      // Progress simulation while API processes
      let stageIdx = 0
      const progressInterval = setInterval(() => {
        stageIdx = Math.min(stageIdx + 1, STAGES.length - 2)
        setStage(stageIdx)
      }, 3000)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', projectTitle || file.name.replace(/\.[^.]+$/, ''))
      formData.append('clerkId', user.id)

      const res = await fetch('/api/scripts/analyze', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Analysis failed')
      }

      const { projectId } = await res.json()
      setStage(STAGES.length - 1)

      setTimeout(() => {
        router.push(`/projects/${projectId}/review`)
      }, 1000)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setIsProcessing(false)
      setStage(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Project</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload a script and let AI generate your production dashboard</p>
        </div>

        {/* Project title */}
        <div className="card p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Title
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            placeholder="My Animation Project"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500 transition-colors text-gray-900 dark:text-white"
          />
        </div>

        {/* Upload area */}
        <div className="card p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Script File
          </label>

          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                Drop your script here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Supports TXT, PDF, DOCX • Max 50MB
              </p>
              <input
                id="file-input"
                type="file"
                accept=".txt,.pdf,.docx"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
              >
                Change
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Processing state */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {STAGES[stage]}
                </span>
              </div>
              <div className="space-y-2">
                {STAGES.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < stage ? 'bg-green-500' :
                      i === stage ? 'bg-brand-500 animate-pulse' :
                      'bg-gray-200 dark:bg-gray-700'
                    }`} />
                    <span className={`text-sm ${
                      i <= stage ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                    }`}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        {!isProcessing && (
          <button
            onClick={handleProcess}
            disabled={!file || !projectTitle.trim()}
            className="w-full btn-primary justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            Analyze Script with AI
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        )}
      </div>
    </div>
  )
}
