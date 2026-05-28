import { cn, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils'
import type { SceneStatus, Priority } from '@/types'

export function StatusBadge({ status }: { status: SceneStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn('status-badge', config.bg, config.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', config.bg, config.color)}>
      {config.label}
    </span>
  )
}
