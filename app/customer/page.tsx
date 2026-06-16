"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { cameras } from "@/data/operational";
import { getCustomers, getLeads } from "@/lib/api";
import { calculateMonthlyAmount, formatRupiah } from "@/lib/pricing";
import { customerStatus, slugify } from "@/lib/operational";
import type { LeadWithId } from "@/types/operational";

export default function CustomerManagementPage() {
  const [allLeads, setAllLeads] = useState<LeadWithId[]>([]);
  const [activeLeads, setActiveLeads] = useState<LeadWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Promise.all([getLeads(), getCustomers()])
      .then(([leads, customers]) => {
        setAllLeads(leads);
        setActiveLeads(customers);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data pelanggan.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const customers = useMemo(
    () =>
      activeLeads.map((lead) => {
        const customerCameras = cameras.filter((camera) => camera.location === lead.name);
        const cameraCount = customerCameras.length || lead.cameras;

        return {
          id: slugify(lead.name),
          isSeedData: lead.id.startsWith("seed-"),
          name: lead.name,
          segment: lead.segment,
          area: lead.area,
          package: lead.package,
          status: customerStatus(lead.status),
          cameras: cameraCount,
          online: customerCameras.filter((camera) => camera.status === "Online").length,
          billing: formatRupiah(calculateMonthlyAmount(cameraCount, lead.package))
        };
      }),
    [activeLeads]
  );

  const activeCustomers = customers.filter((customer) => customer.status === "Aktif");
  const totalCameras = customers.reduce((sum, customer) => sum + customer.cameras, 0);
  const pipelineCount = Math.max(0, allLeads.length - customers.length);
  const mrrTotal = customers.reduce((sum, customer) => sum + calculateMonthlyAmount(customer.cameras, customer.package), 0);

  return (
    <DashboardShell
      mode="admin"
      title="Kelola Pelanggan"
      subtitle="Pantau pelanggan cloud CCTV, paket aktif, status kamera, dan tagihan bulanan."
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">PL</div>
          <div>
            <span>Total pelanggan</span>
            <strong>{customers.length}</strong>
            <small>{activeCustomers.length} pelanggan aktif</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">CM</div>
          <div>
            <span>Kamera cloud</span>
            <strong>{totalCameras}</strong>
            <small>Kamera pelanggan aktif</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">ON</div>
          <div>
            <span>Status aktif</span>
            <strong>{activeCustomers.length}</strong>
            <small>Siap dimonitor</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">MR</div>
          <div>
            <span>MRR berjalan</span>
            <strong>{formatRupiah(mrrTotal)}</strong>
            <small>Recurring revenue aktif</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Daftar pelanggan</h2>
              <p>Lead yang diaktifkan dari dashboard admin akan muncul sebagai pelanggan aktif.</p>
            </div>
            <span>{customers.length} aktif</span>
          </div>
          {errorMessage ? <p className="activationNotice">{errorMessage}</p> : null}
          <div className="customerTable">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat pelanggan...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : customers.length > 0 ? customers.map((customer) => (
              <div className="customerRow" key={`${customer.id}-${customer.name}`}>
                <div className="customerIdentity">
                  <strong>{customer.name}</strong>
                  <span>{customer.segment} · {customer.area}</span>
                </div>
                <span>{customer.package}</span>
                <span>{customer.cameras} kamera</span>
                <span className={customer.status === "Aktif" ? "pill success" : "pill warning"}>
                  {customer.status}
                </span>
                <strong>{customer.billing}</strong>
                <div className="customerActions">
                  <Link href={customer.isSeedData ? `/customer/${customer.id}` : "/customer"}>Detail</Link>
                  <Link href="/customer-portal">Portal</Link>
                </div>
              </div>
            )) : (
              <div className="emptyState">
                <strong>Belum ada pelanggan aktif</strong>
                <span>Ubah status lead menjadi Pilot aktif dari dashboard admin.</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Ringkasan pelanggan</h2>
              <p>Ringkasan pelanggan aktif dan pipeline dari sales.</p>
            </div>
            <span>Sales</span>
          </div>
          <div className="customerSummary">
            <div>
              <span>Aktif</span>
              <strong>{activeCustomers.length}</strong>
            </div>
            <div>
              <span>Pipeline sales</span>
              <strong>{pipelineCount}</strong>
            </div>
            <div>
              <span>Total kamera</span>
              <strong>{totalCameras}</strong>
            </div>
          </div>
          <Link className="button buttonPrimary fullWidth" href="/customer-portal">
            Buka Portal Customer
          </Link>
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Kamera per pelanggan</h2>
              <p>Monitoring singkat kamera cloud berdasarkan lokasi pelanggan.</p>
            </div>
            <span>{cameras.length} kamera</span>
          </div>
          <div className="cameraList">
            {cameras.map((camera) => (
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
