'use client'

import { useEffect, useState, useCallback } from 'react'
import { Booking, BOOKING_STATUS_LABELS, BookingStatus } from '@/types'

interface BookingForm {
  client_name: string
  whatsapp: string
  booking_date: string
  tattoo_description: string
  deposit_amount: string
  notes: string
}

const emptyForm: BookingForm = {
  client_name: '',
  whatsapp: '',
  booking_date: '',
  tattoo_description: '',
  deposit_amount: '',
  notes: '',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | BookingStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<BookingForm>(emptyForm)
  const [createLoading, setCreateLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch {
      showToast('Failed to load bookings', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  async function updateStatus(id: string, booking_status: BookingStatus) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_status }),
      })
      if (!res.ok) throw new Error()
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, booking_status } : b))
      )
      showToast('Booking status updated', 'success')
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: form.client_name,
          whatsapp: form.whatsapp,
          booking_date: form.booking_date || null,
          tattoo_description: form.tattoo_description || null,
          deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Booking created', 'success')
      setShowCreate(false)
      setForm(emptyForm)
      fetchBookings()
    } catch {
      showToast('Failed to create booking', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const filtered = bookings.filter((b) => filter === 'all' || b.booking_status === filter)

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.booking_status === 'confirmed').length,
    completed: bookings.filter((b) => b.booking_status === 'completed').length,
    cancelled: bookings.filter((b) => b.booking_status === 'cancelled').length,
  }

  function formatDate(str: string | null) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatCurrency(val: number | null) {
    if (val == null) return '—'
    return `Rp ${val.toLocaleString('id-ID')}`
  }

  const statusColors: Record<BookingStatus, string> = {
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

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
          <h1 className="text-xl font-bold text-white">Bookings</h1>
          <p className="text-zinc-500 text-sm mt-1">Track and manage all confirmed bookings</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-900 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-400' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([['all', 'All'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['cancelled', 'Cancelled']] as const).map(
          ([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === val
                  ? 'bg-amber-400 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Booking Date</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Tattoo</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Deposit</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{booking.client_name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${booking.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {booking.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                      {formatDate(booking.booking_date)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[180px] truncate hidden lg:table-cell">
                      {booking.tattoo_description || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {formatCurrency(booking.deposit_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[booking.booking_status]}`}>
                        {BOOKING_STATUS_LABELS[booking.booking_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {booking.booking_status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(booking.id, 'completed')}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {booking.booking_status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.booking_status === 'cancelled' && (
                          <button
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4 py-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-full overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Add Booking</h2>
              <p className="text-zinc-500 text-sm mt-1">Manually add a new booking</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+62 812 3456 7890"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Booking Date</label>
                <input
                  type="date"
                  value={form.booking_date}
                  onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tattoo Description</label>
                <textarea
                  value={form.tattoo_description}
                  onChange={(e) => setForm({ ...form, tattoo_description: e.target.value })}
                  rows={2}
                  placeholder="Style, placement, size..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Deposit (Rp)</label>
                <input
                  type="number"
                  value={form.deposit_amount}
                  onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                  placeholder="500000"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm(emptyForm) }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-zinc-900 transition-colors disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
