'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { STATUS_CONFIG } from '@/lib/utils'
import { SceneModal } from '../scenes/scene-modal'
import type { Topic, Scene, SceneStatus } from '@/types'

const COLUMNS: SceneStatus[] = ['not_started', 'in_progress', 'review', 'revision', 'completed', 'approved']

interface Props {
  topics: Topic[]
  onSceneUpdate: (id: string, updates: Record<string, unknown>) => void
}

export function KanbanBoard({ topics, onSceneUpdate }: Props) {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const allScenes = topics.flatMap(t => t.scenes || [])

  const getScenesByStatus = (status: SceneStatus) =>
    allScenes.filter(s => s.status === status)

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    e.dataTransfer.setData('sceneId', sceneId)
  }

  const handleDrop = (e: React.DragEvent, status: SceneStatus) => {
    e.preventDefault()
    const sceneId = e.dataTransfer.getData('sceneId')
    if (sceneId) onSceneUpdate(sceneId, { status })
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {COLUMNS.map(status => {
        const config = STATUS_CONFIG[status]
        const scenes = getScenesByStatus(status)
        return (
          <div
            key={status}
            className="flex-shrink-0 w-64"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 ${config.bg}`}>
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
              <span className={`ml-auto text-xs font-medium ${config.color} opacity-70`}>{scenes.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {scenes.map(scene => (
                <motion.div
                  key={scene.id}
                  draggable
                  onDragStart={e => handleDragStart(e, scene.id)}
                  onClick={() => setSelectedScene(scene)}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {scene.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                      <div className="bg-brand-500 h-1 rounded-full" style={{ width: `${scene.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{scene.progress}%</span>
                  </div>
                  {scene.assignments && scene.assignments.length > 0 && (
                    <div className="flex -space-x-1 mt-2">
                      {scene.assignments.slice(0, 3).map(a => (
                        <div key={a.id} className="w-5 h-5 rounded-full bg-brand-500 border border-white dark:border-gray-900 flex items-center justify-center text-[10px] text-white">
                          {(a.full_name || '?')[0]}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}

      {selectedScene && (
        <SceneModal
          scene={selectedScene}
          onUpdate={(u) => { onSceneUpdate(selectedScene.id, u); setSelectedScene({ ...selectedScene, ...u } as Scene) }}
          onClose={() => setSelectedScene(null)}
          projectId={selectedScene.project_id}
        />
      )}
    </div>
  )
}
