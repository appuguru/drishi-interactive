'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Link, Copy, Check, Globe, Lock, Eye, Edit3 } from 'lucide-react'
import type { Project, ShareMode } from '@/types'

interface Props {
  project: Project
  onClose: () => void
}

const MODES: { value: ShareMode; label: string; desc: string; icon: any }[] = [
  { value: 'private', label: 'Private', desc: 'Only project members', icon: Lock },
  { value: 'view', label: 'View Only', desc: 'Anyone with link can view', icon: Eye },
  { value: 'comment', label: 'Can Comment', desc: 'View + add comments', icon: Globe },
  { value: 'edit', label: 'Can Edit', desc: 'Full edit access', icon: Edit3 },
]

export function ShareModal({ project, onClose }: Props) {
  const [shareMode, setShareMode] = useState<ShareMode>(project.share_mode)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${project.share_token}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveMode = async (mode: ShareMode) => {
    setShareMode(mode)
    setSaving(true)
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_mode: mode }),
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Link className="w-5 h-5 text-brand-500" />Share Project
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Access Level */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Access Level</p>
            <div className="space-y-2">
              {MODES.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => saveMode(value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    shareMode === value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${shareMode === value ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  {shareMode === value && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Share Link */}
          {shareMode !== 'private' && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Share Link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-600 dark:text-gray-400"
                />
                <button onClick={copyLink} className={`btn-primary text-sm py-2 px-3 ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Anyone with this link can {shareMode === 'view' ? 'view' : shareMode === 'comment' ? 'view and comment on' : 'edit'} this project
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
