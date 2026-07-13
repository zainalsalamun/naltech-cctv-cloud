"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { getCameras, getCustomers, getLeads } from "@/lib/api";
import { calculateMonthlyAmount, formatRupiah } from "@/lib/pricing";
import { customerStatus } from "@/lib/operational";
import type { LeadWithId, ManagedCamera } from "@/types/operational";

const packageOptions = ["Semua paket", "Basic", "Standard", "Pro"];
const statusOptions = ["Semua status", "Aktif", "Survey", "Prospek"];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export default function CustomerManagementPage() {
  const [allLeads, setAllLeads] = useState<LeadWithId[]>([]);
  const [activeLeads, setActiveLeads] = useState<LeadWithId[]>([]);
  const [managedCameras, setManagedCameras] = useState<ManagedCamera[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("Semua paket");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Promise.all([getLeads(), getCustomers(), getCameras()])
      .then(([leads, customers, cloudCameras]) => {
        setAllLeads(leads);
        setActiveLeads(customers);
        setManagedCameras(cloudCameras);
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
        const customerCameras = managedCameras.filter((camera) => camera.customerId === lead.id);
        const cameraCount = customerCameras.length || lead.cameras;

        return {
          id: lead.id,
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
    [activeLeads, managedCameras]
  );

  const activeCustomers = customers.filter((customer) => customer.status === "Aktif");
  const filteredCustomers = useMemo(() => {
    const query = normalize(searchQuery);

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        normalize(`${customer.name} ${customer.segment} ${customer.area} ${customer.package}`).includes(query);
      const matchesPackage = packageFilter === "Semua paket" || customer.package === packageFilter;
      const matchesStatus = statusFilter === "Semua status" || customer.status === statusFilter;

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [customers, packageFilter, searchQuery, statusFilter]);
  const filteredCameraList = useMemo(() => {
    const query = normalize(searchQuery);
    if (!query) return managedCameras;

    return managedCameras.filter((camera) =>
      normalize(`${camera.name} ${camera.customerName} ${camera.location} ${camera.status} ${camera.retention}`).includes(query)
    );
  }, [managedCameras, searchQuery]);
  const totalCameras = customers.reduce((sum, customer) => sum + customer.cameras, 0);
  const pipelineCount = Math.max(0, allLeads.length - customers.length);
  const mrrTotal = customers.reduce((sum, customer) => sum + calculateMonthlyAmount(customer.cameras, customer.package), 0);

  return (
    <DashboardShell
      mode="admin"
      title="Kelola Pelanggan"
      subtitle="Pantau pelanggan cloud CCTV, paket aktif, status kamera, dan tagihan bulanan."
      searchValue={searchQuery}
      searchPlaceholder="Cari nama, area, paket, atau kamera..."
      onSearchChange={setSearchQuery}
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
            <span>{filteredCustomers.length} tampil</span>
          </div>
          <div className="filterBar">
            <select value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)}>
              {packageOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
            <button type="button" onClick={() => {
              setSearchQuery("");
              setPackageFilter("Semua paket");
              setStatusFilter("Semua status");
            }}>
              Reset filter
            </button>
          </div>
          {errorMessage ? <p className="activationNotice errorNotice">{errorMessage}</p> : null}
          <div className="customerTable">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat pelanggan...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
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
                  <Link href={`/customer/${customer.id}`}>Detail</Link>
                  <Link href={`/customer-portal?customerId=${customer.id}`}>Portal</Link>
                </div>
              </div>
            )) : (
              <div className="emptyState">
                <strong>{customers.length ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan aktif"}</strong>
                <span>{customers.length ? "Coba ubah kata kunci atau reset filter." : "Ubah status lead menjadi Pilot aktif dari dashboard admin."}</span>
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
            <span>{filteredCameraList.length} kamera</span>
          </div>
          <div className="cameraList">
            {filteredCameraList.length > 0 ? filteredCameraList.map((camera) => (
              <div className="cameraItem" key={camera.id}>
                <div className="cameraIdentity">
                  <strong>{camera.name}</strong>
                  <span>{camera.customerName}</span>
                </div>
                <span className={camera.status === "Online" ? "pill success" : "pill danger"}>
                  {camera.status}
                </span>
                <span>{camera.retention}</span>
              </div>
            )) : (
              <div className="emptyState">
                <strong>{managedCameras.length ? "Kamera tidak ditemukan" : "Belum ada kamera cloud"}</strong>
                <span>{managedCameras.length ? "Coba kata kunci lain di search atas." : "Kamera akan muncul setelah ditambahkan ke pelanggan."}</span>
              </div>
            )}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
