# Eventory — Frontend (Smart Campus Event Management Platform)

**Eventory** adalah aplikasi web manajemen acara kampus berbasis Next.js yang memungkinkan mahasiswa/peserta menjelajahi dan mendaftar kegiatan, melakukan presensi menggunakan QR Code, memantau pengumuman dari panitia, serta melihat dan mencetak sertifikat digital. Di sisi lain, admin/panitia dapat membuat dan mengelola acara, mengatur kuota peserta, mencetak/mengunduh poster QR presensi, mengekspor rekap peserta ke PDF/CSV, mengelola riwayat pengumuman, serta mengatur akun pengguna.

## Tech Stack

- **Framework:** Next.js (App Router, JavaScript / JSX)
- **Styling & Ikon:** Tailwind CSS, `lucide-react`
- **HTTP Client:** Axios (`@/lib/api`)
- **QR Code:** `qrcode.react` (`QRCodeSVG`)
- **Ekspor Laporan:** Utilitas ekspor PDF dan CSV (`@/lib/exportPdf`)
- **Penyimpanan Sesi & Auth:** `localStorage` (`token`, `user`) dan `sessionStorage` (`selected_event_id`, `admin_event_id`)

## Fitur Utama

- **Portal Mahasiswa / Peserta:**
  - Jelajahi daftar acara beserta jenis (`on-site` / `online`), status (`akan_datang`, `berlangsung`, `berakhir`), lokasi/link, dan batas kuota peserta.
  - Pendaftaran acara, pengecekan status registrasi & kode tiket, serta pembatalan pendaftaran selama belum melakukan presensi.
  - Presensi kehadiran via QR Code (`/attend`) dan pemantauan riwayat kehadiran (`/attendance`).
  - Panel pengumuman panitia di dashboard dan halaman detail acara (mendukung mode ringkas/lihat semua serta baca selengkapnya untuk pesan panjang).
  - Pratinjau, unduh, dan cetak sertifikat digital (`/certificates` dan detail acara) menggunakan template kustom atau desain bawaan.
- **Portal Admin / Panitia:**
  - Manajemen acara (`/admin/events` dan `/admin/events/detail`): buat, edit, hapus acara, unggah thumbnail, atur batas kuota peserta, serta unggah dan simulasikan tampilan sertifikat.
  - QR & Token Presensi: salin token presensi, unduh poster QR format PNG, atau cetak poster langsung.
  - Manajemen peserta: cari peserta terdaftar maupun peserta yang sudah absen, tandai kehadiran secara manual, terbitkan/kirim sertifikat, hapus peserta, dan ekspor data ke PDF atau CSV.
  - Pengumuman peserta: kirim broadcast ke target penerima (`all`, `attended`, `unattended`), lihat riwayat pengumuman, edit isi/target pengumuman, serta hapus pengumuman.
  - Manajemen pengguna (`/admin/users`): kelola daftar akun pengguna, ubah peran (`role`), reset password, dan hapus akun.

## Struktur Halaman Utama

- `/` — Halaman beranda publik / landing page
- `/events` — Daftar & penjelajahan acara (disembunyikan pada navigasi saat login sebagai `admin`)
- `/events/detail` — Detail acara, pendaftaran, pengumuman acara, dan sertifikat peserta
- `/dashboard` — Dashboard mahasiswa (statistik acara terdaftar, kehadiran, sertifikat, pengumuman, dan tab acara)
- `/attend` — Halaman presensi kehadiran via QR Code
- `/attendance` — Riwayat kehadiran peserta
- `/certificates` — Daftar & cetak sertifikat digital peserta
- `/login` & `/register` — Autentikasi masuk dan pendaftaran akun
- `/admin/events` & `/admin/events/detail` — Dashboard dan halaman detail pengelolaan acara admin
- `/admin/users` — Halaman pengelolaan pengguna admin

## Panduan Instalasi & Menjalankan Aplikasi

1. Masuk ke direktori frontend:
   `cd frontend`

2. Install seluruh dependensi:
   `npm install`

3. Konfigurasi environment variable pada `.env.local` agar mengarah ke endpoint API backend Laravel:
   `NEXT_PUBLIC_API_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)`

4. Jalankan server pengembangan lokal:
   `npm run dev`
   Aplikasi akan dapat diakses di `http://localhost:3000`.

5. Build dan jalankan versi produksi (opsional):
   `npm run build`
   `npm start`

## Tautan Publikasi / Deployment

- **URL Website / Demo:** *https://www.eventory.my.id/*

