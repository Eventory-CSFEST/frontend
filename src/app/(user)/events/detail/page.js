"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Award,
  Printer,
  Ticket,
  Users,
  Megaphone,
} from "lucide-react";
import api, { getStorageUrl } from "@/lib/api";

export default function EventDetailPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState(null);
  const [event, setEvent] = useState(null);
  const [regStatus, setRegStatus] = useState({
    is_registered: false,
    data: null,
    announcements: [],
  });
  const [certificate, setCertificate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async (id, initial = false) => {
    try {
      const evRes = await api.get(`/events/${id}`);
      setEvent(evRes.data.data);

      if (localStorage.getItem("token")) {
        const checkRes = await api.get(`/events/${id}/check-registration`);
        setRegStatus({
          is_registered: checkRes.data.is_registered,
          data: checkRes.data.data,
          announcements: checkRes.data.announcements || [],
        });

        if (
          checkRes.data.data?.is_attended &&
          evRes.data.data.has_certificate
        ) {
          const certRes = await api.get(`/events/${id}/certificate`);
          setCertificate(certRes.data);
        }
      }
    } catch (err) {
      console.error(err);

      if (initial) {
        router.push("/");
      }
    }
  };

  const loadRegistrationStatus = async (id) => {
    try {
      const res = await api.get(`/events/${id}/check-registration`);
      setRegStatus({
        is_registered: res.data.is_registered,
        data: res.data.data,
        announcements: res.data.announcements || [],
      });
    } catch (err) {
      console.error("Gagal memperbarui status registrasi:", err);
    }
  };

  useEffect(() => {
    const savedId = sessionStorage.getItem("selected_event_id");

    if (!savedId) {
      router.push("/");
      return;
    }

    setEventId(savedId);

    loadData(savedId, true);

    const interval = setInterval(() => {
      loadData(savedId);
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  const handleRegister = async () => {
    if (!localStorage.getItem("token")) {
      localStorage.setItem("redirect_after_login", "/events/detail");
      router.push("/login");
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/events/${eventId}/register`);
      await loadData(eventId);
      await loadRegistrationStatus(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mendaftar acara.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pendaftaran acara ini?"))
      return;
    setActionLoading(true);
    try {
      await api.delete(`/events/${eventId}/cancel-registration`);
      await loadData(eventId);
      await loadRegistrationStatus(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membatalkan pendaftaran.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Memuat detail acara...
      </div>
    );
  }

  const hasQuotaLimit =
    event.max_participants !== null &&
    event.max_participants !== undefined &&
    Number(event.max_participants) > 0;
  const currentParticipants = Number(event.participants_count || 0);
  const isQuotaFull =
    hasQuotaLimit && currentParticipants >= Number(event.max_participants);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 mb-4 hover:underline print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Acara
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-0 print:shadow-none print:p-0">
        <div className="print:hidden">
          <img
            src={getStorageUrl(event.thumbnail)}
            alt={event.title}
            className="w-full h-64 sm:h-72 object-cover rounded-xl mb-6"
          />

          <div className="flex flex-wrap gap-2 text-xs font-semibold mb-3">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 uppercase">
              {event.type}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 capitalize">
              {event.status.replace("_", " ")}
            </span>
            {event.has_certificate && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Bersertifikat
              </span>
            )}
            {isQuotaFull && (
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700">
                Kuota Penuh
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            {event.title}
          </h1>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-700 mb-6">
            <p className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Waktu:</strong>{" "}
                {new Date(event.event_date).toLocaleString("id-ID", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
                {" - "}
                {new Date(event.end_date).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </p>
            <p className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>
                  {event.type === "on-site" ? "Lokasi:" : "Link Pertemuan:"}
                </strong>{" "}
                {event.location_or_link}
              </span>
            </p>
            {hasQuotaLimit && (
              <p className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Kuota Peserta:</strong> {currentParticipants} /{" "}
                  {event.max_participants} peserta terdaftar
                </span>
              </p>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
              Deskripsi Acara
            </h3>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed text-sm sm:text-base">
              {event.description}
            </p>
          </div>

          {/* Panel Status Pendaftaran */}
          <div className="border-t border-slate-200 pt-6">
            {!regStatus.is_registered ? (
              <button
                onClick={handleRegister}
                disabled={
                  event.status === "berakhir" || isQuotaFull || actionLoading
                }
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {event.status === "berakhir"
                  ? "Pendaftaran Ditutup"
                  : isQuotaFull
                    ? "Kuota Peserta Penuh"
                    : actionLoading
                      ? "Memproses..."
                      : "Daftar Acara Sekarang"}
              </button>
            ) : (
              <>
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Anda Sudah Terdaftar
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Ticket className="w-3.5 h-3.5" />
                      Kode Tiket:{" "}
                      <span className="font-mono font-bold text-slate-900">
                        {regStatus.data.ticket_code}
                      </span>
                    </p>
                  </div>

                  {!regStatus.data.is_attended ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => router.push("/attend")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                      >
                        Presensi Kehadiran
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="px-3 py-2 text-xs text-red-600 font-medium hover:bg-red-50 rounded-lg"
                      >
                        Batal Ikut
                      </button>
                    </div>
                  ) : (
                    <div className="text-left sm:text-right space-y-1">
                      <span className="inline-block px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                        Status: Hadir (Presensi Tercatat)
                      </span>
                      {regStatus.data.attended_at && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {new Date(regStatus.data.attended_at).toLocaleString(
                            "id-ID",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}{" "}
                          WIB
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Pengumuman Panitia untuk Acara Ini */}
                {regStatus.announcements?.length > 0 && (
                  <div className="mt-5 bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-amber-600" />
                      Pengumuman Panitia ({regStatus.announcements.length})
                    </p>
                    <div className="space-y-2.5">
                      {regStatus.announcements.map((ann) => (
                        <div
                          key={ann.id}
                          className="bg-white p-3.5 rounded-lg border border-amber-200/70 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-slate-900">
                              {ann.subject}
                            </p>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {new Date(ann.created_at).toLocaleString(
                                "id-ID",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                            {ann.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bagian Sertifikat Digital */}
        {certificate && (
          <div className="mt-8 p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl print:mt-0 print:p-0 print:border-0 print:bg-white">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Sertifikat Kepesertaan Digital</span>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>

            {/* Kartu Sertifikat */}
            <div className="border-4 border-amber-400 bg-white p-8 sm:p-12 text-center rounded-xl shadow-sm">
              {certificate.template_url && (
                <img
                  src={certificate.template_url}
                  alt="Template Sertifikat"
                  className="w-full max-h-60 object-contain mx-auto mb-6"
                />
              )}
              <p className="text-xs uppercase tracking-[0.25em] text-amber-600 font-bold mb-1">
                Sertifikat Penghargaan
              </p>
              <p className="text-xs font-mono text-slate-400 mb-6">
                No: {certificate.certificate_number}
              </p>
              <p className="text-sm text-slate-500">Diberikan kepada:</p>
              <h2 className="text-2xl sm:text-3xl font-bold my-2 text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-8">
                {certificate.participant_name}
              </h2>
              <p className="text-sm text-slate-600 mt-5 max-w-lg mx-auto leading-relaxed">
                Telah berpartisipasi aktif sebagai peserta dalam kegiatan{" "}
                <strong className="text-slate-900">
                  {certificate.event_title}
                </strong>{" "}
                yang diselenggarakan pada{" "}
                {new Date(certificate.event_date).toLocaleDateString("id-ID", {
                  dateStyle: "long",
                })}
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}