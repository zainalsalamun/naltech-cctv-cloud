"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createCamera, deleteCamera, getCameras, getCustomers, updateCamera } from "@/lib/api";
import type { CameraPayload, LeadWithId, ManagedCamera } from "@/types/operational";

const emptyForm: CameraPayload = {
  customerId: "",
  name: "",
  location: "",
  status: "Online",
  retentionDays: 14,
  cloudRecordingEnabled: true
};

const cameraStatusFilters = ["Semua status", "Online", "Offline"];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export default function CameraPage() {
  const [cameras, setCameras] = useState<ManagedCamera[]>([]);
  const [customers, setCustomers] = useState<LeadWithId[]>([]);
  const [cameraForm, setCameraForm] = useState<CameraPayload>(emptyForm);
  const [editingCameraId, setEditingCameraId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    Promise.all([getCameras(), getCustomers()])
      .then(([items, activeCustomers]) => {
        setCameras(items);
        setCustomers(activeCustomers);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data kamera.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  function setCustomer(customerId: string) {
    const selectedCustomer = customers.find((customer) => customer.id === customerId);

    setCameraForm((current) => ({
      ...current,
      customerId,
      location: selectedCustomer?.area || current.location
    }));
  }

  function resetForm() {
    setEditingCameraId("");
    setCameraForm(emptyForm);
  }

  function startEdit(camera: ManagedCamera) {
    setEditingCameraId(camera.id);
    setCameraForm({
      customerId: camera.customerId,
      name: camera.name,
      location: camera.location,
      status: camera.status,
      retentionDays: Number.parseInt(camera.retention, 10) || 14,
      cloudRecordingEnabled: camera.cloudRecordingEnabled
    });
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function saveCamera(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savedCamera = editingCameraId
        ? await updateCamera(editingCameraId, cameraForm)
        : await createCamera(cameraForm);

      setCameras((current) =>
        editingCameraId
          ? current.map((camera) => (camera.id === savedCamera.id ? savedCamera : camera))
          : [savedCamera, ...current]
      );
      setSuccessMessage(editingCameraId ? "Kamera berhasil diperbarui." : "Kamera baru berhasil ditambahkan.");
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan kamera.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCamera(camera: ManagedCamera) {
    if (!window.confirm(`Hapus kamera ${camera.name}?`)) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteCamera(camera.id);
      setCameras((current) => current.filter((item) => item.id !== camera.id));
      setSuccessMessage("Kamera berhasil dihapus.");
      if (editingCameraId === camera.id) resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus kamera.");
    }
  }

  const onlineCount = cameras.filter((camera) => camera.status === "Online").length;
  const offlineCount = cameras.length - onlineCount;
  const filteredCameras = useMemo(() => {
    const query = normalize(searchQuery);

    return cameras.filter((camera) => {
      const matchesSearch =
        !query ||
        normalize(`${camera.name} ${camera.customerName} ${camera.location} ${camera.status} ${camera.retention}`).includes(query);
      const matchesStatus = statusFilter === "Semua status" || camera.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cameras, searchQuery, statusFilter]);
  const locations = new Set(cameras.map((camera) => camera.location)).size;
  const longestRetention = useMemo(
    () =>
      cameras
        .map((camera) => Number.parseInt(camera.retention, 10) || 0)
        .sort((a, b) => b - a)[0],
    [cameras]
  );

  return (
    <DashboardShell
      mode="admin"
      title="Manajemen Kamera"
      subtitle="Pantau kamera cloud aktif, status koneksi, lokasi pelanggan, dan retensi rekaman."
      searchValue={searchQuery}
      searchPlaceholder="Cari kamera, pelanggan, lokasi..."
      onSearchChange={setSearchQuery}
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">CM</div>
          <div>
            <span>Total kamera</span>
            <strong>{cameras.length}</strong>
            <small>{locations} lokasi pelanggan</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">ON</div>
          <div>
            <span>Online</span>
            <strong>{onlineCount}</strong>
            <small>Siap cloud recording</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">OF</div>
          <div>
            <span>Offline</span>
            <strong>{offlineCount}</strong>
            <small>Butuh pengecekan teknis</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">RT</div>
          <div>
            <span>Retensi aktif</span>
            <strong>{longestRetention ? `${longestRetention} hari` : "-"}</strong>
            <small>Mengikuti paket pelanggan</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Daftar kamera cloud</h2>
              <p>Status kamera prioritas yang sudah terhubung ke layanan cloud recording.</p>
            </div>
            <span>{filteredCameras.length} kamera</span>
          </div>
          <div className="filterBar">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {cameraStatusFilters.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
            <button type="button" onClick={() => {
              setSearchQuery("");
              setStatusFilter("Semua status");
            }}>
              Reset filter
            </button>
          </div>
          {errorMessage ? <p className="activationNotice errorNotice">{errorMessage}</p> : null}
          {successMessage ? <p className="activationNotice">{successMessage}</p> : null}
          <div className="cameraList">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat kamera...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : filteredCameras.length > 0 ? filteredCameras.map((camera) => (
              <div className="cameraItem cameraManagementItem" key={camera.id}>
                <div className="cameraIdentity">
                  <strong>{camera.name}</strong>
                  <span>{camera.customerName} · {camera.location}</span>
                </div>
                <span className={camera.status === "Online" ? "pill success" : "pill danger"}>
                  {camera.status}
                </span>
                <span>{camera.retention}</span>
                <span>{camera.cloudRecordingEnabled && camera.status === "Online" ? "Recording aktif" : "Cek koneksi"}</span>
                <div className="cameraActions">
                  <button type="button" onClick={() => startEdit(camera)}>Edit</button>
                  <button type="button" className="dangerButton" onClick={() => removeCamera(camera)}>Hapus</button>
                </div>
              </div>
            )) : (
              <div className="emptyState">
                <strong>{cameras.length ? "Kamera tidak ditemukan" : "Belum ada kamera"}</strong>
                <span>{cameras.length ? "Coba ubah kata kunci atau reset filter." : "Tambahkan kamera dari data pelanggan aktif."}</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>{editingCameraId ? "Edit kamera" : "Tambah kamera"}</h2>
              <p>Pilih pelanggan aktif lalu isi data kamera cloud yang akan dimonitor.</p>
            </div>
            <span>{editingCameraId ? "Edit" : "Baru"}</span>
          </div>
          <form className="cameraForm" onSubmit={saveCamera}>
            <label>
              <span>Pelanggan</span>
              <select value={cameraForm.customerId} onChange={(event) => setCustomer(event.target.value)} required>
                <option value="">Pilih pelanggan</option>
                {customers.map((customer) => (
                  <option value={customer.id} key={customer.id}>
                    {customer.name} - {customer.area}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Nama kamera</span>
              <input
                value={cameraForm.name}
                onChange={(event) => setCameraForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contoh: Kasir 01"
                required
              />
            </label>
            <label>
              <span>Lokasi kamera</span>
              <input
                value={cameraForm.location}
                onChange={(event) => setCameraForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Contoh: Area kasir"
                required
              />
            </label>
            <div className="cameraFormSplit">
              <label>
                <span>Status</span>
                <select
                  value={cameraForm.status}
                  onChange={(event) =>
                    setCameraForm((current) => ({
                      ...current,
                      status: event.target.value === "Online" ? "Online" : "Offline"
                    }))
                  }
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </label>
              <label>
                <span>Retensi</span>
                <input
                  type="number"
                  min="1"
                  value={cameraForm.retentionDays}
                  onChange={(event) =>
                    setCameraForm((current) => ({ ...current, retentionDays: Number(event.target.value) }))
                  }
                  required
                />
              </label>
            </div>
            <label className="cameraToggle">
              <input
                type="checkbox"
                checked={cameraForm.cloudRecordingEnabled}
                onChange={(event) =>
                  setCameraForm((current) => ({ ...current, cloudRecordingEnabled: event.target.checked }))
                }
              />
              <span>Cloud recording aktif</span>
            </label>
            <div className="cameraFormActions">
              <button className="button buttonPrimary" type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : editingCameraId ? "Simpan Perubahan" : "Tambah Kamera"}
              </button>
              {editingCameraId ? (
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
