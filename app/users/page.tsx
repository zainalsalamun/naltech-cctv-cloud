"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createUser, deleteUser, getCustomers, getUsers, updateUser } from "@/lib/api";
import type { LeadWithId, ManagedUser, UserPayload, UserRole } from "@/types/operational";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  sales: "Sales",
  technician: "Teknisi",
  customer: "Customer"
};

const roleFilters = ["Semua role", "admin", "sales", "technician", "customer"];

const emptyForm: UserPayload = {
  name: "",
  email: "",
  role: "customer",
  password: "NaltechUser123!",
  customerId: ""
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [customers, setCustomers] = useState<LeadWithId[]>([]);
  const [userForm, setUserForm] = useState<UserPayload>(emptyForm);
  const [editingUserId, setEditingUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua role");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    Promise.all([getUsers(), getCustomers()])
      .then(([items, activeCustomers]) => {
        setUsers(items);
        setCustomers(activeCustomers);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data user.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const linkedCustomerIds = useMemo(
    () => new Set(users.filter((user) => user.id !== editingUserId).map((user) => user.customerId).filter(Boolean)),
    [users, editingUserId]
  );
  const adminCount = users.filter((user) => user.role === "admin").length;
  const customerUserCount = users.filter((user) => user.role === "customer").length;
  const operatorCount = users.filter((user) => user.role === "sales" || user.role === "technician").length;
  const linkedCustomerCount = users.filter((user) => user.customerId).length;
  const filteredUsers = useMemo(() => {
    const query = normalize(searchQuery);

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        normalize(`${user.name} ${user.email} ${user.role} ${user.customerName || ""}`).includes(query);
      const matchesRole = roleFilter === "Semua role" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, users]);

  function resetForm() {
    setEditingUserId("");
    setUserForm(emptyForm);
  }

  function startEdit(user: ManagedUser) {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      customerId: user.customerId || ""
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  function setRole(role: UserRole) {
    setUserForm((current) => ({
      ...current,
      role,
      customerId: role === "customer" ? current.customerId : ""
    }));
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload: UserPayload = {
        ...userForm,
        customerId: userForm.role === "customer" ? userForm.customerId : undefined,
        password: userForm.password || undefined
      };
      const savedUser = editingUserId ? await updateUser(editingUserId, payload) : await createUser(payload);

      setUsers((current) =>
        editingUserId
          ? current.map((user) => (user.id === savedUser.id ? savedUser : user))
          : [savedUser, ...current]
      );
      setSuccessMessage(editingUserId ? "User berhasil diperbarui." : "User baru berhasil dibuat.");
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan user.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeUser(user: ManagedUser) {
    if (!window.confirm(`Hapus user ${user.name}?`)) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSuccessMessage("User berhasil dihapus.");
      if (editingUserId === user.id) resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus user.");
    }
  }

  return (
    <DashboardShell
      mode="admin"
      title="User Management"
      subtitle="Kelola akses admin, sales, teknisi, dan akun customer portal Naltech CCTV Cloud."
      searchValue={searchQuery}
      searchPlaceholder="Cari nama, email, role, customer..."
      onSearchChange={setSearchQuery}
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">US</div>
          <div>
            <span>Total user</span>
            <strong>{users.length}</strong>
            <small>Akun aktif sistem</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">AD</div>
          <div>
            <span>Admin</span>
            <strong>{adminCount}</strong>
            <small>Akses penuh dashboard</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">OP</div>
          <div>
            <span>Operator</span>
            <strong>{operatorCount}</strong>
            <small>Sales dan teknisi</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">CP</div>
          <div>
            <span>Customer portal</span>
            <strong>{customerUserCount}</strong>
            <small>{linkedCustomerCount} terhubung pelanggan</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Daftar user</h2>
              <p>Akun internal dan akun customer portal yang bisa login ke aplikasi.</p>
            </div>
            <span>{filteredUsers.length} user</span>
          </div>
          <div className="filterBar">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roleFilters.map((role) => (
                <option value={role} key={role}>{role === "Semua role" ? role : roleLabels[role as UserRole]}</option>
              ))}
            </select>
            <button type="button" onClick={() => {
              setSearchQuery("");
              setRoleFilter("Semua role");
            }}>
              Reset filter
            </button>
          </div>
          {errorMessage ? <p className="activationNotice errorNotice">{errorMessage}</p> : null}
          {successMessage ? <p className="activationNotice">{successMessage}</p> : null}
          <div className="userTable">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat user...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <div className="userRow" key={user.id}>
                <div className="userIdentity">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <span className={`roleBadge role-${user.role}`}>{roleLabels[user.role]}</span>
                <span>{user.customerName || "Internal Naltech"}</span>
                <span>{new Date(user.createdAt).toLocaleDateString("id-ID")}</span>
                <div className="userActions">
                  <button type="button" onClick={() => startEdit(user)}>Edit</button>
                  <button type="button" className="dangerButton" onClick={() => removeUser(user)}>Hapus</button>
                </div>
              </div>
            )) : (
              <div className="emptyState">
                <strong>{users.length ? "User tidak ditemukan" : "Belum ada user"}</strong>
                <span>{users.length ? "Coba ubah kata kunci atau reset filter." : "Buat akun admin atau customer portal dari form di samping."}</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>{editingUserId ? "Edit user" : "Tambah user"}</h2>
              <p>Password diisi saat membuat user atau saat ingin reset password.</p>
            </div>
            <span>{editingUserId ? "Edit" : "Baru"}</span>
          </div>
          <form className="cameraForm" onSubmit={saveUser}>
            <label>
              <span>Nama</span>
              <input
                value={userForm.name}
                onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contoh: Admin Naltech"
                required
              />
            </label>
            <label>
              <span>Email login</span>
              <input
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="nama@naltech.id"
                required
              />
            </label>
            <div className="cameraFormSplit">
              <label>
                <span>Role</span>
                <select value={userForm.role} onChange={(event) => setRole(event.target.value as UserRole)}>
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="technician">Teknisi</option>
                  <option value="customer">Customer</option>
                </select>
              </label>
              <label>
                <span>{editingUserId ? "Reset password" : "Password"}</span>
                <input
                  type="text"
                  value={userForm.password || ""}
                  onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder={editingUserId ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
                  required={!editingUserId}
                />
              </label>
            </div>
            {userForm.role === "customer" ? (
              <label>
                <span>Hubungkan customer</span>
                <select
                  value={userForm.customerId || ""}
                  onChange={(event) => setUserForm((current) => ({ ...current, customerId: event.target.value }))}
                  required
                >
                  <option value="">Pilih pelanggan</option>
                  {customers.map((customer) => (
                    <option value={customer.id} key={customer.id} disabled={linkedCustomerIds.has(customer.id)}>
                      {customer.name} - {customer.area}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="billingPreview">
              <span>Password sementara</span>
              <strong>{editingUserId ? "Isi hanya saat reset" : userForm.password}</strong>
              <small>User bisa login setelah akun berhasil disimpan.</small>
            </div>
            <div className="cameraFormActions">
              <button className="button buttonPrimary" type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : editingUserId ? "Simpan User" : "Buat User"}
              </button>
              {editingUserId ? (
                <button className="button buttonGhost" type="button" onClick={resetForm}>
                  Batal
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>
    </DashboardShell>
  );
}
