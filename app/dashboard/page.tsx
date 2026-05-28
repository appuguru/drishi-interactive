import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, TrendingUp, Film, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { formatDate, isOverdue, STATUS_CONFIG } from '@/lib/utils'
import type { Project } from '@/types'

async function getStats(userId: string) {
  const supabase = createServiceRoleClient()
  const { data: projects } = await supabase
    .from('projects')
    .select(`id, title, status, deadline, updated_at, is_published,
      scenes(id, status, progress)`)
    .eq('created_by', userId)
    .order('updated_at', { ascending: false })

  return projects || []
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const projects = await getStats(userId)

  const stats = {
    total: projects.length,
    active: projects.filter((p: any) => p.status === 'active').length,
    completed: projects.filter((p: any) => p.status === 'completed').length,
    overdue: projects.filter((p: any) => p.deadline && isOverdue(p.deadline) && p.status !== 'completed').length,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName || 'there'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening across your productions</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: stats.total, icon: Film, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Projects</h2>
        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <Film className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Upload a script to automatically generate your first production dashboard</p>
            <Link href="/projects/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => {
              const scenes = project.scenes || []
              const totalScenes = scenes.length
              const completedScenes = scenes.filter((s: any) => s.status === 'completed' || s.status === 'approved').length
              const progress = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0
              const overdueProject = project.deadline && isOverdue(project.deadline) && project.status !== 'completed'

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className={`card p-5 hover:shadow-md transition-all duration-200 cursor-pointer group ${overdueProject ? 'border-red-200 dark:border-red-800' : ''}`}>
                    {/* Status dot + title */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          project.status === 'active' ? 'bg-green-500' :
                          project.status === 'completed' ? 'bg-brand-500' :
                          project.status === 'review' ? 'bg-purple-500' :
                          project.status === 'archived' ? 'bg-gray-400' : 'bg-gray-300'
                        }`} />
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {project.title}
                        </h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${
                        project.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        project.status === 'completed' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{completedScenes}/{totalScenes} scenes</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updated_at)}
                      </span>
                      {project.deadline && (
                        <span className={`flex items-center gap-1 ${overdueProject ? 'text-red-500' : ''}`}>
                          {overdueProject && <AlertTriangle className="w-3 h-3" />}
                          Due {formatDate(project.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* New project card */}
            <Link href="/projects/new">
              <div className="card p-5 border-dashed hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all duration-200 cursor-pointer h-full flex flex-col items-center justify-center gap-3 min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">New Project</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Upload a script to get started</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
