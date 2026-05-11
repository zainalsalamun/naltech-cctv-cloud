import { CameraPreview } from "@/components/CameraPreview";
import { DashboardShell } from "@/components/DashboardShell";
import { cameras, leads, stats } from "@/data/demo";

export default function AdminPage() {
  return (
    <DashboardShell
      mode="admin"
      title="Dashboard Operasional"
      subtitle="Pantau lead survey, kamera cloud, status pelanggan, dan potensi revenue bulanan."
    >
      <section className="statGrid">
        {stats.map((item) => (
          <article className="metricCard" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <h2>Lead survey terbaru</h2>
            <span>Demo data</span>
          </div>
          <div className="tableLike">
            {leads.map((lead) => (
              <div className="tableRow" key={lead.name}>
                <strong>{lead.name}</strong>
                <span>{lead.segment}</span>
                <span>{lead.cameras} kamera</span>
                <span>{lead.package}</span>
                <em>{lead.status}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>Live preview</h2>
            <span>Online</span>
          </div>
          <CameraPreview title="Kasir 01" />
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <h2>Status kamera</h2>
            <span>{cameras.length} kamera</span>
          </div>
          <div className="cameraList">
            {cameras.map((camera) => (
              <div className="cameraItem" key={`${camera.location}-${camera.name}`}>
                <div>
                  <strong>{camera.name}</strong>
                  <span>{camera.location}</span>
                </div>
                <span className={camera.status === "Online" ? "pill success" : "pill danger"}>
                  {camera.status}
                </span>
                <span>{camera.retention}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
