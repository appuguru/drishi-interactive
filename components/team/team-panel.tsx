'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Users } from 'lucide-react'
import type { Project, ProjectMember, MemberRole } from '@/types'

const ROLES: MemberRole[] = ['admin', 'team_lead', 'employee', 'viewer']

interface Props {
  project: Project
  members: ProjectMember[]
  onClose: () => void
  onMembersChange: (m: ProjectMember[]) => void
}

// FIX: helper to get best display name from a member record
function getMemberName(m: ProjectMember): string {
  if (m.full_name && m.full_name.trim() && m.full_name !== 'Unknown') return m.full_name
  if (m.email) return m.email.split('@')[0]   // e.g. "guru" from "guru@gmail.com"
  return 'Member'
}

function getMemberInitial(m: ProjectMember): string {
  return getMemberName(m)[0].toUpperCase()
}

export function TeamPanel({ project, members, onClose, onMembersChange }: Props) {
  const [email,   setEmail]   = useState('')
  const [name,    setName]    = useState('')
  const [role,    setRole]    = useState<MemberRole>('employee')
  const [adding,  setAdding]  = useState(false)
  const [error,   setError]   = useState('')

  const addMember = async () => {
    if (!email.trim()) { setError('Email is required'); return }
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:     email.trim(),
          full_name: name.trim() || email.split('@')[0],  // FIX: fallback name from email
          role,
        }),
      })
      if (!res.ok) throw new Error('Failed to add member')
      const member = await res.json()
      onMembersChange([...members, member])
      setEmail('')
      setName('')
    } catch (e: any) {
      setError(e.message)
    }
    setAdding(false)
  }

  const removeMember = async (memberId: string, clerkId: string) => {
    await fetch(`/api/projects/${project.id}/members/${clerkId}`, { method: 'DELETE' })
    onMembersChange(members.filter(m => m.id !== memberId))
  }

  const updateRole = async (clerkId: string, newRole: MemberRole) => {
    await fetch(`/api/projects/${project.id}/members/${clerkId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    onMembersChange(members.map(m =>
      m.clerk_id === clerkId ? { ...m, role: newRole } : m
    ))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />Team Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Add member form */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Add Team Member
          </p>
          <div className="space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name (optional)"
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500"
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address *"
              type="email"
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <select
                value={role}
                onChange={e => setRole(e.target.value as MemberRole)}
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-500 capitalize"
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="capitalize">
                    {r.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <button
                onClick={addMember}
                disabled={adding || !email.trim()}
                className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        {/* Member list */}
        <div className="p-6 max-h-72 overflow-y-auto space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No members yet</p>
          ) : (
            members.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                {/* FIX: avatar uses getMemberInitial so never shows "?" */}
                <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-sm text-white font-semibold flex-shrink-0">
                  {getMemberInitial(m)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* FIX: display name never shows "Unknown" */}
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getMemberName(m)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                <select
                  value={m.role}
                  onChange={e => updateRole(m.clerk_id, e.target.value as MemberRole)}
                  className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 outline-none capitalize"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r} className="capitalize">
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeMember(m.id, m.clerk_id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}