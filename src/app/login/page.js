'use client';

<<<<<<< HEAD
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
=======
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff } from 'lucide-react';
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
<<<<<<< HEAD
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

=======
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const redirectAfterLogin = localStorage.getItem('redirect_after_login');
      if (redirectAfterLogin) {
        localStorage.removeItem('redirect_after_login');
        router.push(redirectAfterLogin);
      } else {
        router.push(res.data.user.role === 'admin' ? '/admin/events' : '/dashboard');
      }
    } catch (err) {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Login gagal. Periksa kembali email dan password Anda.';
      setError(msg);
<<<<<<< HEAD
    } finally {
=======
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  if (!mounted || loading) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-8 animate-pulse">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-3" />
          <div className="h-6 w-44 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-60 bg-slate-100 rounded-lg" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="h-4 w-16 bg-slate-200 rounded mb-1.5" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
          <div>
            <div className="h-4 w-20 bg-slate-200 rounded mb-1.5" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
          <div className="h-10 w-full bg-indigo-200 rounded-xl mt-2" />
        </div>

        <div className="h-4 w-48 bg-slate-100 rounded mx-auto mt-6" />
      </div>
    );
  }

>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Masuk ke Eventory</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola dan ikuti berbagai kegiatan kampus</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            placeholder="nama@kampus.ac.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
<<<<<<< HEAD
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
=======
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
        >
<<<<<<< HEAD
          {loading ? 'Memproses...' : 'Login'}
=======
          Login
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}