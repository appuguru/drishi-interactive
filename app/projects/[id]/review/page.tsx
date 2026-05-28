'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, Plus, Trash2, GripVertical,
  Check, Loader2, Eye, Edit3, Save
} from 'lucide-react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AIGeneratedStructure, AITopic, AIScene } from '@/types'

interface ReviewPageProps {
  params: { id: string }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter()
  const { user } = useUser()
  const [project, setProject] = useState<{ id: string; title: string; script_raw_text: string; ai_generated_structure: AIGeneratedStructure } | null>(null)
  const [structure, setStructure] = useState<AIGeneratedStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [approved, setApproved] = useState(false)
  const [activeView, setActiveView] = useState<'split' | 'preview'>('split')

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setProject(data)
        setStructure(JSON.parse(JSON.stringify(data.ai_generated_structure)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const updateTopic = (ti: number, updates: Partial<AITopic>) => {
    if (!structure) return
    const topics = [...structure.topics]
    topics[ti] = { ...topics[ti], ...updates }
    setStructure({ ...structure, topics })
  }

  const updateScene = (ti: number, si: number, updates: Partial<AIScene>) => {
    if (!structure) return
    const topics = [...structure.topics]
    topics[ti].scenes[si] = { ...topics[ti].scenes[si], ...updates }
    setStructure({ ...structure, topics })
  }

  const addTopic = () => {
    if (!structure) return
    setStructure({
      ...structure,
      topics: [...structure.topics, { title: 'New Section', description: '', scenes: [] }],
    })
  }

  const deleteTopic = (ti: number) => {
    if (!structure) return
    setStructure({ ...structure, topics: structure.topics.filter((_, i) => i !== ti) })
  }

  const addScene = (ti: number) => {
    if (!structure) return
    const topics = [...structure.topics]
    topics[ti].scenes.push({
      title: `Scene ${topics[ti].scenes.length + 1}`,
      description: '',
      script_text: '',
      characters: [],
      estimated_duration_seconds: 30,
      complexity: 'medium',
      suggested_tasks: ['Storyboard', 'Animation', 'Sound Design'],
    })
    setStructure({ ...structure, topics })
  }

  const deleteScene = (ti: number, si: number) => {
    if (!structure) return
    const topics = [...structure.topics]
    topics[ti].scenes = topics[ti].scenes.filter((_, i) => i !== si)
    setStructure({ ...structure, topics })
  }

  const handlePublish = async () => {
    if (!structure || !user) return
    setPublishing(true)
    try {
      const res = await fetch('/api/scripts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id, structure }),
      })
      if (!res.ok) throw new Error('Publish failed')
      router.push(`/projects/${params.id}`)
    } catch (e) {
      alert('Failed to publish. Please try again.')
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!project || !structure) {
    return <div className="p-8 text-red-500">Project not found</div>
  }

  const totalScenes = structure.topics.reduce((s, t) => s + t.scenes.length, 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">AI Review Mode</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {structure.topics.length} topics · {totalScenes} scenes detected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
            {(['split', 'preview'] as const).map(v => (
              <button key={v} onClick={() => setActiveView(v)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all capitalize ${activeView === v ? 'bg-brand-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {v === 'split' ? <><Edit3 className="w-3.5 h-3.5 inline mr-1.5" />Edit</> : <><Eye className="w-3.5 h-3.5 inline mr-1.5" />Preview</>}
              </button>
            ))}
          </div>
          {!approved ? (
            <button
              onClick={() => setApproved(true)}
              className="btn-primary bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              Approve Structure
            </button>
          ) : (
            <button onClick={handlePublish} disabled={publishing} className="btn-primary">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {publishing ? 'Publishing...' : 'Publish Dashboard'}
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Script */}
        {activeView === 'split' && (
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Original Script
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Read-only source</p>
            </div>
            <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {project.script_raw_text}
            </pre>
          </div>
        )}

        {/* Right: Editable structure */}
        <div className={`${activeView === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto p-6`}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              AI Generated Structure
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Click any text to edit</p>
          </div>

          {/* Project title */}
          <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Project Title</label>
            <input
              value={structure.project_title}
              onChange={e => setStructure({ ...structure, project_title: e.target.value })}
              className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Topics */}
          <div className="space-y-4">
            {structure.topics.map((topic, ti) => (
              <TopicEditor
                key={ti}
                topic={topic}
                topicIndex={ti}
                onUpdate={(updates) => updateTopic(ti, updates)}
                onDelete={() => deleteTopic(ti)}
                onUpdateScene={(si, updates) => updateScene(ti, si, updates)}
                onDeleteScene={(si) => deleteScene(ti, si)}
                onAddScene={() => addScene(ti)}
              />
            ))}
          </div>

          <button onClick={addTopic} className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </div>
      </div>

      {/* Approve banner */}
      <AnimatePresence>
        {approved && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50"
          >
            <Check className="w-5 h-5" />
            Structure approved! Click "Publish Dashboard" to finalize.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopicEditor({ topic, topicIndex, onUpdate, onDelete, onUpdateScene, onDeleteScene, onAddScene }: {
  topic: AITopic
  topicIndex: number
  onUpdate: (u: Partial<AITopic>) => void
  onDelete: () => void
  onUpdateScene: (si: number, u: Partial<AIScene>) => void
  onDeleteScene: (si: number) => void
  onAddScene: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-3 h-3 rounded-full bg-brand-500" />
        <input
          value={topic.title}
          onChange={e => onUpdate({ title: e.target.value })}
          className="flex-1 font-semibold text-gray-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-brand-500 transition-colors"
        />
        <span className="text-xs text-gray-400 px-2">{topic.scenes.length} scenes</span>
        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-2">
          {topic.scenes.map((scene, si) => (
            <div key={si} className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-800">
              <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  value={scene.title}
                  onChange={e => onUpdateScene(si, { title: e.target.value })}
                  className="w-full font-medium text-sm text-gray-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-brand-500 transition-colors mb-1"
                />
                <input
                  value={scene.description}
                  onChange={e => onUpdateScene(si, { description: e.target.value })}
                  className="w-full text-xs text-gray-500 dark:text-gray-400 bg-transparent outline-none border-b border-transparent focus:border-brand-500 transition-colors"
                  placeholder="Scene description..."
                />
              </div>
              <button onClick={() => onDeleteScene(si)} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button onClick={onAddScene} className="w-full py-2 text-xs text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" />
            Add Scene
          </button>
        </div>
      )}
    </div>
  )
}
