import { CameraPreview } from "@/components/CameraPreview";
import { DashboardShell } from "@/components/DashboardShell";

const customerCameras = [
  { name: "Kasir 01", status: "Online", retention: "14 hari", storage: "84%" },
  { name: "Pintu Masuk", status: "Online", retention: "14 hari", storage: "78%" },
  { name: "Gudang", status: "Online", retention: "14 hari", storage: "72%" },
  { name: "Parkir", status: "Offline", retention: "14 hari", storage: "0%" }
];

const playbackItems = [
  { time: "Hari ini", range: "00:00 - 23:59", status: "Tersedia" },
  { time: "Kemarin", range: "00:00 - 23:59", status: "Tersedia" },
  { time: "10 Mei 2026", range: "00:00 - 23:59", status: "Tersedia" },
  { time: "09 Mei 2026", range: "00:00 - 23:59", status: "Arsip" }
];

export default function CustomerPage() {
  return (
    <DashboardShell
      mode="customer"
      title="Toko Sumber Rejeki"
      subtitle="Paket Standard aktif. 4 kamera prioritas tersimpan ke cloud dengan retensi 14 hari."
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">PK</div>
          <div>
            <span>Paket aktif</span>
            <strong>Standard</strong>
            <small>Retensi 14 hari</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">CM</div>
          <div>
            <span>Kamera cloud</span>
            <strong>4</strong>
            <small>Prioritas toko</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">ON</div>
          <div>
            <span>Online</span>
            <strong>3</strong>
            <small>Monitoring aktif</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">BL</div>
          <div>
            <span>Tagihan</span>
            <strong>Rp260rb</strong>
            <small>Jatuh tempo 20 Mei</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid customerGrid">
        <article className="panel wide" id="live-view">
          <div className="panelHeader">
            <div>
              <h2>Live view kamera</h2>
              <p>Pantau kamera prioritas yang tersimpan ke cloud.</p>
            </div>
            <span>3 online</span>
          </div>
          <div className="previewGrid customerPreviewGrid">
            {customerCameras.map((camera) => (
              <CameraPreview key={camera.name} title={camera.name} status={camera.status === "Online" ? "LIVE" : "OFF"} />
            ))}
          </div>
        </article>

        <article className="panel" id="paket-tagihan">
          <div className="panelHeader">
            <div>
              <h2>Paket & tagihan</h2>
              <p>Ringkasan layanan aktif bulan ini.</p>
            </div>
            <span>Aktif</span>
          </div>
          <div className="billingCard">
            <div>
              <span>Total bulanan</span>
              <strong>Rp260.000</strong>
            </div>
            <div>
              <span>Kamera</span>
              <strong>4 kamera</strong>
            </div>
            <div>
              <span>Retensi</span>
              <strong>14 hari</strong>
            </div>
            <button>Unduh invoice</button>
          </div>
        </article>

        <article className="panel wide" id="playback">
          <div className="panelHeader">
            <div>
              <h2>Playback rekaman</h2>
              <p>Riwayat rekaman tersedia untuk kamera cloud.</p>
            </div>
            <span>14 hari</span>
          </div>
          <div className="playbackTimeline">
            {playbackItems.map((item) => (
              <div key={item.time}>
                <span className="timelineDot" />
                <div>
                  <strong>{item.time}</strong>
                  <span>{item.range}</span>
                </div>
                <em>{item.status}</em>
                <button>Download klip</button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Status storage</h2>
              <p>Kondisi backup per kamera.</p>
            </div>
            <span>Cloud</span>
          </div>
          <div className="storageList">
            {customerCameras.map((camera) => (
              <div key={camera.name}>
                <div>
                  <strong>{camera.name}</strong>
                  <span>{camera.status}</span>
                </div>
                <div className="storageBar">
                  <span style={{ width: camera.storage }} />
                </div>
                <small>{camera.status === "Online" ? `${camera.storage} buffer retensi` : "Menunggu koneksi"}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Status kamera</h2>
              <p>Monitoring singkat kamera yang masuk paket cloud.</p>
            </div>
            <span>Lokasi toko</span>
          </div>
          <div className="cameraList">
            {customerCameras.map((camera) => (
              <div className="cameraItem" key={camera.name}>
                <div className="cameraIdentity">
                  <strong>{camera.name}</strong>
                  <span>Retensi {camera.retention}</span>
                </div>
                <span className={camera.status === "Online" ? "pill success" : "pill danger"}>
                  {camera.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
