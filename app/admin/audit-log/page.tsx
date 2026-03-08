'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuditLog } from '@/types'

const ACTION_COLORS: Record<string, string> = {
  CREATE_INQUIRY: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  UPDATE_INQUIRY_STATUS: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  CREATE_BOOKING: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  UPDATE_BOOKING_STATUS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CREATE_ADMIN: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  DELETE_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-log')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {
      console.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  function formatDate(str: string) {
    return new Date(str).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Audit Log</h1>
        <p className="text-zinc-500 text-sm mt-1">Full history of all admin actions</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">No audit logs yet.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${
                      ACTION_COLORS[log.action] || 'bg-zinc-700 text-zinc-300 border-zinc-600'
                    }`}
                  >
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-300 text-sm truncate">
                      <span className="text-white font-medium">{log.admin_email || 'System'}</span>
                      {' · '}
                      <span className="text-zinc-500">Table: {log.table_name}</span>
                    </p>
                  </div>
                  <p className="text-zinc-600 text-xs flex-shrink-0 hidden sm:block">
                    {formatDate(log.created_at)}
                  </p>
                  <svg
                    className={`w-4 h-4 text-zinc-600 flex-shrink-0 transition-transform ${
                      expanded === log.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expanded === log.id && (
                  <div className="px-4 pb-4 bg-zinc-800/30">
                    <div className="sm:hidden text-zinc-500 text-xs mb-3">{formatDate(log.created_at)}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {log.record_id && (
                        <div className="sm:col-span-2">
                          <p className="text-zinc-600 text-xs mb-1">Record ID</p>
                          <p className="text-zinc-400 text-xs font-mono bg-zinc-900 px-2 py-1.5 rounded">
                            {log.record_id}
                          </p>
                        </div>
                      )}
                      {log.old_data && (
                        <div>
                          <p className="text-zinc-600 text-xs mb-1">Before</p>
                          <pre className="text-zinc-400 text-xs bg-zinc-900 px-3 py-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(log.old_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div>
                          <p className="text-zinc-600 text-xs mb-1">After</p>
                          <pre className="text-zinc-400 text-xs bg-zinc-900 px-3 py-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
