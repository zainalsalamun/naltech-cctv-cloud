"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createInvoice, createPayment, deleteInvoice, deletePayment, getCustomers, getInvoices, updateInvoice } from "@/lib/api";
import { calculateMonthlyAmount, formatRupiah } from "@/lib/pricing";
import { createInvoiceReminderUrl } from "@/lib/whatsapp";
import type { Invoice, InvoicePayload, InvoiceStatus, LeadWithId, PaymentMethod, PaymentPayload } from "@/types/operational";

const emptyInvoiceForm: InvoicePayload = {
  customerId: "",
  status: "Unpaid",
  dueDate: "",
  amount: undefined,
  cameras: undefined
};

const invoiceStatuses: InvoiceStatus[] = ["Draft", "Unpaid", "Paid", "Overdue"];
const editableInvoiceStatuses: InvoiceStatus[] = ["Draft", "Unpaid", "Overdue"];
const invoiceStatusFilters = ["Semua status", ...invoiceStatuses];
const paymentMethods: PaymentMethod[] = ["Transfer Bank", "Tunai", "E-Wallet", "Lainnya"];

function localDateValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function emptyPaymentForm(): PaymentPayload {
  return {
    amount: 0,
    method: "Transfer Bank",
    paidAt: localDateValue(),
    reference: "",
    notes: ""
  };
}

function formatPaymentDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<LeadWithId[]>([]);
  const [invoiceForm, setInvoiceForm] = useState<InvoicePayload>(emptyInvoiceForm);
  const [editingInvoiceId, setEditingInvoiceId] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentPayload>(emptyPaymentForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    Promise.all([getInvoices(), getCustomers()])
      .then(([items, activeCustomers]) => {
        setInvoices(items);
        setCustomers(activeCustomers);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data invoice.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === invoiceForm.customerId);
  const calculatedAmount = selectedCustomer
    ? calculateMonthlyAmount(invoiceForm.cameras || selectedCustomer.cameras || 1, selectedCustomer.package)
    : 0;
  const displayAmount = invoiceForm.amount || calculatedAmount;

  function setCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);

    setInvoiceForm((current) => ({
      ...current,
      customerId,
      cameras: customer?.cameras || current.cameras,
      amount: customer ? calculateMonthlyAmount(customer.cameras || 1, customer.package) : current.amount
    }));
  }

  function resetForm() {
    setEditingInvoiceId("");
    setInvoiceForm(emptyInvoiceForm);
  }

  function startEdit(invoice: Invoice) {
    const customer = customers.find((item) => item.name === invoice.customer && item.area === invoice.area);

    setEditingInvoiceId(invoice.id);
    setInvoiceForm({
      customerId: customer?.id || "",
      status: invoice.status,
      dueDate: "",
      amount: invoice.amount,
      cameras: invoice.cameras
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function saveInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savedInvoice = editingInvoiceId
        ? await updateInvoice(editingInvoiceId, invoiceForm)
        : await createInvoice({
            ...invoiceForm,
            amount: displayAmount || undefined
          });

      setInvoices((current) =>
        editingInvoiceId
          ? current.map((invoice) => (invoice.id === savedInvoice.id ? savedInvoice : invoice))
          : [savedInvoice, ...current]
      );
      setSuccessMessage(editingInvoiceId ? "Invoice berhasil diperbarui." : "Invoice baru berhasil dibuat.");
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan invoice.");
    } finally {
      setIsSaving(false);
    }
  }

  function startPayment(invoice: Invoice) {
    setPaymentInvoice(invoice);
    setPaymentForm({
      ...emptyPaymentForm(),
      amount: invoice.remainingAmount
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function savePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentInvoice) return;

    setIsPaymentSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const updatedInvoice = await createPayment(paymentInvoice.id, paymentForm);
      setInvoices((current) => current.map((item) => (item.id === updatedInvoice.id ? updatedInvoice : item)));
      setSuccessMessage(`Pembayaran ${paymentInvoice.id} berhasil dicatat.`);
      setPaymentInvoice(null);
      setPaymentForm(emptyPaymentForm());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mencatat pembayaran.");
    } finally {
      setIsPaymentSaving(false);
    }
  }

  async function removePayment(invoice: Invoice, paymentId: string) {
    if (!window.confirm(`Hapus pembayaran dari invoice ${invoice.id}?`)) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedInvoice = await deletePayment(invoice.id, paymentId);
      setInvoices((current) => current.map((item) => (item.id === updatedInvoice.id ? updatedInvoice : item)));
      setSuccessMessage(`Pembayaran ${invoice.id} berhasil dihapus.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus pembayaran.");
    }
  }

  async function removeInvoice(invoice: Invoice) {
    if (!window.confirm(`Hapus invoice ${invoice.id}?`)) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteInvoice(invoice.id);
      setInvoices((current) => current.filter((item) => item.id !== invoice.id));
      setSuccessMessage("Invoice berhasil dihapus.");
      if (editingInvoiceId === invoice.id) resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus invoice.");
    }
  }

  const paidTotal = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const unpaidTotal = invoices.reduce((sum, invoice) => sum + invoice.remainingAmount, 0);
  const mrrTotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const activeInvoiceCount = invoices.length;
  const filteredInvoices = invoices.filter((invoice) => {
    const query = normalize(searchQuery);
    const matchesSearch =
      !query ||
      normalize(`${invoice.id} ${invoice.customer} ${invoice.area} ${invoice.package} ${invoice.status} ${invoice.dueDate}`).includes(query);
    const matchesStatus = statusFilter === "Semua status" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardShell
      mode="admin"
      title="Billing & Tagihan"
      subtitle="Pantau recurring revenue, invoice pelanggan, dan status pembayaran Cloud CCTV."
      searchValue={searchQuery}
      searchPlaceholder="Cari invoice, customer, status..."
      onSearchChange={setSearchQuery}
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
            <span>{filteredInvoices.length} invoice</span>
          </div>
          <div className="filterBar">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {invoiceStatusFilters.map((status) => (
                <option value={status} key={status}>{status}</option>
              ))}
            </select>
            <button type="button" onClick={() => {
              setSearchQuery("");
              setStatusFilter("Semua status");
            }}>
              Reset filter
            </button>
          </div>
          {errorMessage ? <p className="activationNotice errorNotice">{errorMessage}</p> : null}
          {successMessage ? <p className="activationNotice">{successMessage}</p> : null}
          <div className="billingTable">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat invoice...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => {
              const reminderUrl = createInvoiceReminderUrl(invoice);
              const canSendReminder = invoice.status === "Unpaid" || invoice.status === "Overdue";

              return (
                <div className="billingRow" key={invoice.id}>
                  <div className="billingIdentity">
                    <strong>{invoice.id}</strong>
                    <span>{invoice.customer} · {invoice.area}</span>
                  </div>
                  <div className="billingMeta">
                    <span>{invoice.package}</span>
                    <span>{invoice.cameras} kamera</span>
                    <strong>{formatRupiah(invoice.amount)}</strong>
                    <span className={`pill ${invoice.status === "Paid" ? "success" : invoice.status === "Overdue" ? "danger" : "warning"}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="billingRowFooter">
                    <span>Jatuh tempo {invoice.dueDate}</span>
                    <div className="billingActions">
                      {canSendReminder ? reminderUrl ? (
                        <a
                          className="whatsappButton"
                          href={reminderUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Ingatkan ${invoice.customer} melalui WhatsApp`}
                        >
                          Ingatkan WA
                        </a>
                      ) : (
                        <button
                          className="whatsappButton"
                          type="button"
                          disabled
                          title="Nomor WhatsApp pelanggan belum tersedia"
                        >
                          WA belum ada
                        </button>
                      ) : null}
                      {canSendReminder && invoice.remainingAmount > 0 ? (
                        <button className="paymentButton" type="button" onClick={() => startPayment(invoice)}>
                          Catat Bayar
                        </button>
                      ) : null}
                      <button type="button" onClick={() => startEdit(invoice)}>Edit</button>
                      <button type="button" className="dangerButton" onClick={() => removeInvoice(invoice)}>Hapus</button>
                    </div>
                  </div>
                  <div className="paymentSummary">
                    <span>Dibayar <strong>{formatRupiah(invoice.paidAmount)}</strong></span>
                    <span>Sisa <strong>{formatRupiah(invoice.remainingAmount)}</strong></span>
                  </div>
                  {invoice.payments.length ? (
                    <div className="paymentHistory">
                      <strong>Riwayat pembayaran</strong>
                      {invoice.payments.map((payment) => (
                        <div className="paymentHistoryRow" key={payment.id}>
                          <div>
                            <strong>{formatRupiah(payment.amount)}</strong>
                            <span>{payment.method} · {formatPaymentDate(payment.paidAt)}</span>
                          </div>
                          <span>{payment.reference || "Tanpa referensi"}</span>
                          <button
                            type="button"
                            onClick={() => removePayment(invoice, payment.id)}
                            aria-label={`Hapus pembayaran ${formatRupiah(payment.amount)}`}
                            title="Hapus pembayaran"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              <div className="emptyState">
                <strong>{invoices.length ? "Invoice tidak ditemukan" : "Belum ada invoice aktif"}</strong>
                <span>{invoices.length ? "Coba ubah kata kunci atau reset filter." : "Invoice akan dibuat setelah lead berubah menjadi Pilot aktif."}</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <h2>{editingInvoiceId ? "Edit invoice" : "Buat invoice"}</h2>
              <p>Pilih pelanggan aktif, tentukan jatuh tempo, lalu simpan tagihan bulanan.</p>
            </div>
            <span>{editingInvoiceId ? "Edit" : "Baru"}</span>
          </div>
          <form className="billingForm" onSubmit={saveInvoice}>
            <label>
              <span>Pelanggan</span>
              <select value={invoiceForm.customerId} onChange={(event) => setCustomer(event.target.value)} required>
                <option value="">Pilih pelanggan</option>
                {customers.map((customer) => (
                  <option value={customer.id} key={customer.id}>
                    {customer.name} - {customer.area}
                  </option>
                ))}
              </select>
            </label>
            <div className="cameraFormSplit">
              <label>
                <span>Status</span>
                <select
                  value={invoiceForm.status}
                  disabled={invoiceForm.status === "Paid"}
                  onChange={(event) =>
                    setInvoiceForm((current) => ({ ...current, status: event.target.value as InvoiceStatus }))
                  }
                >
                  {(invoiceForm.status === "Paid" ? ["Paid"] : editableInvoiceStatuses).map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Jumlah kamera</span>
                <input
                  type="number"
                  min="1"
                  value={invoiceForm.cameras || ""}
                  onChange={(event) => {
                    const cameras = Number(event.target.value);
                    setInvoiceForm((current) => ({
                      ...current,
                      cameras,
                      amount: selectedCustomer ? calculateMonthlyAmount(cameras || 1, selectedCustomer.package) : current.amount
                    }));
                  }}
                  placeholder="Otomatis"
                />
              </label>
            </div>
            <label>
              <span>Jatuh tempo</span>
              <input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, dueDate: event.target.value }))}
                required={!editingInvoiceId}
              />
            </label>
            <label>
              <span>Nominal</span>
              <input
                type="number"
                min="1"
                value={displayAmount || ""}
                onChange={(event) =>
                  setInvoiceForm((current) => ({ ...current, amount: Number(event.target.value) || undefined }))
                }
                placeholder="Otomatis dari paket"
              />
            </label>
            <div className="billingPreview">
              <span>Estimasi tagihan</span>
              <strong>{displayAmount ? formatRupiah(displayAmount) : "-"}</strong>
              <small>{selectedCustomer ? `${selectedCustomer.package} · ${invoiceForm.cameras || selectedCustomer.cameras} kamera` : "Pilih pelanggan dulu"}</small>
            </div>
            <div className="cameraFormActions">
              <button className="button buttonPrimary" type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : editingInvoiceId ? "Simpan Invoice" : "Buat Invoice"}
              </button>
              {editingInvoiceId ? (
                <button className="button buttonGhost" type="button" onClick={resetForm}>
                  Batal
                </button>
              ) : null}
            </div>
          </form>
          <Link className="button buttonGhost fullWidth" href="/customer-portal">
            Lihat Portal Customer
          </Link>
        </article>
      </section>
      {paymentInvoice ? (
        <div className="paymentModalBackdrop">
          <section className="paymentModal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
            <div className="panelHeader">
              <div>
                <h2 id="payment-modal-title">Catat pembayaran</h2>
                <p>{paymentInvoice.id} · {paymentInvoice.customer}</p>
              </div>
              <button
                className="modalCloseButton"
                type="button"
                onClick={() => setPaymentInvoice(null)}
                aria-label="Tutup form pembayaran"
              >
                ×
              </button>
            </div>
            <div className="paymentBalance">
              <span>Sisa tagihan</span>
              <strong>{formatRupiah(paymentInvoice.remainingAmount)}</strong>
            </div>
            <form className="billingForm" onSubmit={savePayment}>
              <div className="cameraFormSplit">
                <label>
                  <span>Nominal pembayaran</span>
                  <input
                    type="number"
                    min="1"
                    max={paymentInvoice.remainingAmount}
                    value={paymentForm.amount || ""}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))}
                    required
                  />
                </label>
                <label>
                  <span>Tanggal bayar</span>
                  <input
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, paidAt: event.target.value }))}
                    required
                  />
                </label>
              </div>
              <label>
                <span>Metode pembayaran</span>
                <select
                  value={paymentForm.method}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as PaymentMethod }))}
                >
                  {paymentMethods.map((method) => <option value={method} key={method}>{method}</option>)}
                </select>
              </label>
              <label>
                <span>Nomor referensi</span>
                <input
                  value={paymentForm.reference || ""}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))}
                  placeholder="Contoh: TRX-20260622-001"
                />
              </label>
              <label>
                <span>Catatan</span>
                <textarea
                  value={paymentForm.notes || ""}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Catatan internal opsional"
                  rows={3}
                />
              </label>
              <div className="cameraFormActions">
                <button className="button buttonPrimary" type="submit" disabled={isPaymentSaving}>
                  {isPaymentSaving ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
                <button className="button buttonGhost" type="button" onClick={() => setPaymentInvoice(null)}>
                  Batal
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}
