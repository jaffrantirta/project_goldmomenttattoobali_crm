'use client'

import { useEffect, useState, useCallback } from 'react'
import { Booking, BOOKING_STATUS_LABELS, BookingStatus } from '@/types'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | BookingStatus>('all')
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

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Bookings</h1>
        <p className="text-zinc-500 text-sm mt-1">Track and manage all confirmed bookings</p>
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
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Total</th>
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
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {formatCurrency(booking.total_amount)}
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
    </div>
  )
}
