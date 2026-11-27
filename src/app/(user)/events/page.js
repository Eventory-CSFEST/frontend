'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Award,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import api, { getStorageUrl } from '@/lib/api';

const ITEMS_PER_PAGE = 6;

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Mengambil daftar acara dari backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const response = await api.get('/events');

        // Sesuaikan dengan struktur response backend
        const data = response.data.data ?? response.data;

        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Gagal mengambil daftar acara:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Reset ke halaman 1 setiap kali kata kunci pencarian atau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterStatus]);

  // Filter pencarian dan kategori
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        ev.title?.toLowerCase().includes(keyword) ||
        ev.location_or_link?.toLowerCase().includes(keyword);

      const matchesType =
        !filterType || ev.type === filterType;

      const matchesStatus =
        !filterStatus || ev.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, search, filterType, filterStatus]);

  // Hitung total halaman & potong data sesuai halaman aktif
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedEvents = useMemo(() => {
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEvents, startIndex]);

  // Susun nomor halaman (dengan elipsis '...' jika halaman lebih dari 5)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);

    const catalogEl = document.getElementById('katalog-acara');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Badge status acara
  const getStatusBadge = (status) => {
    const styles = {
      akan_datang:
        'bg-blue-50 text-blue-600 border-blue-100',
      berlangsung:
        'bg-emerald-50 text-emerald-600 border-emerald-100',
      berakhir:
        'bg-slate-100 text-slate-500 border-slate-200',
    };

    return styles[status] || styles.berakhir;
  };

  // Navigasi ke halaman detail acara
  const openDetail = (id) => {
    sessionStorage.setItem('selected_event_id', String(id));
    router.push('/events/detail');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header halaman */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Jelajahi Acara Kampus
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Pilih kegiatan yang tersedia dan daftarkan dirimu sekarang.
          </p>
        </div>

        {/* Search dan filter */}
        <section
          id="katalog-acara"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Katalog Acara
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Temukan acara yang sesuai dengan minatmu.
              </p>
            </div>

            {loading ? (
              <div className="h-7 w-32 bg-slate-200 rounded-full animate-pulse self-start" />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full self-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {events.length} Acara Tersedia
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

              <input
                type="text"
                placeholder="Cari nama acara atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter jenis */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">
                Semua Jenis (On-Site &amp; Online)
              </option>
              <option value="on-site">
                On-Site (Offline)
              </option>
              <option value="online">
                Online
              </option>
            </select>

            {/* Filter status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Status Acara</option>
              <option value="akan_datang">Akan Datang</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="berakhir">Sudah Berakhir</option>
            </select>
          </div>
        </section>

        {/* Daftar acara */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col animate-pulse"
              >
                {/* Skeleton Thumbnail */}
                <div className="w-full h-48 bg-slate-200" />

                {/* Skeleton Informasi Acara */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                      <div className="h-5 w-24 bg-slate-100 rounded-full" />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="h-5 w-full bg-slate-200 rounded-lg" />
                      <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                    </div>

                    <div className="space-y-2">
                      <div className="h-3.5 w-40 bg-slate-100 rounded" />
                      <div className="h-3.5 w-48 bg-slate-100 rounded" />
                      <div className="h-3.5 w-32 bg-slate-100 rounded" />
                    </div>
                  </div>

                  <div className="mt-5 h-10 w-full bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            Belum ada acara yang sesuai dengan pencarian.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paginatedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative">
                    <img
                      src={getStorageUrl(ev.thumbnail)}
                      alt={ev.title}
                      className="w-full h-48 object-cover"
                    />

                    {ev.has_certificate && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-emerald-700 text-xs font-semibold shadow-sm">
                        <Award className="w-3.5 h-3.5" />
                        Sertifikat
                      </span>
                    )}
                  </div>

                  {/* Informasi acara */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                          {ev.type}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full border capitalize ${getStatusBadge(ev.status)}`}
                        >
                          {ev.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-3">
                        {ev.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-500">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                          {new Date(ev.event_date).toLocaleString(
                            'id-ID',
                            {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }
                          )}
                        </p>

                        <p className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                          <span className="truncate">
                            {ev.location_or_link}
                          </span>
                        </p>

                        <p className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                          {ev.participants_count || 0} peserta terdaftar
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openDetail(ev.id)}
                      className="mt-5 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                      Lihat Detail &amp; Daftar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs sm:text-sm text-slate-500">
                  Menampilkan{' '}
                  <span className="font-semibold text-slate-700">
                    {startIndex + 1}
                  </span>
                  &ndash;
                  <span className="font-semibold text-slate-700">
                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length)}
                  </span>{' '}
                  dari{' '}
                  <span className="font-semibold text-slate-700">
                    {filteredEvents.length}
                  </span>{' '}
                  acara
                </p>

                <nav
                  aria-label="Navigasi halaman katalog acara"
                  className="flex items-center gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Halaman sebelumnya"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  {pageNumbers.map((page, index) =>
                    page === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2.5 py-2 text-xs sm:text-sm text-slate-400 select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`min-w-[36px] h-9 px-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman berikutnya"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}