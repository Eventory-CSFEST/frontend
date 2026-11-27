'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  Lock,
  Printer,
  Eye,
  X,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  QrCode,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

function normalizeCertificateItem(item, user) {
  const event = item.event || item;
  const pivot = item.pivot || item;

  const isAttended = Boolean(
    pivot.is_attended ??
      pivot.attended ??
      (pivot.attended_at !== null && pivot.attended_at !== undefined) ??
      (pivot.status === 'attended' || pivot.status === 'hadir')
  );

  const eventDate = event.event_date || null;
  const year = eventDate ? new Date(eventDate).getFullYear() : new Date().getFullYear();

  return {
    registrationId: pivot.id || item.id || event.id,
    eventId: event.id || pivot.event_id,
    title: event.title || 'Kegiatan Kampus',
    type: event.type || 'on-site',
    status: event.status || 'akan_datang',
    eventDate,
    locationOrLink: event.location_or_link || '-',
    hasCertificate: Boolean(event.has_certificate ?? true),
    isAttended,
    attendedAt:
      pivot.attended_at ||
      (isAttended ? pivot.updated_at || eventDate : null),
    certificateNumber:
      pivot.certificate_number ||
      `CERT/EVT/${year}/${String(event.id || 1).padStart(3, '0')}-${String(
        pivot.id || 1
      ).padStart(4, '0')}`,
    participantName: user?.name || 'Peserta Kegiatan',
    participantNim: user?.nim || '-',
  };
}

