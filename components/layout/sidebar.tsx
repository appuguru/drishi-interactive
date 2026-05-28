'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderOpen, Bell, Plus, Search,
  ChevronDown, ChevronRight, Film, Settings, Moon, Sun,
} from 'lucide-react'
import type { Project } from '@/types'

interface SidebarProps {
  projects?: Project[]
}

export function Sidebar({ projects = [] }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') { document.documentElement.classList.add('dark'); setDark(true) }
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
  ]

  return (
    <aside className="w-64 h-screen flex flex-col bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Film className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-sm">Drishi Interactive</span>
        <button onClick={toggleDark} className="ml-auto p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn('sidebar-item', pathname === href && 'active')}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        ))}

        {/* Projects Section */}
        <div className="pt-4 pb-1">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="flex items-center justify-between w-full px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span>Projects</span>
            {projectsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {projectsOpen && (
          <div className="space-y-0.5">
            {/* Search projects */}
            <div className="relative px-1 mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {filteredProjects.slice(0, 8).map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn('sidebar-item', pathname.startsWith(`/projects/${project.id}`) && 'active')}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.status === 'active' ? '#22c55e' : project.status === 'completed' ? '#6366f1' : '#94a3b8' }}
                />
                <span className="truncate text-xs">{project.title}</span>
              </Link>
            ))}

            {filteredProjects.length === 0 && (
              <p className="text-xs text-gray-400 px-3 py-2">No projects found</p>
            )}

            <Link
              href="/projects/new"
              className="sidebar-item text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.fullName || user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
