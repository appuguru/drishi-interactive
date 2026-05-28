'use client'

import { useEffect, useState } from 'react'
import { Film, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { STATUS_CONFIG, formatRelativeTime } from '@/lib/utils'
import { subscribeToProject, unsubscribe } from '@/lib/supabase/realtime'
import { buildActivityMessage } from '@/lib/utils/activity'
import type { Project, Topic, ActivityLog, SceneStatus } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Props {
  project: Project
  topics: Topic[]
  activity: ActivityLog[]
  shareMode: string
}

export function PublicProjectView({ project, topics: initialTopics, activity: initialActivity, shareMode }: Props) {
  const [topics, setTopics] = useState(initialTopics)
  const [activity, setActivity] = useState(initialActivity)

  useEffect(() => {
    const channel = subscribeToProject(project.id, (event, payload) => {
      if (event === 'scene_change') {
        const record = (payload as any).new
        if (record) setTopics(prev => prev.map(t => ({
          ...t,
          scenes: (t.scenes || []).map(s => s.id === record.id ? { ...s, ...record } : s),
        })))
      }
      if (event === 'activity') {
        const record = (payload as any).new
        if (record) setActivity(prev => [record, ...prev.slice(0, 29)])
      }
    })
    return () => { unsubscribe(channel) }
  }, [project.id])

  const allScenes = topics.flatMap(t => t.scenes || [])
  const total = allScenes.length
  const completed = allScenes.filter(s => s.status === 'completed' || s.status === 'approved').length
  const inProgress = allScenes.filter(s => s.status === 'in_progress').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const radius = 40
  const circumference = 2 * Math.PI * radius
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Live Production Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Progress overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4 md:col-span-1">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6" className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#6366f1" strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">{progress}%</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completed}/{total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Scenes done</p>
            </div>
          </div>
          {[
            { label: 'Total Scenes', value: total, icon: Film, color: 'text-gray-600' },
            { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-blue-600' },
            { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Topics */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Production Overview</h2>
          </div>
          {topics.map(topic => {
            const scenes = topic.scenes || []
            const done = scenes.filter(s => s.status === 'completed' || s.status === 'approved').length
            const pct = scenes.length > 0 ? Math.round((done / scenes.length) * 100) : 0
            return (
              <div key={topic.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: topic.color || '#6366f1' }} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{topic.title}</span>
                  <span className="text-xs text-gray-500">{done}/{scenes.length}</span>
                  <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">{pct}%</span>
                </div>
                {scenes.map(scene => {
                  const config = STATUS_CONFIG[scene.status as SceneStatus]
                  return (
                    <div key={scene.id} className="flex items-center gap-3 px-5 py-2 pl-10">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{scene.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                      <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                        <div className="bg-brand-500 h-1 rounded-full" style={{ width: `${scene.progress}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Activity */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity.slice(0, 10).map(log => (
              <div key={log.id} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white flex-shrink-0">
                  {(log.user_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{buildActivityMessage(log)}</p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(log.created_at)}</p>
                </div>
              </div>
            ))}
            {activity.length === 0 && <p className="text-sm text-gray-400">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
