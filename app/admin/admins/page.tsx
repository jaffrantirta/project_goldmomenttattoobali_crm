'use client'

import { useEffect, useState, useCallback } from 'react'
import { Admin } from '@/types'

interface CreateForm {
  name: string
  email: string
  password: string
  role: 'admin' | 'super_admin'
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Admin | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>({ name: '', email: '', password: '', role: 'admin' })
  const [createLoading, setCreateLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admins')
      const data = await res.json()
      setAdmins(data.admins || [])
      setCurrentUser(data.currentUser || null)
    } catch {
      showToast('Failed to load admins', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create admin')
      showToast('Admin created successfully', 'success')
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'admin' })
      fetchData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create admin', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`Remove admin "${admin.name}"? This will revoke their access.`)) return
    try {
      const res = await fetch(`/api/admins/${admin.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
      showToast('Admin removed', 'success')
    } catch {
      showToast('Failed to remove admin', 'error')
    }
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const isSuperAdmin = currentUser?.role === 'super_admin'

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Users</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage who has access to this CRM</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-900 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Admin
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 text-amber-400 text-sm mb-6">
          Only super admins can create or remove admin users.
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading...</div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">No admins found.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-4 px-4 py-4">
                <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-semibold text-sm">
                    {admin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{admin.name}</p>
                    {admin.id === currentUser?.id && (
                      <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">You</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        admin.role === 'super_admin'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">{admin.email}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Joined {formatDate(admin.created_at)}</p>
                </div>
                {isSuperAdmin && admin.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(admin)}
                    className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Add New Admin</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'super_admin' })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-zinc-900 transition-colors disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
