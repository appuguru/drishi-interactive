'use client'

import { useState, useEffect } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { buildActivityMessage } from '@/lib/utils/activity'
import type { ActivityLog } from '@/types'

interface Props {
  activity: ActivityLog[]
  projectId: string
}

export function ActivityFeed({ activity, projectId }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">Live updates</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">No activity yet</p>
        ) : (
          activity.map(log => (
            <div key={log.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">
                {(log.user_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {buildActivityMessage(log)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatRelativeTime(log.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
