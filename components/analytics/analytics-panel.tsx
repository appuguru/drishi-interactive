'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { STATUS_CONFIG } from '@/lib/utils'
import type { Topic, ProjectMember, Project, SceneStatus } from '@/types'

interface Props {
  topics: Topic[]
  members: ProjectMember[]
  project: Project
}

const STATUS_COLORS: Record<SceneStatus, string> = {
  not_started: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#a855f7',
  revision: '#f97316',
  completed: '#22c55e',
  approved: '#14b8a6',
}

export function AnalyticsPanel({ topics, members, project }: Props) {

  const allScenes = useMemo(() => topics.flatMap(t => t.scenes || []), [topics])

  const statusData = useMemo(() => {
    const counts: Partial<Record<SceneStatus, number>> = {}
    allScenes.forEach(scene => {
      counts[scene.status] = (counts[scene.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => {
      const typedStatus = status as SceneStatus
      return {
        name: STATUS_CONFIG[typedStatus]?.label || status,
        value: count || 0,
        color: STATUS_COLORS[typedStatus],
      }
    })
  }, [allScenes])

  const topicData = useMemo(() =>
    topics.map(topic => {
      const scenes = topic.scenes || []
      const completed = scenes.filter(s => s.status === 'completed' || s.status === 'approved').length
      const total = scenes.length
      return {
        name: topic.title.length > 15 ? topic.title.slice(0, 15) + '…' : topic.title,
        completed,
        remaining: total - completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    }), [topics])

  const stats = useMemo(() => ({
    total: allScenes.length,
    completed: allScenes.filter(s => s.status === 'completed' || s.status === 'approved').length,
    inProgress: allScenes.filter(s => s.status === 'in_progress').length,
    notStarted: allScenes.filter(s => s.status === 'not_started').length,
    review: allScenes.filter(s => s.status === 'review' || s.status === 'revision').length,
    avgProgress: allScenes.length > 0
      ? Math.round(allScenes.reduce((sum, scene) => sum + scene.progress, 0) / allScenes.length)
      : 0,
  }), [allScenes])

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Scenes', value: stats.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600 dark:text-green-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'text-brand-600 dark:text-brand-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No scenes yet</div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Topic Progress</h3>
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" domain={[0, 'dataMax']} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" stackId="a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="remaining" fill="#e2e8f0" name="Remaining" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No topics yet</div>
          )}
        </div>

      </div>

      {members.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Team Members</h3>
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-sm text-white font-medium flex-shrink-0">
                  {(member.full_name || member.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {member.full_name || member.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}