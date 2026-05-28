'use client'

import { useRouter } from 'next/navigation'
import {
  Share2,
  Users,
  Trash2,
} from 'lucide-react'

import type { Project } from '@/types'

interface Props {
  project: Project
  totalScenes: number
  completedScenes: number
  inProgressScenes: number
  overallProgress: number
  memberCount: number
  onShare: () => void
  onTeam: () => void
}

export function ProjectHeader({
  project,
  totalScenes,
  completedScenes,
  inProgressScenes,
  overallProgress,
  memberCount,
  onShare,
  onTeam,
}: Props) {
  const router = useRouter()

  const radius = 28
  const circumference =
    2 * Math.PI * radius

  const strokeDashoffset =
    circumference -
    (overallProgress / 100) *
      circumference

  const handleDelete =
    async () => {
      const confirmed =
        confirm(
          'Delete this project permanently?'
        )

      if (!confirmed) return

      try {
        const res = await fetch(
          `/api/projects/${project.id}`,
          {
            method: 'DELETE',
          }
        )

        const data =
          await res.json()

        if (!res.ok) {
          alert(
            data.error ||
              'Failed to delete project'
          )
          return
        }

        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        console.error(error)

        alert(
          'Something went wrong'
        )
      }
    }

  return (
    <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">

      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          {/* PROGRESS RING */}
          <div className="relative w-16 h-16 flex-shrink-0">

            <svg
              className="w-16 h-16 -rotate-90"
              viewBox="0 0 72 72"
            >
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-100 dark:text-gray-800"
              />

              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeDasharray={
                  circumference
                }
                strokeDashoffset={
                  strokeDashoffset
                }
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
              {overallProgress}%
            </span>
          </div>

          {/* PROJECT INFO */}
          <div>

            <div className="flex items-center gap-2 mb-1">

              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {project.title}
              </h1>

              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                  project.status ===
                  'active'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : project.status ===
                      'completed'
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {project.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">

              <span>
                {totalScenes} scenes
              </span>

              <span className="text-green-600 dark:text-green-400">
                {completedScenes}{' '}
                completed
              </span>

              <span className="text-blue-600 dark:text-blue-400">
                {inProgressScenes}{' '}
                in progress
              </span>

              <span>
                {memberCount} members
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* TEAM */}
          <button
            onClick={onTeam}
            className="btn-secondary text-sm py-1.5"
          >
            <Users className="w-4 h-4" />
            Team
          </button>

          {/* SHARE */}
          <button
            onClick={onShare}
            className="btn-primary text-sm py-1.5"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          {/* DELETE */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}


