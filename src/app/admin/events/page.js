"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Award,
  FileDown,
  X,
  CalendarDays,
  Search,
} from "lucide-react";
import api, { getStorageUrl } from "@/lib/api";
import { exportEventsReportPdf } from "@/lib/exportPdf";

function formatDateInput(dateObj) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
}

function getCurrentDateValue() {
  return formatDateInput(new Date());
}

function getLastSevenDaysStartValue() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return formatDateInput(d);
}

function getDateRange(dateValue) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);
  return { start, end };
}

function getOneWeekRange(startDateValue) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDateValue || "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day + 6, 23, 59, 59, 999);

  return {
    start,
    end,
    startSlug: startDateValue,
    endSlug: formatDateInput(end),
  };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // State Pencarian & Filter Tabel Acara
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // State Modal Filter Laporan PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [selectedDate, setSelectedDate] = useState(getCurrentDateValue);
  const [weekStartDate, setWeekStartDate] = useState(getCurrentDateValue);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      router.push("/");
      return;
    }

    try {
      if (JSON.parse(savedUser).role !== "admin") {
        router.push("/");
        return;
      }
    } catch {
      router.push("/");
      return;
    }

    fetchEvents(true);

    const interval = setInterval(() => {
      fetchEvents(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchEvents = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.get("/events");
      setEvents(res.data.data || []);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Gagal memuat daftar acara dari server.",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        ev.title?.toLowerCase().includes(q) ||
        ev.location_or_link?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || ev.status === statusFilter;
      const matchType = !typeFilter || ev.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [events, searchQuery, statusFilter, typeFilter]);

  const openEditAndManage = (id) => {
    sessionStorage.setItem("admin_event_id", String(id));
    router.push("/admin/events/detail");
  };

  const handleDelete = async (id, title) => {
    if (
      !confirm(
        `Yakin ingin menghapus acara "${title}" beserta seluruh data pesertanya?`,
      )
    )
      return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus acara.");
    }
  };

  const pdfFilterResult = useMemo(() => {
    if (filterMode === "date") {
      const range = getDateRange(selectedDate);
      if (!range) {
        return { list: [], periodLabel: "-", fileSuffix: "Tanggal" };
      }

      const list = events.filter((ev) => {
        const start = new Date(ev.event_date);
        const end = ev.end_date ? new Date(ev.end_date) : start;
        return start <= range.end && end >= range.start;
      });

      const formattedDate = range.start.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      return {
        list,
        periodLabel: `Tanggal ${formattedDate}`,
        fileSuffix: `Tanggal-${selectedDate}`,
      };
    }

    if (filterMode === "week") {
      const weekRange = getOneWeekRange(weekStartDate);
      if (!weekRange) {
        return { list: [], periodLabel: "-", fileSuffix: "Per-1-Minggu" };
      }

      const list = events.filter((ev) => {
        const start = new Date(ev.event_date);
        const end = ev.end_date ? new Date(ev.end_date) : start;
        return start <= weekRange.end && end >= weekRange.start;
      });

      const startFmt = weekRange.start.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const endFmt = weekRange.end.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      return {
        list,
        periodLabel: `Per 1 Minggu (${startFmt} - ${endFmt})`,
        fileSuffix: `Per-1-Minggu-${weekRange.startSlug}_sd_${weekRange.endSlug}`,
      };
    }

    return {
      list: events,
      periodLabel: "Semua Periode Acara",
      fileSuffix: `Semua-${getCurrentDateValue()}`,
    };
  }, [events, filterMode, selectedDate, weekStartDate]);

  const handleConfirmExportPdf = () => {
    if (pdfFilterResult.list.length === 0) return;
    exportEventsReportPdf(pdfFilterResult.list, {
      periodLabel: pdfFilterResult.periodLabel,
      fileSuffix: pdfFilterResult.fileSuffix,
    });
    setPdfModalOpen(false);
  };

  const getStatusBadge = (status) => {
    if (status === "berlangsung")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "akan_datang")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const totalParticipants = events.reduce(
    (sum, ev) => sum + (ev.participants_count || 0),
    0,
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard Manajemen Acara
          </h1>
          <p className="text-sm text-slate-500">
            Kelola acara kampus, presensi QR, peserta, dan sertifikat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setPdfModalOpen(true)}
            disabled={loading || events.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            Unduh Laporan PDF
          </button>

          <Link
            href="/admin/events/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Acara
          </Link>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Acara</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {events.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Sedang Berlangsung</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {events.filter((e) => e.status === "berlangsung").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Akan Datang</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {events.filter((e) => e.status === "akan_datang").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Pendaftar</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {totalParticipants}
          </p>
        </div>
      </div>

      {/* Pencarian & Filter Acara */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari judul acara atau lokasi/link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="berlangsung">Berlangsung</option>
              <option value="akan_datang">Akan Datang</option>
              <option value="berakhir">Berakhir</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Jenis</option>
              <option value="on-site">On-Site (Offline)</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* Tabel Acara */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Memuat data acara...
          </p>
        ) : filteredEvents.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {events.length === 0
              ? 'Belum ada acara dibuat. Klik "+ Tambah Acara" untuk memulai.'
              : "Tidak ada acara yang cocok dengan kata kunci atau filter tersebut."}
          </p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
              <tr>
                <th className="p-4">Acara</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Status</th>
                <th className="p-4">Sertifikat</th>
                <th className="p-4">Peserta &amp; Kuota</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getStorageUrl(ev.thumbnail)}
                        alt={ev.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">
                          {ev.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(ev.event_date).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {ev.end_date && (
                            <>
                              {" - "}
                              {new Date(ev.end_date).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase text-nowrap">
                      {ev.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full border capitalize text-xs font-semibold ${getStatusBadge(ev.status)}`}
                    >
                      {ev.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    {ev.has_certificate ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <Award className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Tidak Ada</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-nowrap">
                        <Users className="w-3.5 h-3.5 text-slate-400 " />
                        {ev.participants_count || 0}
                        {ev.max_participants ? ` / ${ev.max_participants}` : ""} daftar
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-semibold text-emerald-700 text-nowrap">
                        {ev.attended_participants_count || 0} absen
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditAndManage(ev.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit &amp; Kelola
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id, ev.title)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Hapus Acara"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Unduh Laporan PDF */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Unduh Laporan PDF
                </h2>
              </div>
              <button
                onClick={() => setPdfModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">
                Pilih Periode Laporan
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    filterMode === "all"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Semua Acara
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("date")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    filterMode === "date"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Per Tanggal
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("week")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    filterMode === "week"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Per 1 Minggu
                </button>
              </div>
            </div>

            {filterMode === "date" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {filterMode === "week" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Mulai (Rentang 1 Minggu / 7 Hari)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWeekStartDate(getCurrentDateValue())}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      Mulai Hari Ini
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() =>
                        setWeekStartDate(getLastSevenDaysStartValue())
                      }
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      7 Hari Terakhir
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500">
                  Periode: <strong>{pdfFilterResult.periodLabel}</strong>
                </p>
              </div>
            )}

            <div
              className={`p-3.5 rounded-xl border text-xs ${
                pdfFilterResult.list.length > 0
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {pdfFilterResult.list.length > 0 ? (
                <>
                  Ditemukan{" "}
                  <strong>{pdfFilterResult.list.length} acara</strong> yang
                  sesuai dengan filter periode ini.
                </>
              ) : (
                <>
                  Tidak ada acara yang berlangsung pada tanggal atau rentang 1
                  minggu tersebut.
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmExportPdf}
                disabled={pdfFilterResult.list.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                Unduh PDF Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}