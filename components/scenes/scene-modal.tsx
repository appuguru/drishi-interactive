'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, MessageSquare, CheckSquare, Plus, Trash2, Check } from 'lucide-react'
import { InlineEdit } from '../editor/inline-edit'
import { StatusBadge } from '../ui/status-badge'
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDateTime } from '@/lib/utils'
import type { Scene, SceneStatus, Priority, Task, Comment } from '@/types'

const STATUSES: SceneStatus[] = ['not_started', 'in_progress', 'review', 'revision', 'completed', 'approved']
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical']

interface Props {
  scene: Scene
  onUpdate: (updates: Record<string, unknown>) => void
  onClose: () => void
  projectId: string
}

export function SceneModal({ scene, onUpdate, onClose, projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>(scene.tasks || [])
  const [comments, setComments] = useState<Comment[]>(scene.comments || [])
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'comments'>('details')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    // Load comments
    fetch(`/api/scenes/${scene.id}/comments`)
      .then(r => r.json())
      .then(data => setComments(data || []))
      .catch(() => {})
  }, [scene.id])

  const addTask = async () => {
    const res = await fetch(`/api/scenes/${scene.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Task', scene_id: scene.id, project_id: projectId }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [...prev, task])
    }
  }

  const updateTask = async (taskId: string, updates: Record<string, unknown>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const res = await fetch(`/api/scenes/${scene.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment, project_id: projectId }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments(prev => [...prev, comment])
      setNewComment('')
    }
    setSubmittingComment(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-0 pr-4">
            <InlineEdit
              value={scene.title}
              onSave={(v) => onUpdate({ title: v })}
              className="text-lg font-bold text-gray-900 dark:text-white"
              placeholder="Scene title"
            />
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-6">
          {(['details', 'tasks', 'comments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
              {tab === 'tasks' && tasks.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === 'done').length}/{tasks.length}
                </span>
              )}
              {tab === 'comments' && comments.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Status + Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Status</label>
                  <select
                    value={scene.status}
                    onChange={e => onUpdate({ status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-brand-500"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Priority</label>
                  <select
                    value={scene.priority}
                    onChange={e => onUpdate({ priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-brand-500"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{PRIORITY_CONFIG[p].label}</option>)}
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Progress — {scene.progress}%</label>
                <input
                  type="range" min={0} max={100} value={scene.progress}
                  onChange={e => onUpdate({ progress: Number(e.target.value) })}
                  className="w-full accent-brand-500"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Deadline</label>
                <input
                  type="datetime-local"
                  value={scene.deadline ? new Date(scene.deadline).toISOString().slice(0,16) : ''}
                  onChange={e => onUpdate({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Description</label>
                <InlineEdit
                  value={scene.description || ''}
                  onSave={(v) => onUpdate({ description: v })}
                  multiline
                  className="text-sm text-gray-700 dark:text-gray-300 min-h-[60px]"
                  placeholder="Add a description..."
                />
              </div>

              {/* Script Text */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Script / Notes</label>
                <InlineEdit
                  value={scene.script_text || ''}
                  onSave={(v) => onUpdate({ script_text: v })}
                  multiline
                  className="text-sm font-mono text-gray-700 dark:text-gray-300 min-h-[100px]"
                  placeholder="Scene script text..."
                />
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                  <button
                    onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {task.status === 'done' && <Check className="w-3 h-3" />}
                  </button>
                  <InlineEdit
                    value={task.title}
                    onSave={(v) => updateTask(task.id, { title: v })}
                    className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
                    placeholder="Task title"
                  />
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addTask} className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />Add Task
              </button>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                    {(c.author_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.author_name || 'User'}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500"
                />
                <button onClick={submitComment} disabled={submittingComment || !newComment.trim()} className="btn-primary py-2 text-sm px-3 disabled:opacity-50">
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