export default function CertificatesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loadingCertDetail, setLoadingCertDetail] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !savedUser) {
      router.push('/login');
      return;
    }

    let parsedUser = null;
    try {
      parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    } catch {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/my-events');
        const raw = res.data?.data ?? res.data ?? [];
        const normalized = Array.isArray(raw)
          ? raw
              .map((row) => normalizeCertificateItem(row, parsedUser))
              .filter((row) => row.hasCertificate)
          : [];

        setItems(normalized);
      } catch (err) {
        console.error('Gagal mengambil daftar sertifikat:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const unlockedCerts = useMemo(
    () => items.filter((item) => item.isAttended),
    [items]
  );

  const lockedCerts = useMemo(
    () => items.filter((item) => !item.isAttended),
    [items]
  );

  const handleOpenPreview = async (cert) => {
    setSelectedCert(cert);
    setLoadingCertDetail(true);

    try {
      const res = await api.get(`/events/${cert.eventId}/certificate`);
      const apiData = res.data?.data ?? res.data;

      if (apiData && typeof apiData === 'object') {
        setSelectedCert((prev) => ({
          ...prev,
          certificateNumber:
            apiData.certificate_number || prev.certificateNumber,
          participantName:
            apiData.participant_name ||
            apiData.user?.name ||
            prev.participantName,
          participantNim:
            apiData.nim || apiData.user?.nim || prev.participantNim,
          attendedAt: apiData.attended_at || prev.attendedAt,
          issuedAt: apiData.issued_at || prev.attendedAt,
        }));
      }
    } catch (_) {
      // Tetap gunakan data terverifikasi dari /my-events jika endpoint detail tidak mengembalikan payload tambahan
    } finally {
      setLoadingCertDetail(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '-';
    return (
      new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    );
  };

  return (
    <div className="space-y-8">
      {/* CSS Khusus Cetak Sertifikat */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
        }
      `}</style>

      {/* Header Halaman */}
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
            Sertifikat Digital Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sertifikat diterbitkan otomatis setelah presensi QR Anda terverifikasi
            pada kegiatan kampus.
          </p>
        </div>

        <Link
          href="/attend"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Lihat Log Kehadiran
        </Link>
      </div>

      {/* Ringkasan Status Sertifikat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Sertifikat Terbit
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : unlockedCerts.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Siap dipratinjau, dicetak, atau disimpan sebagai PDF
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menunggu Verifikasi Kehadiran
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : lockedCerts.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Selesaikan presensi QR saat acara berlangsung untuk membuka
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bagian 1: Sertifikat Siap Unduh */}
      <section className="space-y-4 print:hidden">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Sertifikat Terverifikasi ({unlockedCerts.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-4"
              >
                <div className="h-5 w-44 bg-slate-200 rounded-full" />
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-16 w-full bg-slate-100 rounded-xl" />
                <div className="h-10 w-full bg-indigo-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : unlockedCerts.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900">
              Belum Ada Sertifikat yang Terbit
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Setelah kamu menghadiri acara dan melakukan presensi QR Code,
              sertifikat digital resmimu akan langsung muncul di sini.
            </p>
            <div className="pt-2">
              <Link
                href="/attend"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <QrCode className="w-4 h-4" />
                Isi Presensi QR Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {unlockedCerts.map((cert) => (
              <div
                key={`${cert.registrationId}-${cert.eventId}`}
                className="bg-white rounded-2xl border border-emerald-200/90 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Terbit &amp; Sah
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {cert.certificateNumber}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {cert.title}
                  </h3>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>
                        Tanggal Acara: <strong>{formatDate(cert.eventDate)}</strong>
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Presensi Tercatat:{' '}
                        <strong>{formatTimestamp(cert.attendedAt)}</strong>
                      </span>
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cert.locationOrLink}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPreview(cert)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  <Eye className="w-4 h-4" />
                  Buka &amp; Cetak Sertifikat
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bagian 2: Sertifikat Terkunci (Belum Presensi) */}
      {!loading && lockedCerts.length > 0 && (
        <section className="space-y-4 print:hidden">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-400" />
            Sertifikat Terkunci ({lockedCerts.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedCerts.map((cert) => (
              <div
                key={`locked-${cert.registrationId}-${cert.eventId}`}
                className="bg-white/80 rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    Wajib Presensi QR
                  </span>
                  <h3 className="font-bold text-slate-800">{cert.title}</h3>
                  <p className="text-xs text-slate-500">
                    Jadwal: {formatDate(cert.eventDate)}
                  </p>
                </div>

                {cert.status !== 'berakhir' && (
                  <Link
                    href="/attend"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Presensi QR
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal Pratinjau & Cetak Sertifikat Digital */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Toolbar Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div>
                <h3 className="font-bold text-slate-900">
                  Pratinjau Sertifikat Digital Resmi
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih &ldquo;Simpan sebagai PDF&rdquo; pada dialog cetak untuk
                  mengunduh file PDF.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lembar Sertifikat (Area Cetak) */}
            <div id="printable-certificate">
              <div className="w-full aspect-[1.414/1] bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border-[10px] border-double border-indigo-950 rounded-2xl p-6 sm:p-12 flex flex-col justify-between text-center relative overflow-hidden shadow-inner">
                {/* Dekorasi Sudut */}
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-600/5" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-500/10" />

                {/* Kop Sertifikat */}
                <div className="space-y-1.5 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Eventory Smart Campus Platform
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-wide text-indigo-950 uppercase pt-2">
                    Sertifikat Kepesertaan
                  </h2>
                  <p className="text-[11px] sm:text-xs font-mono text-slate-500">
                    Nomor: {selectedCert.certificateNumber}
                  </p>
                </div>

                {/* Isi Utama Penerima */}
                <div className="space-y-3 my-auto py-4 relative z-10">
                  <p className="text-xs sm:text-sm text-slate-600">
                    Diberikan dengan bangga kepada:
                  </p>
                  <div className="space-y-1">
                    <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight border-b-2 border-amber-400 inline-block px-6 pb-1">
                      {loadingCertDetail
                        ? 'Memuat data...'
                        : selectedCert.participantName}
                    </p>
                    {selectedCert.participantNim &&
                      selectedCert.participantNim !== '-' && (
                        <p className="text-xs sm:text-sm font-semibold text-slate-500">
                          NIM: {selectedCert.participantNim}
                        </p>
                      )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto pt-2 leading-relaxed">
                    Atas partisipasi aktif sebagai <strong>Peserta</strong>{' '}
                    dalam kegiatan kampus:
                  </p>
                  <p className="text-base sm:text-2xl font-bold text-indigo-900 max-w-2xl mx-auto">
                    &ldquo;{selectedCert.title}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500">
                    Diselenggarakan pada{' '}
                    <strong>{formatDate(selectedCert.eventDate)}</strong> (
                    {selectedCert.type.toUpperCase()})
                  </p>
                </div>

                {/* Footer & Stem Verifikasi */}
                <div className="flex items-end justify-between gap-4 pt-4 border-t border-slate-200/80 text-left relative z-10">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Terverifikasi Sistem Presensi QR</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Waktu Kehadiran:{' '}
                      {formatTimestamp(selectedCert.attendedAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-950">
                      Panitia Penyelenggara
                    </p>
                    <p className="text-[11px] text-slate-500 mt-4">
                      Dokumen sah diterbitkan secara elektronik oleh Eventory
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}