'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MoreHorizontal,
  Trash2,
  ChevronDown,
  GripVertical,
} from 'lucide-react'

import { InlineEdit } from '../editor/inline-edit'
import { StatusBadge } from '../ui/status-badge'
import { SceneModal } from './scene-modal'

import {
  formatDate,
  isOverdue,
  STATUS_CONFIG,
} from '@/lib/utils'

import type {
  Scene,
  SceneStatus,
} from '@/types'

interface Props {
  scene: Scene
  onUpdate: (
    updates: Record<string, unknown>
  ) => void
  onDelete: () => void
  projectId: string
}

const STATUSES: SceneStatus[] = [
  'not_started',
  'in_progress',
  'review',
  'revision',
  'completed',
  'approved',
]

export function SceneCard({
  scene,
  onUpdate,
  onDelete,
  projectId,
}: Props) {
  const [showMenu, setShowMenu] =
    useState(false)

  const [
    showStatusMenu,
    setShowStatusMenu,
  ] = useState(false)

  const [showModal, setShowModal] =
    useState(false)

  const menuRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (
      e: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          e.target as Node
        )
      ) {
        setShowMenu(false)
        setShowStatusMenu(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handler
    )

    return () =>
      document.removeEventListener(
        'mousedown',
        handler
      )
  }, [])

  const overdue =
    isOverdue(scene.deadline) &&
    scene.status !== 'completed' &&
    scene.status !== 'approved'

  const config =
    STATUS_CONFIG[scene.status]

  return (
    <>
      <div
        className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors ${
          overdue
            ? 'bg-red-50/30 dark:bg-red-900/5'
            : ''
        }`}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowMenu(true)
        }}
      >
        {/* Drag Handle */}
        <GripVertical className="w-3.5 h-3.5 text-gray-200 dark:text-gray-700 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0 transition-opacity" />

        {/* Status Dot */}
        <div
          className="relative flex-shrink-0"
          ref={menuRef}
        >
          <button
            onClick={() =>
              setShowStatusMenu(
                !showStatusMenu
              )
            }
            className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-150 ${config.dot}`}
            title={config.label}
          />

          {showStatusMenu && (
            <div className="context-menu left-4 top-0 w-44 z-50">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onUpdate({
                      status: s,
                    })

                    setShowStatusMenu(
                      false
                    )
                  }}
                  className={`context-menu-item w-full ${
                    s === scene.status
                      ? 'font-semibold'
                      : ''
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot} flex-shrink-0`}
                  />

                  {
                    STATUS_CONFIG[s]
                      .label
                  }
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={scene.title}
            onSave={(v) =>
              onUpdate({
                title: v,
              })
            }
            className="text-sm text-gray-900 dark:text-white"
            placeholder="Scene title"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 flex-shrink-0">

          {/* Progress */}
          <div className="flex items-center gap-3 min-w-[180px]">

            <input
              type="range"
              min={0}
              max={100}
              value={scene.progress}
              onChange={(e) =>
                onUpdate({
                  progress: Number(
                    e.target.value
                  ),
                })
              }
              className="w-24 h-1.5 accent-brand-500 cursor-pointer"
              onClick={(e) =>
                e.stopPropagation()
              }
            />

            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[42px] text-right">
              {scene.progress}%
            </span>
          </div>

          {/* Status Badge */}
          <div className="min-w-[100px] flex justify-start">
            <StatusBadge
              status={scene.status}
            />
          </div>

          {/* Deadline */}
          {scene.deadline && (
            <span
              className={`text-xs whitespace-nowrap ${
                overdue
                  ? 'text-red-500 font-medium'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {formatDate(
                scene.deadline
              )}
            </span>
          )}

          {/* Assignees */}
          {scene.assignments &&
            scene.assignments.length >
              0 && (
              <div className="flex -space-x-1">
                {scene.assignments
                  .slice(0, 3)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="w-6 h-6 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs text-white font-medium"
                      title={
                        a.full_name ||
                        ''
                      }
                    >
                      {(
                        a.full_name ||
                        '?'
                      )[0].toUpperCase()}
                    </div>
                  ))}
              </div>
            )}

          {/* Open Detail */}
          <button
            onClick={() =>
              setShowModal(true)
            }
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
          >
            <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="context-menu right-0 top-6 z-50"
                onClick={() =>
                  setShowMenu(false)
                }
              >
                <button
                  onClick={() =>
                    setShowModal(true)
                  }
                  className="context-menu-item w-full"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                  Open detail
                </button>

                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                <button
                  onClick={onDelete}
                  className="context-menu-item w-full text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <SceneModal
          scene={scene}
          onUpdate={onUpdate}
          onClose={() =>
            setShowModal(false)
          }
          projectId={projectId}
        />
      )}
    </>
  )
}