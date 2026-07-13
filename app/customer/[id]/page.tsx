import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { getCustomerDetail } from "@/lib/server/repository";
import { formatRupiah } from "@/lib/pricing";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  return (
    <DashboardShell
      mode="admin"
      title={customer.name}
      subtitle={`Detail pelanggan ${customer.segment} di ${customer.area}. Paket ${customer.package}, ${customer.cameraCount} kamera cloud.`}
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">PK</div>
          <div>
            <span>Paket</span>
            <strong>{customer.package}</strong>
            <small>Retensi mengikuti paket</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">CM</div>
          <div>
            <span>Kamera</span>
            <strong>{customer.cameraCount}</strong>
            <small>{customer.onlineCameras} kamera online</small>
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
            <strong>{formatRupiah(customer.monthlyAmount)}</strong>
            <small>{customer.latestInvoice?.status || "Estimasi bulanan"}</small>
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
            <span>{customer.status}</span>
          </div>
          <div className="customerDetailGrid">
            <div>
              <span>Nama pelanggan</span>
              <strong>{customer.name}</strong>
            </div>
            <div>
              <span>Jenis lokasi</span>
              <strong>{customer.segment}</strong>
            </div>
            <div>
              <span>Area</span>
              <strong>{customer.area}</strong>
            </div>
            <div>
              <span>Paket cloud</span>
              <strong>{customer.package}</strong>
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
            <Link className="button buttonPrimary fullWidth" href={`/customer-portal?customerId=${customer.id}`}>
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
            <span>{customer.cameraCount} kamera</span>
          </div>
          <div className="cameraList">
            {customer.cameras.length > 0 ? customer.cameras.map((camera) => (
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
            )) : (
              <div className="emptyState">
                <strong>Belum ada kamera</strong>
                <span>Kamera pelanggan akan muncul setelah ditambahkan.</span>
              </div>
            )}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
