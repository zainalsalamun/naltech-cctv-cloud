import { CameraPreview } from "@/components/CameraPreview";
import { DashboardShell } from "@/components/DashboardShell";

const customerCameras = [
  { name: "Kasir 01", status: "Online", retention: "14 hari" },
  { name: "Pintu Masuk", status: "Online", retention: "14 hari" },
  { name: "Gudang", status: "Online", retention: "14 hari" },
  { name: "Parkir", status: "Offline", retention: "14 hari" }
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
          <span>Paket aktif</span>
          <strong>Standard</strong>
        </article>
        <article className="metricCard">
          <span>Kamera cloud</span>
          <strong>4</strong>
        </article>
        <article className="metricCard">
          <span>Online</span>
          <strong>3</strong>
        </article>
        <article className="metricCard">
          <span>Tagihan</span>
          <strong>Rp260rb</strong>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <h2>Live view</h2>
            <span>Customer demo</span>
          </div>
          <div className="previewGrid">
            {customerCameras.map((camera) => (
              <CameraPreview key={camera.name} title={camera.name} status={camera.status === "Online" ? "LIVE" : "OFF"} />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>Playback</h2>
            <span>14 hari</span>
          </div>
          <div className="playbackMock">
            <strong>Rekaman tersedia</strong>
            <span>Hari ini 00:00 - 23:59</span>
            <span>Kemarin 00:00 - 23:59</span>
            <button>Download klip 5 menit</button>
          </div>
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <h2>Status kamera</h2>
            <span>Lokasi toko</span>
          </div>
          <div className="cameraList">
            {customerCameras.map((camera) => (
              <div className="cameraItem" key={camera.name}>
                <div>
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
