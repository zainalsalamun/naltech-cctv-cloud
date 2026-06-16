"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { getInvoices } from "@/lib/api";
import { formatRupiah } from "@/lib/pricing";
import type { Invoice } from "@/types/operational";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getInvoices()
      .then((items) => {
        setInvoices(items);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data invoice.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const paidTotal = invoices.filter((invoice) => invoice.status === "Paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const unpaidTotal = invoices.filter((invoice) => invoice.status === "Unpaid" || invoice.status === "Overdue").reduce((sum, invoice) => sum + invoice.amount, 0);
  const mrrTotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const activeInvoiceCount = invoices.length;

  return (
    <DashboardShell
      mode="admin"
      title="Billing & Tagihan"
      subtitle="Pantau recurring revenue, invoice pelanggan, dan status pembayaran Cloud CCTV."
    >
      <section className="statGrid">
        <article className="metricCard">
          <div className="metricIcon accent-1">MR</div>
          <div>
            <span>MRR aktif</span>
            <strong>{formatRupiah(mrrTotal)}</strong>
            <small>{activeInvoiceCount} invoice aktif</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-2">PD</div>
          <div>
            <span>Paid</span>
            <strong>{formatRupiah(paidTotal)}</strong>
            <small>Pembayaran diterima</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-3">UN</div>
          <div>
            <span>Unpaid</span>
            <strong>{formatRupiah(unpaidTotal)}</strong>
            <small>Butuh follow-up</small>
          </div>
        </article>
        <article className="metricCard">
          <div className="metricIcon accent-4">IV</div>
          <div>
            <span>Total invoice</span>
            <strong>{invoices.length}</strong>
            <small>Bulan Mei 2026</small>
          </div>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Invoice bulan berjalan</h2>
              <p>Daftar tagihan pelanggan Cloud CCTV dan status pembayarannya.</p>
            </div>
            <span>{invoices.length} invoice</span>
          </div>
          {errorMessage ? <p className="activationNotice">{errorMessage}</p> : null}
          <div className="billingTable">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat invoice...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : invoices.length > 0 ? invoices.map((invoice) => (
              <div className="billingRow" key={invoice.id}>
                <div className="billingIdentity">
                  <strong>{invoice.id}</strong>
                  <span>{invoice.customer} · {invoice.area}</span>
                </div>
                <span>{invoice.package}</span>
                <span>{invoice.cameras} kamera</span>
                <strong>{formatRupiah(invoice.amount)}</strong>
                <span className={`pill ${invoice.status === "Paid" ? "success" : invoice.status === "Overdue" ? "danger" : "warning"}`}>
                  {invoice.status}
                </span>
                <span>{invoice.dueDate}</span>
              </div>
            )) : (
              <div className="emptyState">
                <strong>Belum ada invoice aktif</strong>
                <span>Invoice akan dibuat setelah lead berubah menjadi Pilot aktif.</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>Aksi billing</h2>
              <p>Aksi operasional untuk penagihan pelanggan aktif.</p>
            </div>
            <span>Mei</span>
          </div>
          <div className="billingSummary">
            <div>
              <span>Invoice berikutnya</span>
              <strong>20 Mei 2026</strong>
            </div>
            <div>
              <span>Metode pembayaran</span>
              <strong>Transfer bank</strong>
            </div>
            <div>
              <span>Reminder</span>
              <strong>H-3 jatuh tempo</strong>
            </div>
          </div>
          <button className="button buttonPrimary fullWidth" type="button">Buat invoice</button>
          <Link className="button buttonGhost fullWidth" href="/customer-portal">
            Lihat Portal Customer
          </Link>
        </article>
      </section>
    </DashboardShell>
  );
}
