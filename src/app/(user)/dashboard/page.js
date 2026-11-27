"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  Clock,
  Award,
  QrCode,
  UserCircle2,
  Trash2,
  ArrowUpRight,
  Megaphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api, { getStorageUrl } from "@/lib/api";

const INITIAL_ANNOUNCEMENT_LIMIT = 3;

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState({});
  const [activeTab, setActiveTab] = useState("explore");
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const [myRes, allRes, annRes] = await Promise.all([
        api.get("/my-events"),
        api.get("/events"),
        api.get("/my-announcements"),
      ]);

      setMyEvents(myRes.data.data || []);
      setAllEvents(allRes.data.data || []);
      setAnnouncements(annRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.push("/login");
      return;
    }

    let parsedUser;

    try {
      parsedUser = JSON.parse(savedUser);
    } catch {
      router.push("/login");
      return;
    }

    if (parsedUser.role === "admin") {
      router.push("/admin/events");
      return;
    }

    setUser(parsedUser);
    loadDashboardData(true);

    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  const openEventDetail = (eventId) => {
    sessionStorage.setItem("selected_event_id", String(eventId));
    router.push("/events/detail");
  };

  const handleCancelRegistration = async (eventId, title) => {
    if (!confirm(`Batalkan pendaftaran pada acara "${title}"?`)) return;
    try {
      await api.delete(`/events/${eventId}/cancel-registration`);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membatalkan pendaftaran.");
    }
  };

  const toggleExpandAnnouncement = (id) => {
    setExpandedAnnouncementIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!user) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 h-28" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 h-28" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 h-28" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 h-28" />
        </div>
      </div>
    );
  }

  const totalJoined = myEvents.length;
  const totalAttended = myEvents.filter((item) => item.is_attended).length;
  const totalCertificates = myEvents.filter(
    (item) => item.is_attended && item.event?.has_certificate,
  ).length;

  const visibleAnnouncements = showAllAnnouncements
    ? announcements
    : announcements.slice(0, INITIAL_ANNOUNCEMENT_LIMIT);

  return (
    <div className="space-y-8">
      {/* Header Profil & Aksi Cepat */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Dashboard Mahasiswa
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Selamat datang, {user.name}!
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {user.nim ? `NIM: ${user.nim} • ` : ""}
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/attend"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <QrCode className="w-4 h-4" />
            Presensi QR
          </Link>
        </div>
      </div>

      {/* Pengumuman dari Panitia (Ringkas & Dapat Diperluas) */}
      {announcements.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600" />
              Pengumuman Kegiatan ({announcements.length})
            </h2>

            {announcements.length > INITIAL_ANNOUNCEMENT_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllAnnouncements((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/70 px-2.5 py-1 rounded-lg transition"
              >
                {showAllAnnouncements ? (
                  <>
                    Ringkas
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Lihat Semua ({announcements.length})
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          <div
            className={`space-y-2 pr-1 ${
              showAllAnnouncements ? "max-h-80 overflow-y-auto" : ""
            }`}
          >
            {visibleAnnouncements.map((ann) => {
              const isExpanded = !!expandedAnnouncementIds[ann.id];
              const isLongText = (ann.message || "").length > 140;

              return (
                <div
                  key={ann.id}
                  className="bg-white px-3.5 py-3 rounded-xl border border-amber-200/80 shadow-2xs space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 truncate">
                      {ann.event?.title}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(ann.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      WIB
                    </span>
                  </div>

                  <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {ann.subject}
                  </p>

                  <p
                    className={`text-xs text-slate-600 whitespace-pre-line leading-relaxed ${
                      isExpanded ? "" : "line-clamp-2"
                    }`}
                  >
                    {ann.message}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {isLongText ? (
                      <button
                        type="button"
                        onClick={() => toggleExpandAnnouncement(ann.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        {isExpanded ? "Tutup pesan" : "Baca selengkapnya"}
                      </button>
                    ) : (
                      <span />
                    )}

                    {ann.event?.id && (
                      <button
                        type="button"
                        onClick={() => openEventDetail(ann.event.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Buka Acara &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ringkasan Statistik Mahasiswa (Interaktif) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("my-events")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Acara Terdaftar</p>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition">
              Lihat
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {totalJoined}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Total kegiatan yang diikuti
          </p>
        </button>

        <Link
          href="/attendance"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Kehadiran Tercatat
            </p>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition">
              Riwayat
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {totalAttended}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Klik untuk lihat tanggal &amp; log QR
          </p>
        </Link>

        <Link
          href="/certificates"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Sertifikat Digital
            </p>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition">
              Buka
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-indigo-600 mt-1">
            {totalCertificates}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Siap dipratinjau, diunduh &amp; dicetak
          </p>
        </Link>
      </div>

      {/* Navigasi Tab */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("explore")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "explore"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Jelajahi Acara ({allEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("my-events")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "my-events"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Acara Saya ({myEvents.length})
        </button>
      </div>

      {/* Konten Tab */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"
            >
              <div className="w-full h-44 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 bg-slate-200 rounded-full" />
                <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-9 w-full bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "my-events" ? (
        /* TAB 1: DAFTAR ACARA YANG DIIKUTI USER */
        myEvents.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
            <p className="text-slate-600 font-medium">
              Anda belum mendaftar di acara mana pun.
            </p>
            <p className="text-xs text-slate-400">
              Temukan seminar, workshop, atau lomba kampus yang menarik untuk
              diikuti.
            </p>
            <button
              onClick={() => setActiveTab("explore")}
              className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Lihat Daftar Acara
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map((item) => {
              const ev = item.event;
              if (!ev) return null;
              const certReady = item.is_attended && ev.has_certificate;

              return (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img
                      src={getStorageUrl(ev.thumbnail)}
                      alt={ev.title}
                      className="w-full sm:w-32 h-24 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                          {ev.type}
                        </span>
                        {item.is_attended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sudah Absen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            Belum Absen
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {ev.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
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
                        </span>
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-indigo-500" />
                          Tiket:{" "}
                          <strong className="font-mono text-slate-700">
                            {item.ticket_code}
                          </strong>
                        </span>
                      </div>

                      {item.is_attended && item.attended_at && (
                        <p className="text-xs font-medium text-emerald-700 pt-0.5">
                          Hadir pada:{" "}
                          <strong>
                            {new Date(item.attended_at).toLocaleString(
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
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {certReady && (
                      <Link
                        href={`/certificates?event_id=${ev.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
                      >
                        <Award className="w-4 h-4" />
                        Lihat Sertifikat
                      </Link>
                    )}

                    {!item.is_attended && ev.status === "berlangsung" && (
                      <Link
                        href="/attend"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                      >
                        <QrCode className="w-4 h-4" />
                        Absen Sekarang
                      </Link>
                    )}

                    <button
                      onClick={() => openEventDetail(ev.id)}
                      className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                    >
                      Detail Acara
                    </button>

                    {!item.is_attended && (
                      <button
                        onClick={() =>
                          handleCancelRegistration(ev.id, ev.title)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                        title="Batalkan Pendaftaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TAB 2: JELAJAHI SEMUA ACARA */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
            >
              <img
                src={getStorageUrl(ev.thumbnail)}
                alt={ev.title}
                className="w-full h-44 object-cover"
              />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                      {ev.type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {ev.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">
                    {ev.title}
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ev.location_or_link}</span>
                  </p>
                </div>

                <button
                  onClick={() => openEventDetail(ev.id)}
                  className="mt-4 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Lihat Detail &amp; Daftar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}