"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Booking,
  BOOKING_STATUS_LABELS,
  BookingStatus,
  SOURCE_LABELS,
} from "@/types";

const PAGE_SIZE = 10;

const SOURCE_OPTIONS = [
  { value: "", label: "— No source —" },
  { value: "google", label: "Google" },
  { value: "instagram", label: "Instagram" },
  { value: "friend", label: "Friend" },
  { value: "tour_guide", label: "Tour Guide" },
  { value: "walk_in", label: "Walk-in" },
  { value: "direct", label: "Direct" },
];

interface BookingForm {
  client_name: string;
  whatsapp: string;
  source: string;
  booking_date: string;
  tattoo_description: string;
  deposit_amount: string;
  notes: string;
}

const emptyForm: BookingForm = {
  client_name: "",
  whatsapp: "",
  source: "",
  booking_date: "",
  tattoo_description: "",
  deposit_amount: "",
  notes: "",
};

const statusColors: Record<BookingStatus, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
      <p className="text-zinc-500 text-xs">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 transition-colors"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1)
              acc.push("ellipsis");
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === "ellipsis" ? (
              <span
                key={`e${idx}`}
                className="px-2 py-1.5 text-zinc-600 text-xs"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  page === p
                    ? "bg-amber-400 text-zinc-900 border-amber-400"
                    : "bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700"
                }`}
              >
                {p}
              </button>
            ),
          )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [createLoading, setCreateLoading] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<BookingForm>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      showToast("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter, dateFrom, dateTo]);

  async function updateStatus(id: string, booking_status: BookingStatus) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_status }),
      });
      if (!res.ok) throw new Error();
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, booking_status } : b)),
      );
      showToast("Booking status updated", "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  }

  function openEdit(booking: Booking) {
    setEditBooking(booking);
    setEditForm({
      client_name: booking.client_name,
      whatsapp: booking.whatsapp,
      source: booking.source ?? "",
      booking_date: booking.booking_date ?? "",
      tattoo_description: booking.tattoo_description ?? "",
      deposit_amount: booking.deposit_amount != null ? String(booking.deposit_amount) : "",
      notes: booking.notes ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBooking) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/bookings/${editBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: editForm.client_name,
          whatsapp: editForm.whatsapp,
          source: editForm.source || null,
          booking_date: editForm.booking_date || null,
          tattoo_description: editForm.tattoo_description || null,
          deposit_amount: editForm.deposit_amount ? Number(editForm.deposit_amount) : null,
          notes: editForm.notes || null,
          booking_status: editBooking.booking_status,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Booking updated", "success");
      setEditBooking(null);
      fetchBookings();
    } catch {
      showToast("Failed to update booking", "error");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBookings((prev) => prev.filter((b) => b.id !== id));
      showToast("Booking deleted", "success");
    } catch {
      showToast("Failed to delete booking", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          whatsapp: form.whatsapp,
          source: form.source || null,
          booking_date: form.booking_date || null,
          tattoo_description: form.tattoo_description || null,
          deposit_amount: form.deposit_amount
            ? Number(form.deposit_amount)
            : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Booking created", "success");
      setShowCreate(false);
      setForm(emptyForm);
      fetchBookings();
    } catch {
      showToast("Failed to create booking", "error");
    } finally {
      setCreateLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("");
    setDateFrom("");
    setDateTo("");
  }

  const hasActiveFilters =
    search.trim() || statusFilter !== "all" || sourceFilter || dateFrom || dateTo;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.booking_status !== statusFilter)
        return false;

      if (sourceFilter && (b.source ?? "") !== sourceFilter) return false;

      if (q) {
        const nameMatch = b.client_name.toLowerCase().includes(q);
        // Normalise phone: strip all non-digits, then match ignoring leading 0 vs 62
        const phoneRaw = b.whatsapp.replace(/\D/g, "");
        const searchRaw = q.replace(/\D/g, "");
        const phoneMatch =
          searchRaw.length > 0 &&
          (phoneRaw.includes(searchRaw) ||
            phoneRaw.includes(searchRaw.replace(/^0/, "62")) ||
            phoneRaw.replace(/^62/, "0").includes(searchRaw));
        if (!nameMatch && !phoneMatch) return false;
      }

      if (dateFrom || dateTo) {
        if (!b.booking_date) return false;
        if (dateFrom && b.booking_date < dateFrom) return false;
        if (dateTo && b.booking_date > dateTo) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, sourceFilter, search, dateFrom, dateTo]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.booking_status === "confirmed").length,
    completed: bookings.filter((b) => b.booking_status === "completed").length,
    cancelled: bookings.filter((b) => b.booking_status === "cancelled").length,
  };

  function formatDate(str: string | null) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatCurrency(val: number | null) {
    if (val == null) return "—";
    return `Rp ${val.toLocaleString("id-ID")}`;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/20 border border-red-500/30 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bookings</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Track and manage all confirmed bookings
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-900 text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          {
            label: "Confirmed",
            value: stats.confirmed,
            color: "text-blue-400",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-emerald-400",
          },
          { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone number..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date range */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
            <span className="text-zinc-600 text-sm shrink-0">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Source dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="">All Sources</option>
            {SOURCE_OPTIONS.filter((o) => o.value !== "").map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(
              [
                ["all", "All"],
                ["confirmed", "Confirmed"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === val
                    ? "bg-amber-400 text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-zinc-500 text-xs">
              Showing{" "}
              <span className="text-amber-400 font-medium">
                {filtered.length}
              </span>{" "}
              of {bookings.length} bookings
            </p>
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            {hasActiveFilters
              ? "No bookings match your filters."
              : "No bookings found."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">WhatsApp</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">
                      Booking Date
                    </th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">
                      Tattoo
                    </th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">
                      Deposit
                    </th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {paginated.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{booking.client_name}</p>
                        {booking.notes && (
                          <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-45">{booking.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://wa.me/${booking.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {booking.whatsapp}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                        {booking.source
                          ? (SOURCE_LABELS[booking.source] ?? booking.source)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                        {formatDate(booking.booking_date)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 max-w-40 truncate hidden lg:table-cell">
                        {booking.tattoo_description || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                        {formatCurrency(booking.deposit_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[booking.booking_status]}`}
                        >
                          {BOOKING_STATUS_LABELS[booking.booking_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {booking.booking_status !== "completed" && (
                            <button
                              onClick={() =>
                                updateStatus(booking.id, "completed")
                              }
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {booking.booking_status === "confirmed" && (
                            <button
                              onClick={() =>
                                updateStatus(booking.id, "cancelled")
                              }
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {booking.booking_status === "cancelled" && (
                            <button
                              onClick={() =>
                                updateStatus(booking.id, "confirmed")
                              }
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(booking)}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(booking.id)}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {/* Edit Booking Modal */}
      {editBooking && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4 py-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-full overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Edit Booking</h2>
              <p className="text-zinc-500 text-sm mt-1">{editBooking.client_name}</p>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.client_name}
                    onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={editForm.whatsapp}
                    onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Source</label>
                  <select
                    value={editForm.source}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Booking Date</label>
                  <input
                    type="date"
                    value={editForm.booking_date}
                    onChange={(e) => setEditForm({ ...editForm, booking_date: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
                <select
                  value={editBooking.booking_status}
                  onChange={(e) => setEditBooking({ ...editBooking, booking_status: e.target.value as BookingStatus })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tattoo Description</label>
                <textarea
                  value={editForm.tattoo_description}
                  onChange={(e) => setEditForm({ ...editForm, tattoo_description: e.target.value })}
                  rows={2}
                  placeholder="Style, placement, size..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Deposit (Rp)</label>
                <input
                  type="number"
                  value={editForm.deposit_amount}
                  onChange={(e) => setEditForm({ ...editForm, deposit_amount: e.target.value })}
                  placeholder="500000"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditBooking(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-zinc-900 transition-colors disabled:cursor-not-allowed"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-white font-bold text-lg mb-2">Delete Booking</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors disabled:cursor-not-allowed"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4 py-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-full overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Add Booking</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Manually add a new booking
              </p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.client_name}
                    onChange={(e) =>
                      setForm({ ...form, client_name: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    placeholder="+62 812 3456 7890"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) =>
                      setForm({ ...form, source: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={form.booking_date}
                    onChange={(e) =>
                      setForm({ ...form, booking_date: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Tattoo Description
                </label>
                <textarea
                  value={form.tattoo_description}
                  onChange={(e) =>
                    setForm({ ...form, tattoo_description: e.target.value })
                  }
                  rows={2}
                  placeholder="Style, placement, size..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Deposit (Rp)
                </label>
                <input
                  type="number"
                  value={form.deposit_amount}
                  onChange={(e) =>
                    setForm({ ...form, deposit_amount: e.target.value })
                  }
                  placeholder="500000"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Notes
                </label>
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
                  onClick={() => {
                    setShowCreate(false);
                    setForm(emptyForm);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-zinc-900 transition-colors disabled:cursor-not-allowed"
                >
                  {createLoading ? "Creating..." : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
