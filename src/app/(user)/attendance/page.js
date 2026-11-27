"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  QrCode,
  Award,
  Search,
  Printer,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  XCircle,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";

const ITEMS_PER_PAGE = 8;

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !savedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      router.push("/login");
      return;
    }

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.get("/my-events");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];

        const sorted = [...list].sort((a, b) => {
          const timeA = new Date(
            a.attended_at || a.event?.event_date || a.created_at || 0,
          ).getTime();
          const timeB = new Date(
            b.attended_at || b.event?.event_date || b.created_at || 0,
          ).getTime();
          return timeB - timeA;
        });

        setRecords(sorted);
      } catch (err) {
        console.error("Gagal memuat riwayat kehadiran:", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const attended = records.filter((r) => Boolean(r.is_attended)).length;
    const pending = records.filter(
      (r) => !r.is_attended && r.event?.status !== "berakhir",
    ).length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { total, attended, pending, rate };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const ev = item.event;
      if (!ev) return false;

      const q = search.toLowerCase();
      const matchSearch =
        ev.title?.toLowerCase().includes(q) ||
        ev.location_or_link?.toLowerCase().includes(q) ||
        item.ticket_code?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "attended" && item.is_attended) ||
        (statusFilter === "unattended" && !item.is_attended);

      const matchType = !typeFilter || ev.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [records, search, statusFilter, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / ITEMS_PER_PAGE),
  );

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const formatFullDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCompactDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return (
      new Date(dateStr).toLocaleString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  const formatCompactDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return (
      new Date(dateStr).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  const openDetail = (eventId) => {
    sessionStorage.setItem("selected_event_id", String(eventId));
    router.push("/events/detail");
  };

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Aturan margin & repeating header saat print */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
          thead {
            display: table-header-group;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Kop Cetak Transkrip Aktivitas Kampus */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
              Eventory &mdash; Smart Campus Event Management Platform
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Transkrip Riwayat Kehadiran Kegiatan Kampus
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 text-right shrink-0">
            Dicetak:{" "}
            {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
          </p>
        </div>

        {user && (
          <div className="mt-3 grid grid-cols-3 gap-3 bg-slate-50 p-2.5 rounded-lg text-xs border border-slate-300">
            <div>
              <span className="text-slate-500 text-[10px] uppercase">
                Nama Lengkap
              </span>
              <p className="font-bold text-slate-900">{user.name}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">NIM</span>
              <p className="font-bold text-slate-900">{user.nim || "-"}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">
                Email Akademik
              </span>
              <p className="font-bold text-slate-900">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Header Halaman (Mode Layar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Riwayat Kehadiran &amp; Presensi QR
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catatan lengkap tanggal, jam presensi QR, dan kegiatan kampus yang
            Anda ikuti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Cetak Rekap SKPI ({filteredRecords.length})
          </button>

          <Link
            href="/attend"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            Scan QR Sekarang
          </Link>
        </div>
      </div>

      {/* Ringkasan Statistik (4 Kolom Sejajar saat Print) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5">
        <div className="bg-white p-5 print:p-3 rounded-2xl print:rounded-lg border border-slate-200 shadow-sm print:shadow-none">
          <p className="text-xs print:text-[10px] font-medium text-slate-500">
            Total Terdaftar
          </p>
          <p className="text-3xl print:text-xl font-extrabold text-slate-900 mt-1">
            {loading ? "..." : stats.total}
          </p>
          <p className="text-xs text-slate-400 mt-1 print:hidden">
            Acara yang diikuti
          </p>
        </div>

        <div className="bg-white p-5 print:p-3 rounded-2xl print:rounded-lg border border-emerald-200/80 shadow-sm print:shadow-none">
          <p className="text-xs print:text-[10px] font-medium text-emerald-700">
            Hadir Terverifikasi
          </p>
          <p className="text-3xl print:text-xl font-extrabold text-emerald-600 mt-1">
            {loading ? "..." : stats.attended}
          </p>
          <p className="text-xs text-slate-400 mt-1 print:hidden">
            Presensi QR tercatat
          </p>
        </div>

        <div className="bg-white p-5 print:p-3 rounded-2xl print:rounded-lg border border-amber-200/80 shadow-sm print:shadow-none">
          <p className="text-xs print:text-[10px] font-medium text-amber-700">
            Menunggu Presensi
          </p>
          <p className="text-3xl print:text-xl font-extrabold text-amber-600 mt-1">
            {loading ? "..." : stats.pending}
          </p>
          <p className="text-xs text-slate-400 mt-1 print:hidden">
            Acara belum absen
          </p>
        </div>

        <div className="bg-white p-5 print:p-3 rounded-2xl print:rounded-lg border border-indigo-200/80 shadow-sm print:shadow-none">
          <p className="text-xs print:text-[10px] font-medium text-indigo-700">
            Rasio Kehadiran
          </p>
          <p className="text-3xl print:text-xl font-extrabold text-indigo-600 mt-1">
            {loading ? "..." : `${stats.rate}%`}
          </p>
          <p className="text-xs text-slate-400 mt-1 print:hidden">
            Tingkat partisipasi aktif
          </p>
        </div>
      </div>

      {/* Filter & Pencarian (Mode Layar) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama acara, lokasi, atau kode tiket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { key: "all", label: "Semua" },
              { key: "attended", label: "Sudah Hadir" },
              { key: "unattended", label: "Belum Hadir" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  statusFilter === tab.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Jenis Acara</option>
              <option value="on-site">On-Site (Offline)</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. TABEL KHUSUS CETAK / PDF (Muncul hanya saat di-print)          */}
      {/* ================================================================= */}
      <div className="hidden print:block">
        <table className="w-full border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-800 text-left">
              <th className="border border-slate-300 px-2.5 py-2 w-9 text-center">
                No
              </th>
              <th className="border border-slate-300 px-2.5 py-2">
                Nama Kegiatan &amp; Kode Tiket
              </th>
              <th className="border border-slate-300 px-2.5 py-2 w-28">
                Tanggal Acara
              </th>
              <th className="border border-slate-300 px-2.5 py-2 w-36">
                Waktu Presensi QR
              </th>
              <th className="border border-slate-300 px-2.5 py-2 w-28 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((item, idx) => {
              const ev = item.event;
              if (!ev) return null;
              const isAbsentFinal = !item.is_attended && ev.status === "berakhir";

              return (
                <tr key={item.id} className="even:bg-slate-50/60">
                  <td className="border border-slate-300 px-2.5 py-2 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2">
                    <p className="font-bold text-slate-900">{ev.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Tiket: <span className="font-mono">{item.ticket_code}</span>{" "}
                      &bull; {ev.type.toUpperCase()} &bull; {ev.location_or_link}
                    </p>
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2 text-slate-700">
                    {formatCompactDate(ev.event_date)}
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2 text-slate-700">
                    {item.is_attended && item.attended_at
                      ? formatCompactDateTime(item.attended_at)
                      : "-"}
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2 text-center font-semibold">
                    {item.is_attended ? (
                      <span className="text-emerald-700">Hadir</span>
                    ) : isAbsentFinal ? (
                      <span className="text-red-600">Tidak Hadir</span>
                    ) : (
                      <span className="text-amber-700">Belum Absen</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 flex justify-between items-end text-[10px] text-slate-500 break-inside-avoid">
          <p>
            Dokumen ini dihasilkan secara otomatis oleh sistem Eventory sebagai
            bukti rekap partisipasi kegiatan kampus.
          </p>
          <div className="text-center w-48">
            <p>Mahasiswa Bersangkutan,</p>
            <div className="h-12" />
            <p className="font-bold text-slate-800 border-t border-slate-400 pt-1">
              {user?.name}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. DAFTAR KARTU + PAGINATION (Hanya tampil di layar)              */}
      {/* ================================================================= */}
      <div className="print:hidden">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3"
              >
                <div className="h-5 w-44 bg-slate-200 rounded-full" />
                <div className="h-6 w-2/3 bg-slate-200 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900">
              Tidak Ada Catatan Kehadiran Ditemukan
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Setiap acara yang Anda ikuti beserta tanggal dan jam presensi QR
              akan tercatat secara kronologis di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRecords.map((item) => {
              const ev = item.event;
              if (!ev) return null;

              const isAbsentFinal =
                !item.is_attended && ev.status === "berakhir";

              return (
                <div
                  key={item.id}
                  className={`bg-white p-6 rounded-2xl border shadow-sm transition ${
                    item.is_attended
                      ? "border-emerald-200/90"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.is_attended ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hadir Terverifikasi
                          </span>
                        ) : isAbsentFinal ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            Tidak Melakukan Presensi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            Menunggu Presensi QR
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase">
                          {ev.type}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
                          <Ticket className="w-3 h-3 text-slate-400" />
                          {item.ticket_code}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {ev.title}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                              Tanggal Pelaksanaan Acara
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                              {formatFullDate(ev.event_date)}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${
                            item.is_attended
                              ? "bg-emerald-50/70 border-emerald-200/80"
                              : "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <ShieldCheck
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              item.is_attended
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          />
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                              Waktu Kehadiran Tercatat
                            </p>
                            <p
                              className={`text-xs sm:text-sm font-semibold mt-0.5 ${
                                item.is_attended
                                  ? "text-emerald-800"
                                  : "text-slate-500"
                              }`}
                            >
                              {item.is_attended && item.attended_at
                                ? formatDateTime(item.attended_at)
                                : "Belum melakukan scan QR"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {ev.location_or_link}
                        </span>
                        {item.created_at && (
                          <span>
                            &bull; Mendaftar pada{" "}
                            {formatDateTime(item.created_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-2.5 shrink-0">
                      {item.is_attended && ev.has_certificate && (
                        <Link
                          href={`/certificates?event_id=${ev.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
                        >
                          <Award className="w-4 h-4" />
                          Lihat Sertifikat
                        </Link>
                      )}

                      {!item.is_attended && ev.status !== "berakhir" && (
                        <Link
                          href="/attend"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                          <QrCode className="w-4 h-4" />
                          Isi Presensi QR
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => openDetail(ev.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                      >
                        <span>Detail Acara</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Kontrol Pagination (Muncul otomatis jika > 8 kegiatan) */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600">
                <p>
                  Menampilkan{" "}
                  <strong>
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredRecords.length,
                    )}
                  </strong>{" "}
                  dari <strong>{filteredRecords.length}</strong> kegiatan
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Sebelumnya
                  </button>

                  <span className="px-3 py-1.5 font-semibold text-slate-800">
                    Hal {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Berikutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}