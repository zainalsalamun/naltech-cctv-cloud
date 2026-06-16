"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { getCameras } from "@/lib/api";
import type { ManagedCamera } from "@/types/operational";

export default function CameraPage() {
  const [cameras, setCameras] = useState<ManagedCamera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getCameras()
      .then((items) => {
        setCameras(items);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data kamera.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const onlineCount = cameras.filter((camera) => camera.status === "Online").length;
  const offlineCount = cameras.length - onlineCount;
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
            <span>{cameras.length} kamera</span>
          </div>
          {errorMessage ? <p className="activationNotice">{errorMessage}</p> : null}
          <div className="cameraList">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat kamera...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : cameras.length > 0 ? cameras.map((camera) => (
              <div className="cameraItem cameraManagementItem" key={`${camera.location}-${camera.name}`}>
                <div className="cameraIdentity">
                  <strong>{camera.name}</strong>
                  <span>{camera.customerName} · {camera.location}</span>
                </div>
                <span className={camera.status === "Online" ? "pill success" : "pill danger"}>
                  {camera.status}
                </span>
                <span>{camera.retention}</span>
                <span>{camera.cloudRecordingEnabled && camera.status === "Online" ? "Recording aktif" : "Cek koneksi"}</span>
              </div>
            )) : (
              <div className="emptyState">
                <strong>Belum ada kamera</strong>
                <span>Tambahkan kamera dari data pelanggan aktif.</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Prioritas teknis</h2>
              <p>Kamera offline perlu dicek agar rekaman cloud tetap lengkap.</p>
            </div>
            <span>Ops</span>
          </div>
          <div className="customerSummary">
            <div>
              <span>Perlu follow-up</span>
              <strong>{offlineCount}</strong>
            </div>
            <div>
              <span>Kamera sehat</span>
              <strong>{onlineCount}</strong>
            </div>
            <div>
              <span>Lokasi aktif</span>
              <strong>{locations}</strong>
            </div>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
