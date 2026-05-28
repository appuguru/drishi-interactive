'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onSave: (value: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
}

export function InlineEdit({ value, onSave, className, placeholder = 'Click to edit...', multiline = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed !== value && trimmed) onSave(trimmed)
    else setDraft(value)
    setEditing(false)
  }, [draft, value, onSave])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
    if (e.key === 'Enter' && !multiline) save()
  }

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={cn('cursor-text hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded px-0.5 -mx-0.5 transition-colors block min-w-[60px]', !value && 'text-gray-400 dark:text-gray-600 italic', className)}
        title="Click to edit"
      >
        {value || placeholder}
      </span>
    )
  }

  const sharedProps = {
    ref: inputRef as any,
    value: draft,
    onChange: (e: React.ChangeEvent<any>) => setDraft(e.target.value),
    onBlur: save,
    onKeyDown: handleKeyDown,
    className: cn('bg-transparent outline-none border-b-2 border-brand-500 w-full resize-none', className),
    placeholder,
  }

  return multiline
    ? <textarea {...sharedProps} rows={Math.max(2, draft.split('\n').length)} />
    : <input {...sharedProps} type="text" />
}
