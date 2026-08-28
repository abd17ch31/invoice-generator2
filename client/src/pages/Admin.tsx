import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Shield,
  Pencil,
  Trash2,
  X,
  Users,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Admin() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "USER",
    password: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert("Name and email are required.");
      return;
    }
    if (!editingUser) return;

    try {
      setSaving(true);
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) {
        payload.password = form.password;
      }

      await api.put(`/users/${editingUser.id}`, payload);
      alert("User updated successfully!");
      setShowModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to update user:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (user.id === me?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}? This will permanently remove their customers and invoices.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${user.id}`);
      alert("User deleted successfully!");
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 md:block">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <h1 className="text-xl font-bold">
            SaaS<span className="text-indigo-400">Invoice</span>
          </h1>
        </div>

        <nav className="p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Users size={19} />
            Dashboard
          </a>

          <a
            href="/customers"
            className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Users size={19} />
            Customers
          </a>

          <a
            href="/invoices"
            className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Users size={19} />
            Invoices
          </a>

          <a
            href="/admin"
            className="mt-2 flex items-center gap-3 rounded-lg bg-indigo-500/10 px-4 py-3 text-indigo-400"
          >
            <Shield size={19} />
            Admin
          </a>
        </nav>
      </aside>

      <main className="md:ml-64">
        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900/80 px-6">
          <p className="text-sm text-slate-400">Admin Panel</p>
        </header>

        <div className="p-6">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">Admin Panel</h2>
              <p className="mt-1 text-slate-400">
                Manage all registered users.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {loading && (
              <div className="p-10 text-center text-slate-500">
                Loading users...
              </div>
            )}

            {!loading && users.length === 0 && (
              <div className="flex min-h-64 items-center justify-center p-6">
                <div className="text-center">
                  <Shield
                    size={40}
                    className="mx-auto mb-3 text-slate-700"
                  />
                  <p className="text-slate-400">No users found.</p>
                </div>
              </div>
            )}

            {!loading && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/40">
                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4 font-medium">User</th>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Role</th>
                      <th className="px-5 py-4 font-medium">Joined</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-800 last:border-0 transition hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 font-semibold text-indigo-400">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.name}
                                {user.id === me?.id && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    (you)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-400">
                          {user.email}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              user.role === "ADMIN"
                                ? "bg-indigo-500/10 text-indigo-400"
                                : "bg-slate-700/40 text-slate-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              title="Edit user"
                              onClick={() => openEditModal(user)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              title="Delete user"
                              onClick={() => handleDelete(user)}
                              disabled={user.id === me?.id}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Edit User</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update user information.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>

              <input
                type="password"
                placeholder="New password (leave blank to keep current)"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />

              {editingUser.role === "ADMIN" &&
                !(editingUser.id === me?.id) && (
                  <p className="text-xs text-slate-500">
                    Note: demoting this user to "User" will revoke
                    their admin access immediately.
                  </p>
                )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-medium hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
