"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Camera,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

export default function AttendPage() {
  const router = useRouter();

  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraRetry, setCameraRetry] = useState(0);

  const scannerRef = useRef(null);
  const scannedRef = useRef(false);

  const requestCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser tidak mendukung akses kamera atau halaman belum menggunakan HTTPS.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      // Matikan stream tes agar scanner bisa membuka kamera kembali
      stream.getTracks().forEach((track) => track.stop());

      setCameraError("");
      setCameraRetry((prev) => prev + 1);
    } catch (error) {
      console.error("Camera permission error:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Izin kamera ditolak. Izinkan kamera melalui pengaturan situs browser, lalu tekan tombol di bawah.",
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("Kamera tidak ditemukan pada perangkat ini.");
      } else {
        setCameraError(error.message || "Kamera gagal dibuka. Coba kembali.");
      }
    }
  };

  // Cek login dan ambil query qr_token
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      localStorage.setItem("redirect_after_login", "/attend");
      router.replace("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("qr_token");

    setQrToken(token?.trim() || "");
  }, [router]);

  // Validasi token QR dari query
  useEffect(() => {
    if (qrToken === null || !qrToken) return;

    let cancelled = false;

    const validateToken = async () => {
      setLoading(true);
      setStatus(null);
      setMessage("");

      try {
        const res = await api.get(
          `/events/validate-qr/${encodeURIComponent(qrToken)}`,
        );

        const event = res.data?.event || res.data?.data;

        if (!res.data?.success || !event?.id) {
          throw new Error(res.data?.message || "Token QR tidak valid.");
        }

        if (cancelled) return;

        // Token valid → redirect ke detail event
        sessionStorage.setItem("selected_event_id", String(event.id));
        router.replace(`/events/detail`);
      } catch (err) {
        if (cancelled) return;

        // Token salah → kembali ke halaman scanner
        router.replace("/attend");
        setQrToken("");
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            err.message ||
            "QR Code tidak valid atau acara tidak ditemukan.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    validateToken();

    return () => {
      cancelled = true;
    };
  }, [qrToken, router]);

  // Jalankan scanner jika tidak ada qr_token di URL

  useEffect(() => {
    if (qrToken !== "" || !localStorage.getItem("token")) return;

    let active = true;
    let scanner = null;

    const stopScanner = async () => {
      if (!scanner) return;

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }

        scanner.clear();
      } catch (error) {
        console.warn("Gagal menghentikan scanner:", error);
      }

      scanner = null;
      scannerRef.current = null;
    };

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!active) return;

        // Jangan gunakan const/let di sini!
        scanner = new Html5Qrcode("eventory-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height, 250);
              return { width: size, height: size };
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (!active || scannedRef.current) return;

            scannedRef.current = true;

            let token = decodedText.trim();

            try {
              const url = new URL(decodedText);
              const queryToken = url.searchParams.get("qr_token");

              if (queryToken) {
                token = queryToken.trim();
              }
            } catch {
              // QR berisi token langsung
            }

            if (!token) {
              scannedRef.current = false;
              return;
            }
stopScanner().finally(async () => {
  if (!active) return;

  try {
    setLoading(true);
    setStatus(null);
    setMessage("");

    // 1. Validasi QR terlebih dahulu
    const validation = await api.get(
      `/events/validate-qr/${encodeURIComponent(token)}`
    );

    const event = validation.data?.event;

    if (!validation.data?.success || !event?.id) {
      throw new Error(
        validation.data?.message || "QR Code tidak valid."
      );
    }

    // 2. Proses absensi setelah QR valid
    const response = await api.post(
      `/attend/${encodeURIComponent(token)}`
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Absensi gagal diproses."
      );
    }

    // 3. Simpan ID event dan redirect setelah attend berhasil
    sessionStorage.setItem(
      "selected_event_id",
      String(event.id)
    );

    router.replace("/events/detail");
  } catch (error) {
    setStatus("error");
    setMessage(
      error.response?.data?.message ||
      error.message ||
      "Validasi QR atau absensi gagal."
    );
  } finally {
    setLoading(false);
  }
});
          },
          () => {},
        );

        // Jika halaman sudah ditinggalkan ketika kamera mulai aktif
        if (!active) {
          await stopScanner();
        }
      } catch (error) {
        console.error("Scanner gagal dijalankan:", error);

        if (active) {
          setCameraError(
            "Kamera gagal dibuka. Pastikan izin kamera sudah diberikan.",
          );
        }
      }
    };

    startScanner();

    return () => {
      active = false;
      scannedRef.current = false;

      // Pastikan kamera berhenti ketika pindah halaman
      stopScanner();
    };
  }, [qrToken, cameraRetry]);

  return (
    <div className="mx-auto mt-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <QrCode className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          Presensi Kehadiran Eventory
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Scan QR Code acara untuk membuka halaman detail event.
        </p>
      </div>

      {/* Sedang memvalidasi token */}
      {loading && (
        <div className="flex flex-col items-center rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Memverifikasi QR Code...
          </p>

          <p className="mt-1 text-xs text-slate-500">Mohon tunggu sebentar.</p>
        </div>
      )}

      {/* Scanner tampil jika tidak ada query token */}
      {!loading && qrToken === "" && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
              <Camera className="h-4 w-4 text-indigo-600" />
              Arahkan kamera ke QR Code
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-slate-950">
              <div id="eventory-qr-reader" className="h-full w-full" />

              {/* Overlay scan */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64 max-h-[80%] max-w-[80%]">
                  <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-indigo-400" />
                  <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-indigo-400" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-indigo-400" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-indigo-400" />

                  <div className="absolute left-0 right-0 top-1/2 h-0.5 animate-pulse bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.8)]" />
                </div>
              </div>
            </div>
          </div>

          {cameraError && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{cameraError}</span>
              </div>

              <button
                type="button"
                onClick={requestCameraPermission}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Camera className="h-4 w-4" />
                Izinkan Kamera
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            Pastikan QR Code terlihat jelas dan berada di dalam area pemindaian.
          </p>
        </>
      )}

      {/* Status error */}
      {status === "error" && message && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Status sukses jika nantinya diperlukan */}
      {status === "success" && message && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
