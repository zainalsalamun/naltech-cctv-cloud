import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { cameras, leads } from "@/data/operational";
import { calculateMonthlyAmount, formatRupiah } from "@/lib/pricing";
import { slugify } from "@/lib/operational";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const lead = leads.find((item) => slugify(item.name) === params.id) || leads[0];
  const customerCameras = cameras.filter((camera) => camera.location === lead.name);
  const cameraCount = customerCameras.length || lead.cameras;
  const monthly = calculateMonthlyAmount(cameraCount, lead.package);
  const online = customerCameras.filter((camera) => camera.status === "Online").length;

  return (
    <DashboardShell
      mode="admin"
      title={lead.name}
      subtitle={`Detail pelanggan ${lead.segment} di ${lead.area}. Paket ${lead.package}, ${cameraCount} kamera cloud.`}
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">PK</div>
          <div>
            <span>Paket</span>
            <strong>{lead.package}</strong>
            <small>Retensi mengikuti paket</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">CM</div>
          <div>
            <span>Kamera</span>
            <strong>{cameraCount}</strong>
            <small>{online} kamera online</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">ST</div>
          <div>
            <span>Status</span>
            <strong>Aktif</strong>
            <small>Monitoring berjalan</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">BL</div>
          <div>
            <span>Tagihan</span>
            <strong>{formatRupiah(monthly)}</strong>
            <small>Estimasi bulanan</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Profil pelanggan</h2>
              <p>Informasi singkat untuk operasional dan follow-up customer success.</p>
            </div>
            <span>{lead.status}</span>
          </div>
          <div className="customerDetailGrid">
            <div>
              <span>Nama pelanggan</span>
              <strong>{lead.name}</strong>
            </div>
            <div>
              <span>Jenis lokasi</span>
              <strong>{lead.segment}</strong>
            </div>
            <div>
              <span>Area</span>
              <strong>{lead.area}</strong>
            </div>
            <div>
              <span>Paket cloud</span>
              <strong>{lead.package}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Aksi cepat</h2>
              <p>Buka portal atau kembali ke daftar pelanggan.</p>
            </div>
            <span>Aksi</span>
          </div>
          <div className="customerActionStack">
            <Link className="button buttonPrimary fullWidth" href="/customer-portal">
              Lihat Portal Customer
            </Link>
            <Link className="button buttonGhost fullWidth" href="/customer">
              Kembali ke Pelanggan
            </Link>
          </div>
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Kamera pelanggan</h2>
              <p>Status kamera cloud untuk lokasi ini.</p>
            </div>
            <span>{cameraCount} kamera</span>
          </div>
          <div className="cameraList">
            {(customerCameras.length ? customerCameras : cameras.slice(0, cameraCount)).map((camera) => (
              <div className="cameraItem" key={`${camera.location}-${camera.name}`}>
                <div className="cameraIdentity">
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
