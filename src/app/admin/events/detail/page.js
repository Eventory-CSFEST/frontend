"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Users,
  UserCheck,
  Save,
  Eye,
  Award,
  Send,
  Download,
  Printer,
  Megaphone,
  FileDown,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import api, { getStorageUrl } from "@/lib/api";
import {
  exportEventParticipantsPdf,
  exportEventParticipantsCsv,
} from "@/lib/exportPdf";

function formatForDateTimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventDetailPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState(null);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attended, setAttended] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [newThumbnail, setNewThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [newCertTemplate, setNewCertTemplate] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pencarian Peserta
  const [registeredSearch, setRegisteredSearch] = useState("");
  const [attendedSearch, setAttendedSearch] = useState("");

  // Modal Simulasi Sertifikat
  const [certSimOpen, setCertSimOpen] = useState(false);

  // Modal Broadcast Pengumuman
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Modal Edit Pengumuman
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editAnnForm, setEditAnnForm] = useState({
    target: "all",
    subject: "",
    message: "",
  });
  const [editAnnLoading, setEditAnnLoading] = useState(false);

  // Loading aksi per peserta
  const [busyParticipantId, setBusyParticipantId] = useState(null);

  const loadAnnouncements = async (id) => {
    try {
      const res = await api.get(`/events/${id}/announcements`);
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error("Gagal memuat riwayat pengumuman:", err);
    }
  };

  const loadAll = async (id) => {
    try {
      const [evRes, partRes, attRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/events/${id}/participants`),
        api.get(`/events/${id}/attended`),
      ]);
      const data = evRes.data.data;
      setEvent({
        ...data,
        event_date_input: formatForDateTimeLocal(data.event_date),
        end_date_input: formatForDateTimeLocal(data.end_date),
        max_participants_input: data.max_participants ?? "",
      });
      setParticipants(partRes.data.data || []);
      setAttended(attRes.data.data || []);
      await loadAnnouncements(id);
    } catch (_) {
      router.push("/admin/events");
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser || JSON.parse(savedUser).role !== "admin") {
      router.push("/");
      return;
    }

    const savedId = sessionStorage.getItem("admin_event_id");
    if (!savedId) {
      router.push("/admin/events");
      return;
    }

    setEventId(savedId);
    loadAll(savedId);
  }, [router]);

  const filteredRegistered = useMemo(() => {
    const q = registeredSearch.toLowerCase();
    return participants.filter(
      (p) =>
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.nim?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.ticket_code?.toLowerCase().includes(q),
    );
  }, [participants, registeredSearch]);

  const filteredAttended = useMemo(() => {
    const q = attendedSearch.toLowerCase();
    return attended.filter(
      (a) =>
        a.user?.name?.toLowerCase().includes(q) ||
        a.user?.nim?.toLowerCase().includes(q) ||
        a.user?.email?.toLowerCase().includes(q) ||
        a.certificate_number?.toLowerCase().includes(q),
    );
  }, [attended, attendedSearch]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0] || null;
    setNewThumbnail(file);
    setThumbPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleCertTemplateChange = (e) => {
    const file = e.target.files?.[0] || null;
    setNewCertTemplate(file);
    if (file && file.type.startsWith("image/")) {
      setCertPreview(URL.createObjectURL(file));
    } else {
      setCertPreview(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (
      !event.event_date_input ||
      !event.end_date_input ||
      new Date(event.end_date_input) <= new Date(event.event_date_input)
    ) {
      alert("Waktu selesai harus lebih besar dari waktu mulai.");
      return;
    }
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", event.title);
      formData.append("description", event.description);
      formData.append("type", event.type);
      formData.append("location_or_link", event.location_or_link);
      formData.append("event_date", event.event_date_input);
      formData.append("end_date", event.end_date_input);
      formData.append("max_participants", event.max_participants_input ?? "");
      formData.append("has_certificate", event.has_certificate ? "1" : "0");

      if (newThumbnail) formData.append("thumbnail", newThumbnail);
      if (newCertTemplate)
        formData.append("certificate_template", newCertTemplate);

      await api.post(`/events/${eventId}`, formData);

      setNewThumbnail(null);
      setThumbPreview(null);
      setNewCertTemplate(null);
      setCertPreview(null);
      alert("Perubahan acara berhasil disimpan!");
      loadAll(eventId);
    } catch (err) {
      const firstValidationError = err.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]?.[0]
        : null;
      alert(
        firstValidationError ||
          err.response?.data?.message ||
          "Gagal memperbarui acara.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Presensi Manual oleh Admin
  const handleMarkAttended = async (participantId, name) => {
    if (!confirm(`Tandai "${name}" sebagai HADIR secara manual?`)) return;
    setBusyParticipantId(participantId);
    try {
      const res = await api.post(
        `/events/${eventId}/participants/${participantId}/attend`,
      );
      alert(res.data?.message || "Kehadiran berhasil dicatat.");
      loadAll(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mencatat kehadiran.");
    } finally {
      setBusyParticipantId(null);
    }
  };

  // Terbitkan & Kirim Sertifikat ke Peserta
  const handleIssueOrSendCertificate = async (participantId, name) => {
    if (
      !confirm(
        `Terbitkan / kirim ulang sertifikat digital untuk "${name}"?`,
      )
    )
      return;
    setBusyParticipantId(participantId);
    try {
      const res = await api.post(
        `/events/${eventId}/participants/${participantId}/certificate`,
      );
      alert(res.data?.message || "Sertifikat berhasil diterbitkan.");
      loadAll(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memproses sertifikat.");
    } finally {
      setBusyParticipantId(null);
    }
  };

  const handleRemoveParticipant = async (participantId, name) => {
    if (!confirm(`Hapus peserta "${name}" dari daftar acara ini?`)) return;
    try {
      await api.delete(`/events/${eventId}/participants/${participantId}`);
      loadAll(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus peserta.");
    }
  };

  // Broadcast Pengumuman
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setSendingBroadcast(true);
    try {
      const res = await api.post(`/events/${eventId}/broadcast`, {
        subject: broadcastSubject,
        message: broadcastMessage,
        target: broadcastTarget,
      });
      alert(res.data?.message || "Pengumuman berhasil dikirim.");
      setBroadcastOpen(false);
      setBroadcastSubject("");
      setBroadcastMessage("");
      await loadAnnouncements(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengirim pengumuman.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Buka Modal Edit Pengumuman
  const openEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    setEditAnnForm({
      target: ann.target || "all",
      subject: ann.subject || "",
      message: ann.message || "",
    });
  };

  // Simpan Perubahan Pengumuman
  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    setEditAnnLoading(true);
    try {
      const res = await api.put(
        `/events/${eventId}/announcements/${editingAnnouncement.id}`,
        editAnnForm,
      );
      alert(res.data?.message || "Pengumuman berhasil diperbarui.");
      setEditingAnnouncement(null);
      await loadAnnouncements(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui pengumuman.");
    } finally {
      setEditAnnLoading(false);
    }
  };

  // Hapus Pengumuman
  const handleDeleteAnnouncement = async (announcementId) => {
    if (
      !confirm(
        "Hapus pengumuman ini? Pengumuman juga akan hilang dari halaman peserta.",
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(
        `/events/${eventId}/announcements/${announcementId}`,
      );
      alert(res.data?.message || "Pengumuman berhasil dihapus.");
      await loadAnnouncements(eventId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus pengumuman.");
    }
  };

  // Unduh Poster QR PNG Resolusi Tinggi
  const handleDownloadQrPoster = () => {
    const svgEl = document.getElementById("event-qr-svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1040;
      const ctx = canvas.getContext("2d");

      // Latar Putih
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header Indigo
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, 0, canvas.width, 170);

      ctx.fillStyle = "#a5b4fc";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("EVENTORY • PRESENSI KEHADIRAN RESMI", 400, 68);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("SCAN QR CODE PRESENSI", 400, 124);

      // Judul Acara
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 30px sans-serif";
      const displayTitle =
        event.title.length > 42
          ? event.title.slice(0, 42) + "..."
          : event.title;
      ctx.fillText(displayTitle, 400, 245);

      // Jadwal & Lokasi
      ctx.fillStyle = "#475569";
      ctx.font = "20px sans-serif";
      const dateLabel = new Date(event.event_date).toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
      });
      ctx.fillText(`${dateLabel} WIB • ${event.location_or_link}`, 400, 290);

      // Bingkai QR
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 4;
      ctx.strokeRect(180, 340, 440, 440);

      // Gambar QR
      ctx.drawImage(img, 200, 360, 400, 400);

      // Token Box
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(140, 825, 520, 75);
      ctx.fillStyle = "#334155";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`TOKEN: ${event.qr_token}`, 400, 870);

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "18px sans-serif";
      ctx.fillText(
        "Buka menu Presensi QR pada aplikasi Eventory untuk melakukan absensi",
        400,
        960,
      );

      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      const slug = event.title.replace(/[^a-zA-Z0-9-_]+/g, "-");
      link.download = `Poster-QR-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  };

  const copyToken = () => {
    navigator.clipboard.writeText(event.qr_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!event) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Memuat data manajemen acara...
      </div>
    );
  }

  const activeTemplateUrl =
    certPreview ||
    (event.certificate_template
      ? getStorageUrl(event.certificate_template)
      : null);

  return (
    <div className="space-y-8">
      {/* CSS Cetak Poster QR */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-poster,
          #printable-qr-poster * {
            visibility: visible;
          }
          #printable-qr-poster {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            z-index: 9999;
          }
        }
      `}</style>

      {/* Top Bar Navigasi & Aksi Cepat Acara */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => router.push("/admin/events")}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Admin
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition"
          >
            <Megaphone className="w-4 h-4" />
            Kirim Pengumuman Peserta
          </button>

          <button
            type="button"
            onClick={() => exportEventParticipantsPdf(event, participants)}
            disabled={participants.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            Export Absensi PDF
          </button>

          <button
            type="button"
            onClick={() => exportEventParticipantsCsv(event, participants)}
            disabled={participants.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Bagian 1: Form Edit Acara & QR Code Presensi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleUpdate}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden"
        >
          <h2 className="text-xl font-bold text-slate-900">
            Edit Detail &amp; Pengaturan Acara
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Judul Acara
            </label>
            <input
              type="text"
              required
              value={event.title}
              onChange={(e) => setEvent({ ...event, title: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Deskripsi
            </label>
            <textarea
              rows={3}
              required
              value={event.description}
              onChange={(e) =>
                setEvent({ ...event, description: e.target.value })
              }
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Jenis Acara
              </label>
              <select
                value={event.type}
                onChange={(e) => setEvent({ ...event, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="on-site">On-Site (Offline)</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Batas Kuota Peserta
              </label>
              <input
                type="number"
                min="1"
                placeholder="Tanpa batas"
                value={event.max_participants_input}
                onChange={(e) =>
                  setEvent({ ...event, max_participants_input: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Status Acara
              </label>
              <div className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50">
                <span
                  className={`font-semibold ${
                    event.status === "berlangsung"
                      ? "text-emerald-600"
                      : event.status === "akan_datang"
                        ? "text-indigo-600"
                        : "text-slate-500"
                  }`}
                >
                  {event.status === "berlangsung"
                    ? "Berlangsung"
                    : event.status === "akan_datang"
                      ? "Akan Datang"
                      : "Berakhir"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {event.type === "on-site"
                  ? "Lokasi Gedung / Ruangan"
                  : "Link Zoom / Google Meet"}
              </label>
              <input
                type="text"
                required
                value={event.location_or_link}
                onChange={(e) =>
                  setEvent({ ...event, location_or_link: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Waktu Mulai
                </label>
                <input
                  type="datetime-local"
                  required
                  value={event.event_date_input || ""}
                  onChange={(e) =>
                    setEvent({
                      ...event,
                      event_date_input: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Waktu Selesai
                </label>
                <input
                  type="datetime-local"
                  required
                  min={event.event_date_input || undefined}
                  value={event.end_date_input || ""}
                  onChange={(e) =>
                    setEvent({
                      ...event,
                      end_date_input: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ganti Thumbnail (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700"
              />
              {(thumbPreview || event.thumbnail) && (
                <img
                  src={thumbPreview || getStorageUrl(event.thumbnail)}
                  alt="Thumbnail"
                  className="mt-2 h-28 w-full rounded-lg object-cover border border-slate-200"
                />
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={event.has_certificate}
                    onChange={(e) =>
                      setEvent({ ...event, has_certificate: e.target.checked })
                    }
                  />
                  Sertifikat Kepesertaan
                </label>

                {event.has_certificate && (
                  <button
                    type="button"
                    onClick={() => setCertSimOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700"
                  >
                    <Eye className="w-3 h-3" />
                    Simulasi Hasil
                  </button>
                )}
              </div>

              {event.has_certificate && (
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-500">
                    Upload / Ganti Template Sertifikat
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCertTemplateChange}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
                  />
                  {activeTemplateUrl ? (
                    <img
                      src={activeTemplateUrl}
                      alt="Preview Template Sertifikat"
                      className="h-24 w-full rounded-lg object-contain border border-slate-200 bg-white p-1"
                    />
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Menggunakan desain sertifikat resmi bawaan Eventory.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>

        {/* Kartu QR & Token Presensi (Dengan Unduh PNG & Cetak Poster) */}
        <div
          id="printable-qr-poster"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center"
        >
          <h3 className="font-bold text-lg text-slate-900">
            QR &amp; Token Presensi
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Tampilkan di layar proyektor atau tempel di meja registrasi.
          </p>

          <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
            <QRCodeSVG id="event-qr-svg" value={event.qr_token} size={180} />
          </div>

          <div className="w-full mt-4 print:hidden">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Token Presensi
            </p>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl">
              <code className="text-xs font-mono text-slate-800 truncate flex-1">
                {event.qr_token}
              </code>
              <button
                type="button"
                onClick={copyToken}
                className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                title="Salin Token"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={handleDownloadQrPoster}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Poster PNG
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Poster
              </button>
            </div>
          </div>

          {/* Keterangan Khusus Saat Mode Print Poster */}
          <div className="hidden print:block mt-6 space-y-1">
            <p className="text-xl font-bold text-slate-900">{event.title}</p>
            <p className="text-sm text-slate-600">{event.location_or_link}</p>
            <p className="text-xs font-mono text-slate-500 pt-2">
              Token: {event.qr_token}
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 2: List Peserta Mendaftar & List Peserta Absen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* Kolom Kiri: Peserta Terdaftar + Tombol Tandai Hadir Manual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
              <Users className="w-5 h-5 text-indigo-600" />
              Peserta Terdaftar ({participants.length}
              {event.max_participants ? ` / ${event.max_participants}` : ""})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIM, email, atau kode tiket..."
              value={registeredSearch}
              onChange={(e) => setRegisteredSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {filteredRegistered.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              {participants.length === 0
                ? "Belum ada peserta yang mendaftar."
                : "Peserta tidak ditemukan."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm max-h-[460px] overflow-y-auto pr-1">
              {filteredRegistered.map((p) => (
                <li
                  key={p.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {p.user?.name}{" "}
                        {p.user?.nim && (
                          <span className="text-xs font-normal text-slate-500">
                            ({p.user.nim})
                          </span>
                        )}
                      </p>
                      {p.is_attended && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                          Hadir
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.user?.email} &bull; Tiket:{" "}
                      <span className="font-mono">{p.ticket_code}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!p.is_attended && (
                      <button
                        type="button"
                        disabled={busyParticipantId === p.id}
                        onClick={() => handleMarkAttended(p.id, p.user?.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        title="Presensi Manual"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tandai Hadir
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveParticipant(p.id, p.user?.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Kolom Kanan: Peserta Sudah Absen + Tombol Terbitkan / Kirim Sertifikat */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Peserta Sudah Absen ({attended.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIM, atau nomor sertifikat..."
              value={attendedSearch}
              onChange={(e) => setAttendedSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {filteredAttended.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              {attended.length === 0
                ? "Belum ada peserta yang melakukan presensi."
                : "Data presensi tidak ditemukan."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm max-h-[460px] overflow-y-auto pr-1">
              {filteredAttended.map((a) => (
                <li
                  key={a.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {a.user?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Absen:{" "}
                      {new Date(a.attended_at).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}{" "}
                      &bull;{" "}
                      <span className="font-mono text-emerald-700">
                        {a.certificate_number || "Belum ada no. sertifikat"}
                      </span>
                    </p>
                  </div>

                  {event.has_certificate && (
                    <button
                      type="button"
                      disabled={busyParticipantId === a.id}
                      onClick={() =>
                        handleIssueOrSendCertificate(a.id, a.user?.name)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold shrink-0 transition disabled:opacity-50"
                    >
                      {a.certificate_number ? (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Kirim Sertifikat
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5" />
                          Terbitkan Sertifikat
                        </>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bagian 3: Riwayat Pengumuman Terkirim */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-900">
              Riwayat Pengumuman ({announcements.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            Buat Pengumuman Baru
          </button>
        </div>

        {announcements.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center bg-slate-50 rounded-xl">
            Belum ada pengumuman yang dikirim untuk acara ini.
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700">
                      {ann.target === "attended"
                        ? "Target: Sudah Hadir"
                        : ann.target === "unattended"
                          ? "Target: Belum Hadir"
                          : "Target: Semua Peserta"}
                    </span>
                    <span className="text-slate-400">
                      {new Date(ann.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      WIB
                    </span>
                    {ann.updated_at && ann.updated_at !== ann.created_at && (
                      <span className="text-[11px] italic text-amber-600">
                        (diedit)
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">
                    {ann.subject}
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {ann.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditAnnouncement(ann)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Simulasi Hasil Jadi Sertifikat */}
      {certSimOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Simulasi Tampilan Sertifikat Peserta
                </h3>
                <p className="text-xs text-slate-500">
                  Pratinjau posisi nama mahasiswa dan nomor sertifikat saat
                  diunduh peserta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCertSimOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTemplateUrl ? (
              <div className="relative w-full aspect-[1.414/1] rounded-2xl overflow-hidden border border-slate-200 bg-white">
                <img
                  src={activeTemplateUrl}
                  alt="Simulasi Sertifikat"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <p className="text-xs font-mono text-slate-700 bg-white/85 px-3 py-0.5 rounded-full mb-2">
                    No: CERT/{new Date().getFullYear()}/{event.id}/A9X2K1
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 bg-white/90 px-6 py-2 rounded-xl shadow-sm">
                    Nama Mahasiswa Contoh
                  </p>
                  <p className="text-xs font-semibold text-slate-700 bg-white/85 px-3 py-0.5 rounded-full mt-2">
                    NIM: 2607411001
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[1.414/1] bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border-[8px] border-double border-indigo-950 rounded-2xl p-8 flex flex-col justify-between text-center">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-white text-[10px] font-bold uppercase">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Eventory Smart Campus Platform
                  </div>
                  <h2 className="text-2xl font-black text-indigo-950 uppercase pt-2">
                    Sertifikat Kepesertaan
                  </h2>
                  <p className="text-xs font-mono text-slate-500">
                    Nomor: CERT/{new Date().getFullYear()}/{event.id}/A9X2K1
                  </p>
                </div>

                <div className="space-y-2 my-auto">
                  <p className="text-xs text-slate-600">Diberikan kepada:</p>
                  <p className="text-2xl font-extrabold text-slate-900 border-b-2 border-amber-400 inline-block px-6 pb-1">
                    Nama Mahasiswa Contoh
                  </p>
                  <p className="text-xs text-slate-500">NIM: 2607411001</p>
                  <p className="text-xs text-slate-600 pt-2">
                    Atas partisipasi aktif dalam kegiatan:
                  </p>
                  <p className="text-lg font-bold text-indigo-900">
                    &ldquo;{event.title}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between text-left pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Terverifikasi QR Eventory
                  </span>
                  <span>Panitia Penyelenggara</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Kirim Pengumuman / Broadcast Peserta */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSendBroadcast}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">
                  Kirim Pengumuman ke Peserta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Penerima
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="all">
                  Semua Peserta Terdaftar ({participants.length} orang)
                </option>
                <option value="attended">
                  Hanya Peserta Sudah Absen ({attended.length} orang)
                </option>
                <option value="unattended">
                  Hanya Peserta Belum Absen (
                  {participants.length - attended.length} orang)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subjek Pengumuman
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Perubahan Ruangan / Link Zoom Acara"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Isi Pesan
              </label>
              <textarea
                rows={4}
                required
                placeholder="Tulis informasi penting untuk peserta..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={sendingBroadcast}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingBroadcast ? "Mengirim..." : "Kirim Sekarang"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Edit Pengumuman */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateAnnouncement}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Edit Pengumuman</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAnnouncement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Penerima
              </label>
              <select
                value={editAnnForm.target}
                onChange={(e) =>
                  setEditAnnForm({ ...editAnnForm, target: e.target.value })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="all">
                  Semua Peserta Terdaftar ({participants.length} orang)
                </option>
                <option value="attended">
                  Hanya Peserta Sudah Absen ({attended.length} orang)
                </option>
                <option value="unattended">
                  Hanya Peserta Belum Absen (
                  {participants.length - attended.length} orang)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subjek Pengumuman
              </label>
              <input
                type="text"
                required
                value={editAnnForm.subject}
                onChange={(e) =>
                  setEditAnnForm({ ...editAnnForm, subject: e.target.value })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Isi Pesan
              </label>
              <textarea
                rows={4}
                required
                value={editAnnForm.message}
                onChange={(e) =>
                  setEditAnnForm({ ...editAnnForm, message: e.target.value })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAnnouncement(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editAnnLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {editAnnLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
