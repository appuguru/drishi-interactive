'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Link, Copy, Check, Globe, Lock, Eye, Edit3, Loader2 } from 'lucide-react'
import type { Project, ShareMode } from '@/types'

interface Props {
  project: Project
  onClose: () => void
}

const MODES: { value: ShareMode; label: string; desc: string; icon: any }[] = [
  { value: 'private', label: 'Private',     desc: 'Only project members can access',       icon: Lock  },
  { value: 'view',    label: 'View Only',   desc: 'Anyone with link can view live progress', icon: Eye   },
  { value: 'comment', label: 'Can Comment', desc: 'View + add comments',                    icon: Globe },
  { value: 'edit',    label: 'Can Edit',    desc: 'Anyone with link can edit (like Google Docs)', icon: Edit3 },
]

export function ShareModal({ project, onClose }: Props) {
  const [shareMode, setShareMode] = useState<ShareMode>(project.share_mode)
  const [copied, setCopied]       = useState(false)
  const [saving, setSaving]       = useState<ShareMode | null>(null)
  const [saved,  setSaved]        = useState<ShareMode | null>(null)

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/share/${project.share_token}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveMode = async (mode: ShareMode) => {
    if (saving) return               // block while saving
    setShareMode(mode)
    setSaving(mode)
    setSaved(null)

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_mode: mode }),
    })

    setSaving(null)
    if (res.ok) {
      setSaved(mode)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Link className="w-5 h-5 text-brand-500" />Share Project
          </h2>
          <div className="flex items-center gap-2">
            {/* FIX: saved confirmation badge */}
            {saved && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" />Saved
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Access Level */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Access Level
            </p>
            <div className="space-y-2">
              {MODES.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => saveMode(value)}
                  disabled={!!saving}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed ${
                    shareMode === value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    shareMode === value
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  {/* FIX: spinner while saving this option, checkmark when selected */}
                  {saving === value ? (
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin ml-auto" />
                  ) : shareMode === value ? (
                    <Check className="w-4 h-4 text-brand-500 ml-auto" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Share Link — only show when not private */}
          {shareMode !== 'private' && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share Link
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-600 dark:text-gray-400"
                />
                <button
                  onClick={copyLink}
                  className={`btn-primary text-sm py-2 px-3 ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {shareMode === 'view'
                  ? '👁 Viewers can see live progress but cannot make changes'
                  : shareMode === 'comment'
                  ? '💬 Viewers can see progress and leave comments'
                  : '✏️ Anyone with this link can edit scenes and progress — like Google Docs'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}