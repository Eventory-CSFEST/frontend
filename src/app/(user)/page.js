"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  QrCode,
  Ticket,
  ArrowRight,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {}
    }
  }, []);

  const secondaryHref = !user
    ? "/register"
    : user.role === "admin"
      ? "/admin/events"
      : "/attend";

  const secondaryLabel = !user
    ? "Daftar Akun Gratis"
    : user.role === "admin"
      ? "Buka Panel Admin"
      : "Isi Presensi QR";

  return (
    <div className="space-y-20">
      {/* 1. HERO SECTION (2 Kolom + Kartu Gambar Perspektif) */}
      <section className="relative py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Kolom Kiri: Headline, Kotak Deskripsi, & CTA */}
          <div className="lg:col-span-6 space-y-7">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-indigo-950 tracking-tight leading-[1.12]">
              Kelola Acara
              <br />
              Kampus Lebih
              <br />
              Mudah,
              <br />
              Terintegrasi.
            </h1>

            <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] max-w-xl">
              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                <strong>Eventory</strong> adalah portal terintegrasi yang
                memudahkan mahasiswa menemukan seminar, workshop, dan lomba
                kampus, mendaftar dalam satu klik, melakukan presensi cepat via
                QR Code, hingga mengunduh sertifikat digital secara otomatis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <Link
                href="/events"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-indigo-950 text-white text-sm font-semibold hover:bg-indigo-900 transition shadow-md shadow-indigo-950/15"
              >
                <span>Jelajahi Acara</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-950 underline underline-offset-4 decoration-indigo-950/40 hover:decoration-indigo-950 transition"
              >
                <span>{secondaryLabel}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Kolom Kanan: Preview Gambar lp.webp dengan Efek Perspektif */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div
              className="w-full max-w-xl rounded-2xl overflow-hidden bg-white p-2 border border-slate-200/80 shadow-[0_24px_50px_rgba(15,23,42,0.12)] transition-transform duration-500 hover:scale-[1.01]"
              style={{
                transform:
                  "perspective(1100px) rotateY(-10deg) rotateX(2deg) rotateZ(-1deg)",
              }}
            >
              <img
                src="/lp.webp"
                alt="Dokumentasi & Kegiatan Kampus Eventory"
                className="w-full h-auto max-h-[420px] object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PENJELASAN WEBSITE & FITUR UTAMA */}
      <section id="fitur" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Tentang Eventory
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-950 mt-1">
            Mengapa Menggunakan Eventory?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            Tidak ada lagi informasi acara yang terlewat di grup chat, antrean
            daftar hadir manual, atau menunggu sertifikat berhari-hari.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5">
              Info Acara Terpusat
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Pantau seluruh jadwal kegiatan kampus baik yang diselenggarakan
              secara <strong>On-Site</strong> maupun <strong>Online</strong>{" "}
              dalam satu katalog.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5">
              Registrasi &amp; E-Ticket
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Daftar acara pilihanmu hanya dengan satu klik dan langsung
              dapatkan kode tiket peserta secara instan.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5">
              Presensi QR Cepat
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Konfirmasi kehadiran saat hari-H cukup menggunakan token QR Code
              acara tanpa perlu mengisi formulir berulang.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5">
              Sertifikat Otomatis
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Begitu presensi tercatat, sertifikat kepesertaan digital dengan
              nomor unik langsung siap dicetak atau disimpan sebagai PDF.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ALUR PENGGUNAAN (Cara Kerja untuk Mahasiswa) */}
      <section
        id="cara-kerja"
        className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Cara Kerja
          </span>
          <h2 className="text-2xl font-bold text-indigo-950 mt-1">
            4 Langkah Mudah Mengikuti Acara
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Buat Akun",
              desc: "Registrasi menggunakan nama lengkap dan NIM agar data sertifikat sesuai.",
            },
            {
              step: "02",
              title: "Pilih & Daftar Acara",
              desc: "Temukan acara yang diminati pada katalog acara lalu klik Daftar Acara.",
            },
            {
              step: "03",
              title: "Hadir & Presensi QR",
              desc: "Saat acara berlangsung, masukkan token QR dari panitia di menu Presensi QR.",
            },
            {
              step: "04",
              title: "Klaim Sertifikat",
              desc: "Buka kembali detail acara untuk mengunduh atau mencetak sertifikat digital.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100"
            >
              <span className="text-2xl font-black text-indigo-200">
                {item.step}
              </span>
              <h3 className="font-bold text-slate-900 mt-2 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
