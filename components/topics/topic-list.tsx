'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  MoreHorizontal,
  GripVertical,
  Loader2,
} from 'lucide-react'

import { SceneCard } from '../scenes/scene-card'
import { InlineEdit } from '../editor/inline-edit'
import { cn, TOPIC_COLORS } from '@/lib/utils'
import type { Topic } from '@/types'

interface Props {
  topics: Topic[]
  onTopicUpdate: (
    id: string,
    updates: Record<string, unknown>
  ) => void

  onSceneUpdate: (
    id: string,
    updates: Record<string, unknown>
  ) => void

  onAddScene: (
    topicId: string
  ) => void

  onDeleteTopic: (
    id: string
  ) => void

  onDeleteScene: (
    id: string
  ) => void

  projectId: string
}

export function TopicList({
  topics,
  onTopicUpdate,
  onSceneUpdate,
  onAddScene,
  onDeleteTopic,
  onDeleteScene,
  projectId,
}: Props) {
  if (topics.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        <p className="text-lg font-medium mb-2">
          No topics yet
        </p>

        <p className="text-sm">
          Click "Add Topic" to create your first section
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topics.map((topic, idx) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          index={idx}
          onUpdate={(u) =>
            onTopicUpdate(topic.id, u)
          }
          onSceneUpdate={onSceneUpdate}
          onAddScene={() =>
            onAddScene(topic.id)
          }
          onDelete={() =>
            onDeleteTopic(topic.id)
          }
          onDeleteScene={
            onDeleteScene
          }
          projectId={projectId}
        />
      ))}
    </div>
  )
}

function TopicRow({
  topic,
  index,
  onUpdate,
  onSceneUpdate,
  onAddScene,
  onDelete,
  onDeleteScene,
  projectId,
}: {
  topic: Topic
  index: number
  onUpdate: (
    u: Record<string, unknown>
  ) => void
  onSceneUpdate: (
    id: string,
    u: Record<string, unknown>
  ) => void
  onAddScene: () => void
  onDelete: () => void
  onDeleteScene: (
    id: string
  ) => void
  projectId: string
}) {
  const [expanded, setExpanded] =
    useState(true)

  const [showMenu, setShowMenu] =
    useState(false)

  const [addingScene, setAddingScene] =
    useState(false)

  const scenes = topic.scenes || []

  const completed = scenes.filter(
    (s) =>
      s.status === 'completed' ||
      s.status === 'approved'
  ).length

  const progress =
    scenes.length > 0
      ? Math.round(
          (completed / scenes.length) *
            100
        )
      : 0

  const handleAddScene =
    async () => {
      if (addingScene) return

      setAddingScene(true)

      try {
        await onAddScene()
      } finally {
        setTimeout(() => {
          setAddingScene(false)
        }, 500)
      }
    }

  return (
    <div className="card overflow-visible">
      {/* Topic Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">

        {/* Color strip */}
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              topic.color ||
              '#6366f1',
          }}
        />

        {/* Expand */}
        <button
          onClick={() =>
            setExpanded(!expanded)
          }
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={topic.title}
            onSave={(v) =>
              onUpdate({ title: v })
            }
            className="font-semibold text-gray-900 dark:text-white text-sm"
            placeholder="Topic title"
          />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {completed}/{scenes.length}{' '}
            scenes
          </span>

          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
            {progress}%
          </span>
        </div>

        {/* Actions */}
        <div className="relative flex-shrink-0 z-[9999]">
          <button
            onClick={() =>
              setShowMenu(!showMenu)
            }
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl z-[9999] overflow-hidden"
              onClick={() =>
                setShowMenu(false)
              }
            >
              <button
                onClick={
                  handleAddScene
                }
                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Scene
              </button>

              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

              <button
                onClick={onDelete}
                className="w-full px-3 py-2 text-sm flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Topic
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scenes */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: 'auto',
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onUpdate={(u) =>
                    onSceneUpdate(
                      scene.id,
                      u
                    )
                  }
                  onDelete={() =>
                    onDeleteScene(
                      scene.id
                    )
                  }
                  projectId={projectId}
                />
              ))}
            </div>

            <button
              onClick={
                handleAddScene
              }
              disabled={addingScene}
              className="w-full px-4 py-2.5 text-sm text-gray-400 dark:text-gray-600 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all flex items-center gap-2 border-t border-gray-50 dark:border-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingScene ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}

              {addingScene
                ? 'Adding...'
                : 'Add Scene'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}