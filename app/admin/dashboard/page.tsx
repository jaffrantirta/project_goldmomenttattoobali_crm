'use client'

import { useEffect, useState, useCallback } from 'react'
import { Inquiry, REFERRAL_LABELS, INQUIRY_STATUS_LABELS } from '@/types'

interface BookingForm {
  client_name: string
  whatsapp: string
  booking_date: string
  tattoo_description: string
  deposit_amount: string
  total_amount: string
  notes: string
}

export default function DashboardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'not_followed_up' | 'followed_up'>('all')
  const [bookingFor, setBookingFor] = useState<Inquiry | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    client_name: '',
    whatsapp: '',
    booking_date: '',
    tattoo_description: '',
    deposit_amount: '',
    total_amount: '',
    notes: '',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch('/api/inquiries')
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch {
      showToast('Failed to load inquiries', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  async function toggleStatus(inquiry: Inquiry) {
    const newStatus = inquiry.status === 'not_followed_up' ? 'followed_up' : 'not_followed_up'
    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiry.id ? { ...i, status: newStatus } : i))
      )
      showToast('Status updated', 'success')
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  function openBookingModal(inquiry: Inquiry) {
    setBookingFor(inquiry)
    setBookingForm({
      client_name: inquiry.name,
      whatsapp: inquiry.whatsapp,
      booking_date: '',
      tattoo_description: '',
      deposit_amount: '',
      total_amount: '',
      notes: '',
    })
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!bookingFor) return
    setBookingLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_id: bookingFor.id,
          client_name: bookingForm.client_name,
          whatsapp: bookingForm.whatsapp,
          booking_date: bookingForm.booking_date || null,
          tattoo_description: bookingForm.tattoo_description || null,
          deposit_amount: bookingForm.deposit_amount ? Number(bookingForm.deposit_amount) : null,
          total_amount: bookingForm.total_amount ? Number(bookingForm.total_amount) : null,
          notes: bookingForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Booking created successfully!', 'success')
      setBookingFor(null)
      fetchInquiries()
    } catch {
      showToast('Failed to create booking', 'error')
    } finally {
      setBookingLoading(false)
    }
  }

  const filtered = inquiries.filter((i) => filter === 'all' || i.status === filter)
  const stats = {
    total: inquiries.length,
    notFollowed: inquiries.filter((i) => i.status === 'not_followed_up').length,
    followed: inquiries.filter((i) => i.status === 'followed_up').length,
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Inquiries</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage client inquiries and follow-ups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Not Followed Up', value: stats.notFollowed, color: 'text-amber-400' },
          { label: 'Followed Up', value: stats.followed, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([['all', 'All'], ['not_followed_up', 'Not Followed Up'], ['followed_up', 'Followed Up']] as const).map(
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
          <div className="py-16 text-center text-zinc-500 text-sm">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Source</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {formatDate(inquiry.created_at)}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{inquiry.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${inquiry.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {inquiry.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {REFERRAL_LABELS[inquiry.referral_source]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          inquiry.status === 'followed_up'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        }`}
                      >
                        {INQUIRY_STATUS_LABELS[inquiry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(inquiry)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors whitespace-nowrap"
                        >
                          {inquiry.status === 'followed_up' ? 'Mark Pending' : 'Mark Followed'}
                        </button>
                        <button
                          onClick={() => openBookingModal(inquiry)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/20 transition-colors whitespace-nowrap"
                        >
                          Book
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4 py-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-full overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Create Booking</h2>
              <p className="text-zinc-500 text-sm mt-1">For: {bookingFor.name}</p>
            </div>
            <form onSubmit={submitBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.client_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, client_name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.whatsapp}
                    onChange={(e) => setBookingForm({ ...bookingForm, whatsapp: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Booking Date</label>
                <input
                  type="date"
                  value={bookingForm.booking_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tattoo Description</label>
                <textarea
                  value={bookingForm.tattoo_description}
                  onChange={(e) => setBookingForm({ ...bookingForm, tattoo_description: e.target.value })}
                  rows={2}
                  placeholder="Style, placement, size..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Deposit (Rp)</label>
                  <input
                    type="number"
                    value={bookingForm.deposit_amount}
                    onChange={(e) => setBookingForm({ ...bookingForm, deposit_amount: e.target.value })}
                    placeholder="500000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Total (Rp)</label>
                  <input
                    type="number"
                    value={bookingForm.total_amount}
                    onChange={(e) => setBookingForm({ ...bookingForm, total_amount: e.target.value })}
                    placeholder="2000000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingFor(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-zinc-900 transition-colors disabled:cursor-not-allowed"
                >
                  {bookingLoading ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
