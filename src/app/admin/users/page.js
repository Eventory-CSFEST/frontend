"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  KeyRound,
  Trash2,
  X,
} from "lucide-react";
import api from "@/lib/api";

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal Reset Password
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingReset, setSavingReset] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat daftar pengguna:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      router.push("/");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed.role !== "admin") {
        router.push("/");
        return;
      }
      setCurrentUser(parsed);
      fetchUsers();
    } catch {
      router.push("/");
    }
  }, [router]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        u.name?.toLowerCase().includes(q) ||
        u.nim?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === "admin" ? "user" : "admin";
    if (
      !confirm(
        `Ubah role akun "${targetUser.name}" menjadi ${nextRole.toUpperCase()}?`,
      )
    )
      return;

    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/role`, {
        role: nextRole,
      });
      alert(res.data?.message || "Role berhasil diubah.");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengubah role akun.");
    }
  };

  const handleSubmitResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget || newPassword.length < 6) return;

    setSavingReset(true);
    try {
      const res = await api.post(
        `/admin/users/${resetTarget.id}/reset-password`,
        { password: newPassword },
      );
      alert(res.data?.message || "Password berhasil direset.");
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mereset password.");
    } finally {
      setSavingReset(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (
      !confirm(
        `Hapus permanen akun "${targetUser.name}" beserta seluruh riwayat kepesertaannya?`,
      )
    )
      return;

    try {
      const res = await api.delete(`/admin/users/${targetUser.id}`);
      alert(res.data?.message || "Akun berhasil dihapus.");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus akun.");
    }
  };

  const totalMahasiswa = users.filter((u) => u.role === "user").length;
  const totalAdmin = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Manajemen Akun Mahasiswa &amp; Admin
        </h1>
        <p className="text-sm text-slate-500">
          Kelola data akun terdaftar, reset kata sandi mahasiswa, dan atur hak
          akses admin.
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Akun Terdaftar</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {users.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Akun Mahasiswa</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {totalMahasiswa}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Akun Admin</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {totalAdmin}
          </p>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama, NIM, atau email pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Role</option>
              <option value="user">Mahasiswa (User)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Memuat data pengguna...
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Tidak ada pengguna yang ditemukan.
          </p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
              <tr>
                <th className="p-4">Nama &amp; Email</th>
                <th className="p-4">NIM</th>
                <th className="p-4">Role</th>
                <th className="p-4">Partisipasi</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">
                        {u.name}{" "}
                        {isSelf && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                            Anda
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-700">
                      {u.nim || "-"}
                    </td>
                    <td className="p-4">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                          <UserCheck className="w-3 h-3" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {u.participations_count || 0} acara
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* <button
                          type="button"
                          onClick={() => {
                            setResetTarget(u);
                            setNewPassword("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Reset Password
                        </button> */}

                        {!isSelf && (
                          <>
                            {/* <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold"
                            >
                              {u.role === "admin"
                                ? "Jadikan User"
                                : "Jadikan Admin"}
                            </button> */}

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Reset Password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitResetPassword}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">
                Reset Password: {resetTarget.name}
              </h3>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi Baru (Minimal 6 karakter)
              </label>
              <input
                type="text"
                required
                minLength={6}
                placeholder="Masukkan kata sandi baru..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingReset || newPassword.length < 6}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingReset ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}