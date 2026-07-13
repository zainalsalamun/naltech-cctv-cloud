import Link from "next/link";
import { redirect } from "next/navigation";
import { CameraPreview } from "@/components/CameraPreview";
import { DashboardShell } from "@/components/DashboardShell";
import { company } from "@/data/operational";
import { formatRupiah } from "@/lib/pricing";
import { getCustomerDetail, listCustomers } from "@/lib/server/repository";
import { getSession } from "@/lib/server/session";

type CustomerPortalPageProps = {
  searchParams: Promise<{
    customerId?: string;
  }>;
};

function retentionDays(retention: string) {
  return Number.parseInt(retention, 10) || 0;
}

export default async function CustomerPortalPage({ searchParams }: CustomerPortalPageProps) {
  const { customerId } = await searchParams;
  const session = await getSession();

  if (!session) redirect("/login");

  const customers = await listCustomers();
  const selectedCustomerId = session.role === "customer"
    ? session.customerId
    : customers.some((customer) => customer.id === customerId)
      ? customerId
      : customers[0]?.id;
  const customer = selectedCustomerId ? await getCustomerDetail(selectedCustomerId) : null;

  if (!customer) {
    return (
      <DashboardShell
        mode="customer"
        title="Customer Portal"
        subtitle="Portal akan aktif setelah customer dan kamera cloud tersedia."
      >
        <section className="panel">
          <div className="emptyState">
            <strong>Belum ada customer aktif</strong>
            <span>Aktifkan lead menjadi Pilot aktif dari dashboard admin terlebih dahulu.</span>
          </div>
        </section>
      </DashboardShell>
    );
  }

  const longestRetention = Math.max(0, ...customer.cameras.map((camera) => retentionDays(camera.retention)));
  const invoice = customer.latestInvoice;
  const supportMessage = encodeURIComponent(
    `Halo Naltech, saya dari ${customer.name}. Saya membutuhkan bantuan untuk layanan Cloud CCTV.`
  );
  const playbackItems = [
    { time: "Hari ini", range: "00:00 - sekarang", status: "Tersedia" },
    { time: "Kemarin", range: "00:00 - 23:59", status: "Tersedia" },
    { time: "7 hari terakhir", range: "Arsip rekaman cloud", status: longestRetention >= 7 ? "Tersedia" : "Terbatas" },
    { time: "Retensi maksimum", range: `${longestRetention || "-"} hari`, status: longestRetention ? "Aktif" : "Belum aktif" }
  ];

  return (
    <DashboardShell
      mode="customer"
      portalCustomerId={customer.id}
      title={customer.name}
      subtitle={`Paket ${customer.package} aktif. ${customer.cameraCount} kamera cloud di ${customer.area} dengan retensi hingga ${longestRetention || "-"} hari.`}
    >
      {session.role === "admin" ? (
        <form className="portalCustomerPicker" method="get">
          <label htmlFor="customerId">
            <span>Preview portal customer</span>
            <select id="customerId" name="customerId" defaultValue={customer.id}>
              {customers.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} - {item.area}
                </option>
              ))}
            </select>
          </label>
          <button className="button buttonPrimary" type="submit">Buka Portal</button>
        </form>
      ) : null}

      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">PK</div>
          <div>
            <span>Paket aktif</span>
            <strong>{customer.package}</strong>
            <small>Retensi {longestRetention || "-"} hari</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">CM</div>
          <div>
            <span>Kamera cloud</span>
            <strong>{customer.cameraCount}</strong>
            <small>{customer.segment} di {customer.area}</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">ON</div>
          <div>
            <span>Online</span>
            <strong>{customer.onlineCameras}</strong>
            <small>{customer.cameraCount - customer.onlineCameras} kamera offline</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">BL</div>
          <div>
            <span>Tagihan</span>
            <strong>{formatRupiah(customer.monthlyAmount)}</strong>
            <small>{invoice ? `${invoice.status} · ${invoice.dueDate}` : "Estimasi bulanan"}</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid customerGrid">
        <article className="panel wide" id="live-view">
          <div className="panelHeader">
            <div>
              <h2>Live view kamera</h2>
              <p>Pantau kamera prioritas yang terhubung ke cloud recording.</p>
            </div>
            <span>{customer.onlineCameras} online</span>
          </div>
          {customer.cameras.length > 0 ? (
            <div className="previewGrid customerPreviewGrid">
              {customer.cameras.map((camera) => (
                <CameraPreview
                  key={camera.id}
                  title={camera.name}
                  status={camera.status === "Online" ? "LIVE" : "OFF"}
                />
              ))}
            </div>
          ) : (
            <div className="emptyState">
              <strong>Belum ada kamera</strong>
              <span>Kamera akan tampil setelah ditambahkan dari dashboard admin.</span>
            </div>
          )}
        </article>

        <article className="panel" id="paket-tagihan">
          <div className="panelHeader">
            <div>
              <h2>Paket & tagihan</h2>
              <p>Ringkasan layanan dan invoice terbaru.</p>
            </div>
            <span>{invoice?.status || "Aktif"}</span>
          </div>
          <div className="billingCard">
            <div>
              <span>Total bulanan</span>
              <strong>{formatRupiah(customer.monthlyAmount)}</strong>
            </div>
            <div>
              <span>Kamera</span>
              <strong>{customer.cameraCount} kamera</strong>
            </div>
            <div>
              <span>Retensi</span>
              <strong>{longestRetention || "-"} hari</strong>
            </div>
            <div>
              <span>Jatuh tempo</span>
              <strong>{invoice?.dueDate || "Belum ada invoice"}</strong>
            </div>
          </div>
        </article>

        <article className="panel wide" id="playback">
          <div className="panelHeader">
            <div>
              <h2>Playback rekaman</h2>
              <p>Ketersediaan arsip mengikuti retensi kamera cloud.</p>
            </div>
            <span>{longestRetention || "-"} hari</span>
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
                <button type="button" disabled={customer.onlineCameras === 0}>Buka playback</button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Status storage</h2>
              <p>Kondisi backup tiap kamera cloud.</p>
            </div>
            <span>Cloud</span>
          </div>
          <div className="storageList">
            {customer.cameras.length > 0 ? customer.cameras.map((camera, index) => {
              const storage = camera.status === "Online" ? Math.min(94, 72 + index * 6) : 0;

              return (
                <div key={camera.id}>
                  <div>
                    <strong>{camera.name}</strong>
                    <span>{camera.status}</span>
                  </div>
                  <div className="storageBar">
                    <span style={{ width: `${storage}%` }} />
                  </div>
                  <small>{camera.status === "Online" ? `${storage}% buffer retensi` : "Menunggu koneksi"}</small>
                </div>
              );
            }) : (
              <div className="emptyState">
                <strong>Storage belum aktif</strong>
                <span>Tambahkan kamera untuk mulai cloud recording.</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Status kamera</h2>
              <p>Monitoring kamera yang masuk paket cloud customer.</p>
            </div>
            <span>{customer.area}</span>
          </div>
          <div className="cameraList">
            {customer.cameras.length > 0 ? customer.cameras.map((camera) => (
              <div className="cameraItem" key={camera.id}>
                <div className="cameraIdentity">
                  <strong>{camera.name}</strong>
                  <span>{camera.location} · Retensi {camera.retention}</span>
                </div>
                <span className={camera.status === "Online" ? "pill success" : "pill danger"}>
                  {camera.status}
                </span>
              </div>
            )) : (
              <div className="emptyState">
                <strong>Belum ada kamera</strong>
                <span>Hubungi tim Naltech untuk aktivasi kamera cloud.</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Butuh bantuan?</h2>
              <p>Hubungi support untuk kendala kamera, playback, atau tagihan.</p>
            </div>
            <span>Support</span>
          </div>
          <div className="customerActionStack">
            <Link
              className="button buttonPrimary fullWidth"
              href={`https://wa.me/${company.phoneWa}?text=${supportMessage}`}
              target="_blank"
            >
              Hubungi WhatsApp
            </Link>
            <Link className="button buttonGhost fullWidth" href={`mailto:${company.email}`}>
              Kirim Email
            </Link>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
