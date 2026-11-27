'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    nim: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    try {
      const res = await api.post('/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
      }
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-4 animate-pulse">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-3" />
          <div className="h-6 w-52 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-slate-100 rounded-lg" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item}>
              <div className="h-4 w-32 bg-slate-200 rounded mb-1.5" />
              <div className="h-10 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
          <div className="h-10 w-full bg-indigo-200 rounded-xl mt-2" />
        </div>

        <div className="h-4 w-48 bg-slate-100 rounded mx-auto mt-6" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Daftar Akun Mahasiswa</h1>
        <p className="text-sm text-slate-500 mt-1">Buat akun untuk mendaftar acara dan klaim sertifikat</p>
      </div>

      {generalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap (untuk Sertifikat)</label>
          <input
            type="text"
            required
            placeholder="Contoh: Arman Tri Fajri"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">NIM (Opsional)</label>
          <input
            type="text"
            placeholder="Contoh: 2607411001"
            value={form.nim}
            onChange={(e) => setForm({ ...form, nim: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.nim && <p className="text-xs text-red-600 mt-1">{errors.nim[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            placeholder="nama@kampus.ac.id"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="Ulangi password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
        >
          Daftar Sekarang
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
          Login di sini
        </Link>
      </p>
    </div>
  );
}