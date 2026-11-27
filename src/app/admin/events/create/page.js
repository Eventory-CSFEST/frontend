"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import api from "@/lib/api";

export default function CreateEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("on-site");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [hasCertificate, setHasCertificate] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [certTemplate, setCertTemplate] = useState(null);
  const [certPreview, setCertPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser || JSON.parse(savedUser).role !== "admin") {
      router.push("/");
    }
  }, [router]);

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0] || null;
    setThumbnail(file);
    if (file) {
      setThumbPreview(URL.createObjectURL(file));
    } else {
      setThumbPreview(null);
    }
  };

  const handleCertChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCertTemplate(file);
    if (file && file.type.startsWith("image/")) {
      setCertPreview(URL.createObjectURL(file));
    } else {
      setCertPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (new Date(endDate) <= new Date(eventDate)) {
      setError("Waktu selesai harus lebih besar dari waktu mulai.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("location_or_link", locationOrLink);
      formData.append("event_date", eventDate);
      formData.append("end_date", endDate);
      if (maxParticipants) {
        formData.append("max_participants", maxParticipants);
      }
      formData.append("has_certificate", hasCertificate ? "1" : "0");

      if (thumbnail) formData.append("thumbnail", thumbnail);
      if (hasCertificate && certTemplate) {
        formData.append("certificate_template", certTemplate);
      }

      await api.post("/events", formData);
      router.push("/admin/events");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal menyimpan acara. Periksa kembali isian form.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/admin/events")}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 mb-4 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard Admin
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Tambah Acara Baru</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Judul Acara
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Seminar Nasional Teknologi AI 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi Lengkap
            </label>
            <textarea
              rows={4}
              required
              placeholder="Jelaskan detail acara, pembicara, dan syarat peserta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jenis Acara
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="on-site">On-Site (Offline)</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === "on-site"
                  ? "Lokasi Gedung / Ruangan"
                  : "Link Zoom / Google Meet"}
              </label>
              <input
                type="text"
                required
                placeholder={
                  type === "on-site"
                    ? "Aula Gedung Serbaguna Lt. 3"
                    : "https://zoom.us/j/..."
                }
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Waktu Mulai
              </label>
              <input
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Waktu Selesai
              </label>
              <input
                type="datetime-local"
                required
                min={eventDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Batas Kuota (Opsional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Tanpa batas"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Upload Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Banner / Thumbnail Acara
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {thumbPreview && (
              <img
                src={thumbPreview}
                alt="Preview"
                className="mt-3 h-40 w-full object-cover rounded-xl border"
              />
            )}
          </div>

          {/* Pengaturan Sertifikat */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center gap-2.5 font-semibold text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCertificate}
                onChange={(e) => setHasCertificate(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              Sediakan Sertifikat Kepesertaan Otomatis
            </label>

            {hasCertificate && (
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Desain Template Sertifikat (PNG/JPG - Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCertChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
                />
                {certPreview && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-emerald-700">
                      Pratinjau Template Sertifikat:
                    </p>
                    <img
                      src={certPreview}
                      alt="Preview Sertifikat"
                      className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white p-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? "Menyimpan Acara..." : "Simpan & Publikasikan Acara"}
          </button>
        </form>
      </div>
    </div>
  );
}