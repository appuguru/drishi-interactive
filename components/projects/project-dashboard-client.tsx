'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutList,
  Kanban,
  BarChart2,
  Plus,
  Activity,
  Search,
  Loader2,
} from 'lucide-react'

import { ProjectHeader } from './project-header'
import { TopicList } from '../topics/topic-list'
import { KanbanBoard } from '../kanban/kanban-board'
import { AnalyticsPanel } from '../analytics/analytics-panel'
import { ActivityFeed } from '../activity/activity-feed'
import { TeamPanel } from '../team/team-panel'
import { ShareModal } from '../sharing/share-modal'

import {
  subscribeToProject,
  unsubscribe,
} from '@/lib/supabase/realtime'

import type {
  Project,
  Topic,
  ProjectMember,
  ActivityLog,
} from '@/types'

import type { RealtimeChannel } from '@supabase/supabase-js'

type ViewMode = 'list' | 'kanban' | 'analytics'

interface Props {
  project: Project
  initialTopics: Topic[]
  initialMembers: ProjectMember[]
  initialActivity: ActivityLog[]
  currentUserId: string
}

export function ProjectDashboardClient({
  project,
  initialTopics,
  initialMembers,
  initialActivity,
}: Props) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics)
  const [members, setMembers] =
    useState<ProjectMember[]>(initialMembers)

  const [activity, setActivity] =
    useState<ActivityLog[]>(initialActivity)

  const [view, setView] =
    useState<ViewMode>('list')

  const [showActivity, setShowActivity] =
    useState(true)

  const [showShare, setShowShare] =
    useState(false)

  const [showTeam, setShowTeam] =
    useState(false)

  const [search, setSearch] =
    useState('')

  const [addingTopic, setAddingTopic] =
    useState(false)

  const addingSceneRef =
    useRef<Set<string>>(new Set())

  // =========================
  // REALTIME
  // =========================
  useEffect(() => {
    let channel: RealtimeChannel

    const setup = () => {
      channel = subscribeToProject(
        project.id,
        (event, payload) => {
          // ======================
          // SCENES
          // ======================
          if (event === 'scene_change') {
            const record =
              (payload as any).new ||
              (payload as any).old

            const eventType =
              (payload as any).eventType

            // INSERT
            if (
              eventType === 'INSERT' &&
              record
            ) {
              setTopics(prev =>
                prev.map(topic => {
                  if (
                    topic.id !==
                    record.topic_id
                  )
                    return topic

                  const alreadyExists =
                    (
                      topic.scenes || []
                    ).some(
                      s => s.id === record.id
                    )

                  if (alreadyExists)
                    return topic

                  return {
                    ...topic,
                    scenes: [
                      ...(topic.scenes ||
                        []),
                      record,
                    ],
                  }
                })
              )
            }

            // UPDATE
            else if (
              eventType === 'UPDATE' &&
              record
            ) {
              setTopics(prev =>
                prev.map(topic => ({
                  ...topic,
                  scenes: (
                    topic.scenes || []
                  ).map(scene =>
                    scene.id === record.id
                      ? {
                          ...scene,
                          ...record,
                        }
                      : scene
                  ),
                }))
              )
            }

            // DELETE
            else if (
              eventType === 'DELETE'
            ) {
              const old =
                (payload as any).old

              setTopics(prev =>
                prev.map(topic => ({
                  ...topic,
                  scenes: (
                    topic.scenes || []
                  ).filter(
                    s => s.id !== old?.id
                  ),
                }))
              )
            }
          }

          // ======================
          // TOPICS
          // ======================
          if (event === 'topic_change') {
            const record =
              (payload as any).new

            const eventType =
              (payload as any).eventType

            // INSERT
            if (
              eventType === 'INSERT' &&
              record
            ) {
              setTopics(prev => {
                const exists = prev.some(
                  t => t.id === record.id
                )

                if (exists) return prev

                return [
                  ...prev,
                  {
                    ...record,
                    scenes: [],
                  },
                ]
              })
            }

            // UPDATE
            else if (
              eventType === 'UPDATE'
            ) {
              setTopics(prev =>
                prev.map(t =>
                  t.id === record.id
                    ? {
                        ...t,
                        ...record,
                      }
                    : t
                )
              )
            }

            // DELETE
            else if (
              eventType === 'DELETE'
            ) {
              const old =
                (payload as any).old

              setTopics(prev =>
                prev.filter(
                  t => t.id !== old?.id
                )
              )
            }
          }

          // ======================
          // ACTIVITY
          // ======================
          if (event === 'activity') {
            const record =
              (payload as any).new

            if (record) {
              setActivity(prev => {
                const exists = prev.some(
                  a => a.id === record.id
                )

                if (exists) return prev

                return [
                  record,
                  ...prev.slice(0, 49),
                ]
              })
            }
          }
        }
      )
    }

    setup()

    return () => {
      if (channel) {
        unsubscribe(channel)
      }
    }
  }, [project.id])

  // =========================
  // STATS
  // =========================
  const allScenes =
    topics.flatMap(
      t => t.scenes || []
    )

  const totalScenes =
    allScenes.length

  const completedScenes =
    allScenes.filter(
      s =>
        s.status === 'completed' ||
        s.status === 'approved'
    ).length

  const inProgressScenes =
    allScenes.filter(
      s => s.status === 'in_progress'
    ).length

  const overallProgress =
    totalScenes > 0
      ? Math.round(
          (completedScenes /
            totalScenes) *
            100
        )
      : 0

  // =========================
  // SEARCH
  // =========================
  const filteredTopics = search
    ? topics.map(t => ({
        ...t,
        scenes: (
          t.scenes || []
        ).filter(
          s =>
            s.title
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            s.description
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              )
        ),
      }))
    : topics

  // =========================
  // UPDATE TOPIC
  // =========================
  const handleTopicUpdate =
    useCallback(
      async (
        topicId: string,
        updates: Record<
          string,
          unknown
        >
      ) => {
        setTopics(prev =>
          prev.map(t =>
            t.id === topicId
              ? {
                  ...t,
                  ...updates,
                }
              : t
          )
        )

        await fetch(
          `/api/topics/${topicId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              updates
            ),
          }
        )
      },
      []
    )

  // =========================
  // UPDATE SCENE
  // =========================
  const handleSceneUpdate =
    useCallback(
      async (
        sceneId: string,
        updates: Record<
          string,
          unknown
        >
      ) => {
        setTopics(prev =>
          prev.map(topic => ({
            ...topic,
            scenes: (
              topic.scenes || []
            ).map(s =>
              s.id === sceneId
                ? {
                    ...s,
                    ...updates,
                  }
                : s
            ),
          }))
        )

        await fetch(
          `/api/scenes/${sceneId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              updates
            ),
          }
        )
      },
      []
    )

  // =========================
  // ADD TOPIC
  // =========================
  const handleAddTopic =
    async () => {
      if (addingTopic) return

      setAddingTopic(true)

      try {
        const res = await fetch(
          `/api/projects/${project.id}/topics`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              title: 'New Topic',
            }),
          }
        )

        if (!res.ok) return

        // IMPORTANT:
        // DO NOT manually add topic here
        // realtime already adds it
      } catch (error) {
        console.error(error)
      } finally {
        setAddingTopic(false)
      }
    }

  // =========================
  // ADD SCENE
  // =========================
  const handleAddScene =
    async (topicId: string) => {
      if (
        addingSceneRef.current.has(
          topicId
        )
      )
        return

      addingSceneRef.current.add(
        topicId
      )

      try {
        const res = await fetch(
          `/api/topics/${topicId}/scenes`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              title: 'New Scene',
            }),
          }
        )

        if (!res.ok) return

        // IMPORTANT:
        // DO NOT manually add scene
        // realtime already adds it
      } catch (error) {
        console.error(error)
      } finally {
        addingSceneRef.current.delete(
          topicId
        )
      }
    }

  // =========================
  // DELETE TOPIC
  // =========================
  const handleDeleteTopic =
    async (topicId: string) => {
      if (
        !confirm(
          'Delete this topic and all its scenes?'
        )
      )
        return

      setTopics(prev =>
        prev.filter(
          t => t.id !== topicId
        )
      )

      await fetch(
        `/api/topics/${topicId}`,
        {
          method: 'DELETE',
        }
      )
    }

  // =========================
  // DELETE SCENE
  // =========================
  const handleDeleteScene =
    async (sceneId: string) => {
      if (
        !confirm(
          'Delete this scene?'
        )
      )
        return

      setTopics(prev =>
        prev.map(t => ({
          ...t,
          scenes: (
            t.scenes || []
          ).filter(
            s => s.id !== sceneId
          ),
        }))
      )

      await fetch(
        `/api/scenes/${sceneId}`,
        {
          method: 'DELETE',
        }
      )
    }

  const VIEWS = [
    {
      id: 'list',
      icon: LayoutList,
      label: 'List',
    },
    {
      id: 'kanban',
      icon: Kanban,
      label: 'Kanban',
    },
    {
      id: 'analytics',
      icon: BarChart2,
      label: 'Analytics',
    },
  ] as const

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">

        <ProjectHeader
          project={project}
          totalScenes={totalScenes}
          completedScenes={completedScenes}
          inProgressScenes={inProgressScenes}
          overallProgress={overallProgress}
          memberCount={members.length}
          onShare={() =>
            setShowShare(true)
          }
          onTeam={() =>
            setShowTeam(true)
          }
        />

        {/* TOOLBAR */}
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">

          {/* LEFT */}
          <div className="flex items-center gap-2">
            {VIEWS.map(
              ({
                id,
                icon: Icon,
                label,
              }) => (
                <button
                  key={id}
                  onClick={() =>
                    setView(
                      id as ViewMode
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
                    view === id
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              )
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                value={search}
                onChange={e =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search scenes..."
                className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500 transition-colors w-52"
              />
            </div>

            {/* ACTIVITY */}
            <button
              onClick={() =>
                setShowActivity(
                  !showActivity
                )
              }
              className={`btn-ghost text-sm ${
                showActivity
                  ? 'text-brand-600 dark:text-brand-400'
                  : ''
              }`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>

            {/* ADD TOPIC */}
            <button
              onClick={
                handleAddTopic
              }
              disabled={addingTopic}
              className="btn-primary py-1.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {addingTopic ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}

              {addingTopic
                ? 'Adding...'
                : 'Add Topic'}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex overflow-hidden">

          <div className="flex-1 overflow-y-auto p-6">

            {view === 'list' && (
              <TopicList
                topics={filteredTopics}
                onTopicUpdate={
                  handleTopicUpdate
                }
                onSceneUpdate={
                  handleSceneUpdate
                }
                onAddScene={
                  handleAddScene
                }
                onDeleteTopic={
                  handleDeleteTopic
                }
                onDeleteScene={
                  handleDeleteScene
                }
                projectId={project.id}
              />
            )}

            {view === 'kanban' && (
              <KanbanBoard
                topics={topics}
                onSceneUpdate={
                  handleSceneUpdate
                }
              />
            )}

            {view ===
              'analytics' && (
              <AnalyticsPanel
                topics={topics}
                members={members}
                project={project}
              />
            )}
          </div>

          {/* ACTIVITY SIDEBAR */}
          {showActivity && (
            <motion.div
              initial={{
                width: 0,
                opacity: 0,
              }}
              animate={{
                width: 320,
                opacity: 1,
              }}
              exit={{
                width: 0,
                opacity: 0,
              }}
              className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
            >
              <ActivityFeed
                activity={activity}
                projectId={
                  project.id
                }
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* SHARE */}
      {showShare && (
        <ShareModal
          project={project}
          onClose={() =>
            setShowShare(false)
          }
        />
      )}

      {/* TEAM */}
      {showTeam && (
        <TeamPanel
          project={project}
          members={members}
          onClose={() =>
            setShowTeam(false)
          }
          onMembersChange={
            setMembers
          }
        />
      )}
    </div>
  )
}