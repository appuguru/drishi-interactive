import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import type { SceneStatus, Priority } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm')
}

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false
  return isPast(new Date(deadline))
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60) + '-' + Math.random().toString(36).slice(2, 7)
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const STATUS_CONFIG: Record<SceneStatus, { label: string; color: string; bg: string; dot: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-400' },
  in_progress:  { label: 'In Progress',  color: 'text-blue-700 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/30',  dot: 'bg-blue-500' },
  review:       { label: 'Review',       color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', dot: 'bg-purple-500' },
  revision:     { label: 'Revision',     color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', dot: 'bg-orange-500' },
  completed:    { label: 'Completed',    color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/30',   dot: 'bg-green-500' },
  approved:     { label: 'Approved',     color: 'text-teal-700 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-900/30',     dot: 'bg-teal-500' },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: 'text-gray-600',   bg: 'bg-gray-100' },
  medium:   { label: 'Medium',   color: 'text-blue-700',   bg: 'bg-blue-50' },
  high:     { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-50' },
  critical: { label: 'Critical', color: 'text-red-700',    bg: 'bg-red-50' },
}

export const TOPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
]

export function calculateProjectProgress(scenes: { status: string; progress: number }[]): number {
  if (!scenes.length) return 0
  const total = scenes.reduce((sum, s) => sum + s.progress, 0)
  return Math.round(total / scenes.length)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}
