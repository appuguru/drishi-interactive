'use client'

import { useEffect, useState } from 'react'
import { Film, CheckCircle, Clock, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { STATUS_CONFIG, formatRelativeTime } from '@/lib/utils'
import { subscribeToProject, unsubscribe } from '@/lib/supabase/realtime'
import { buildActivityMessage } from '@/lib/utils/activity'
import type { Project, Topic, ActivityLog, SceneStatus } from '@/types'

interface Props {
  project:    Project
  topics:     Topic[]
  activity:   ActivityLog[]
  shareMode:  string
  shareToken: string   // FIX: needed for public edit API calls
}

const STATUSES: SceneStatus[] = [
  'not_started','in_progress','review','revision','completed','approved'
]

export function PublicProjectView({
  project,
  topics: initialTopics,
  activity: initialActivity,
  shareMode,
  shareToken,
}: Props) {
  const [topics,   setTopics]   = useState(initialTopics)
  const [activity, setActivity] = useState(initialActivity)

  const canEdit = shareMode === 'edit' || shareMode === 'admin'

  // Real-time subscription — live updates for all viewers
  useEffect(() => {
    const channel = subscribeToProject(project.id, (event, payload) => {
      if (event === 'scene_change') {
        const record    = (payload as any).new
        const eventType = (payload as any).eventType
        if (eventType === 'UPDATE' && record) {
          setTopics(prev => prev.map(t => ({
            ...t,
            scenes: (t.scenes || []).map(s =>
              s.id === record.id ? { ...s, ...record } : s
            ),
          })))
        }
      }
      if (event === 'activity') {
        const record = (payload as any).new
        if (record) {
          setActivity(prev => {
            if (prev.some(a => a.id === record.id)) return prev
            return [record, ...prev.slice(0, 29)]
          })
        }
      }
    })
    return () => { unsubscribe(channel) }
  }, [project.id])

  // FIX: public scene update — uses share token instead of Clerk auth
  const updateScene = async (sceneId: string, updates: Record<string, unknown>) => {
    if (!canEdit) return

    // Optimistic update
    setTopics(prev => prev.map(t => ({
      ...t,
      scenes: (t.scenes || []).map(s =>
        s.id === sceneId ? { ...s, ...updates } : s
      ),
    })))

    await fetch(`/api/public/${shareToken}/scenes/${sceneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  const allScenes  = topics.flatMap(t => t.scenes || [])
  const total      = allScenes.length
  const completed  = allScenes.filter(s => s.status === 'completed' || s.status === 'approved').length
  const inProgress = allScenes.filter(s => s.status === 'in_progress').length
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0

  const radius          = 40
  const circumference   = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">{project.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {canEdit ? '✏️ You can edit this project' : '👁 Live Production Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* FIX: show edit badge when in edit mode */}
            {canEdit && (
              <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-2 py-1 rounded-full font-medium">
                Edit Mode
              </span>
            )}
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Progress stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4 md:col-span-1">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6"
                  className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#6366f1" strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                {progress}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completed}/{total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Scenes done</p>
            </div>
          </div>
          {[
            { label: 'Total Scenes', value: total,      icon: Film,         color: 'text-gray-600'  },
            { label: 'In Progress',  value: inProgress, icon: Clock,        color: 'text-blue-600'  },
            { label: 'Completed',    value: completed,  icon: CheckCircle,  color: 'text-green-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Topics + Scenes */}
        <div className="space-y-4">
          {topics.map(topic => (
            <TopicBlock
              key={topic.id}
              topic={topic}
              canEdit={canEdit}
              onSceneUpdate={updateScene}
            />
          ))}
        </div>

        {/* Activity feed */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {activity.length === 0 && (
              <p className="text-sm text-gray-400">No activity yet</p>
            )}
            {activity.slice(0, 10).map(log => (
              <div key={log.id} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white flex-shrink-0">
                  {(log.user_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {buildActivityMessage(log)}
                  </p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Topic block with collapsible scenes ──────────────────────────────────────
function TopicBlock({
  topic,
  canEdit,
  onSceneUpdate,
}: {
  topic: Topic
  canEdit: boolean
  onSceneUpdate: (id: string, updates: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const scenes    = topic.scenes || []
  const done      = scenes.filter(s => s.status === 'completed' || s.status === 'approved').length
  const pct       = scenes.length > 0 ? Math.round((done / scenes.length) * 100) : 0

  return (
    <div className="card overflow-hidden">
      {/* Topic header */}
      <div
        className="flex items-center gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: topic.color || '#6366f1' }} />
        {expanded
          ? <ChevronDown  className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">
          {topic.title}
        </span>
        <span className="text-xs text-gray-500">{done}/{scenes.length}</span>
        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
          {pct}%
        </span>
      </div>

      {/* Scenes */}
      {expanded && (
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {scenes.map(scene => {
            const config = STATUS_CONFIG[scene.status as SceneStatus]
            return (
              <div key={scene.id} className="flex items-center gap-3 px-5 py-3 pl-10 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {scene.title}
                </span>

                {/* FIX: editable progress slider when canEdit */}
                <div className="flex items-center gap-2 w-32">
                  {canEdit ? (
                    <input
                      type="range"
                      min={0} max={100}
                      value={scene.progress}
                      onChange={e => onSceneUpdate(scene.id, { progress: Number(e.target.value) })}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 h-1.5 accent-brand-500 cursor-pointer"
                    />
                  ) : (
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${scene.progress}%` }} />
                    </div>
                  )}
                  <span className="text-xs text-gray-400 w-7 text-right flex-shrink-0">
                    {scene.progress}%
                  </span>
                </div>

                {/* FIX: editable status dropdown when canEdit */}
                {canEdit ? (
                  <select
                    value={scene.status}
                    onChange={e => onSceneUpdate(scene.id, { status: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer font-medium ${config.bg} ${config.color}`}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}