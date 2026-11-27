"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CalendarDays,
  LogOut,
  Menu,
  X,
  QrCode,
  LayoutDashboard,
  LayoutGrid,
  ClipboardCheck,
  Award,
  Users,
} from "lucide-react";
import api from "@/lib/api";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (_) {
      // Abaikan error jika token sudah kedaluwarsa
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href={user?.role === "admin" ? "/admin/events" : "/"}
              className="flex items-center gap-2 text-xl font-bold text-indigo-600 tracking-tight"
            >
              <CalendarDays className="w-6 h-6" />
              <span>Eventory</span>
            </Link>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center gap-5 text-sm font-medium">
              {!user && (
                <Link
                  href="/"
                  className={`transition ${pathname === "/" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                >
                  Beranda
                </Link>
              )}

              {user?.role !== "admin" && (
                <Link
                  href="/events"
                  className={`transition ${pathname === "/events" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                >
                  Jelajahi Acara
                </Link>
              )}

              {user && user.role !== "admin" && (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 transition ${pathname === "/dashboard" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <Link
                    href="/attendance"
                    className={`flex items-center gap-1.5 transition ${pathname === "/attendance" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Kehadiran
                  </Link>

                  <Link
                    href="/certificates"
                    className={`flex items-center gap-1.5 transition ${pathname === "/certificates" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                  >
                    <Award className="w-4 h-4" />
                    Sertifikat
                  </Link>

                  <Link
                    href="/attend"
                    className={`flex items-center gap-1.5 transition ${pathname === "/attend" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                  >
                    <QrCode className="w-4 h-4" />
                    Presensi QR
                  </Link>
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Link
                    href="/admin/events"
                    className={`flex items-center gap-1.5 transition ${pathname.startsWith("/admin/events") ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Kelola Acara
                  </Link>

                  <Link
                    href="/admin/users"
                    className={`flex items-center gap-1.5 transition ${pathname.startsWith("/admin/users") ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-600"}`}
                  >
                    <Users className="w-4 h-4" />
                    Kelola Pengguna
                  </Link>
                </>
              )}

              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase">
                      {user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Tombol Menu Mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Dropdown Mobile */}
          {mobileOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 text-sm font-medium">
              {!user && (
                <Link
                  href="/"
                  className={`block py-1.5 ${pathname === "/" ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                >
                  Beranda
                </Link>
              )}

              {user?.role !== "admin" && (
                <Link
                  href="/events"
                  className={`block py-1.5 ${pathname === "/events" ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                >
                  Jelajahi Acara
                </Link>
              )}

              {user && user.role !== "admin" && (
                <>
                  <Link
                    href="/dashboard"
                    className={`block py-1.5 ${pathname === "/dashboard" ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/attendance"
                    className={`block py-1.5 ${pathname === "/attendance" ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                  >
                    Riwayat Kehadiran
                  </Link>
                  <Link
                    href="/certificates"
                    className={`block py-1.5 ${pathname === "/certificates" ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                  >
                    Sertifikat Digital
                  </Link>
                  <Link
                    href="/attend"
                    className={`block py-1.5 ${pathname === "/attend" ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                  >
                    Presensi QR
                  </Link>
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Link
                    href="/admin/events"
                    className={`block py-1.5 ${pathname.startsWith("/admin/events") ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                  >
                    Kelola Acara
                  </Link>
                  <Link
                    href="/admin/users"
                    className={`block py-1.5 ${pathname.startsWith("/admin/users") ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                  >
                    Kelola Pengguna
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-slate-100">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 text-left text-red-600 font-semibold"
                  >
                    Logout ({user.name})
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      className="flex-1 text-center py-2 border rounded-lg"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center py-2 bg-indigo-600 text-white rounded-lg"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Konten Utama */}
        <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-400 print:hidden">
          Eventory &copy; {new Date().getFullYear()} &mdash; Smart Campus Event
          Management Platform
        </footer>
      </body>
    </html>
  );
}