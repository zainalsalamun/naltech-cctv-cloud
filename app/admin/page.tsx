"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { cameras, stats } from "@/data/operational";
import { getLeads, updateLeadStatus as updateLeadStatusApi } from "@/lib/api";
import { calculateMonthlyAmount, formatRupiah } from "@/lib/pricing";
import { leadStatusOptions } from "@/lib/operational";
import type { LeadStatus, LeadWithId } from "@/types/operational";

const whatsappNumber = "6281573550017";

export default function AdminPage() {
  const [allLeads, setAllLeads] = useState<LeadWithId[]>([]);
  const [openStatusId, setOpenStatusId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [activationNote, setActivationNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getLeads()
      .then((leads) => {
        setAllLeads(leads);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data lead.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const adminStats = useMemo(
    () => [
      { label: "Lead masuk", value: String(allLeads.length) },
      { label: "Lead baru", value: String(allLeads.filter((lead) => lead.status === "Baru").length) },
      { label: "Survey aktif", value: String(allLeads.filter((lead) => lead.status === "Survey dijadwalkan").length) },
      stats[3]
    ],
    [allLeads]
  );
  const selectedLead = allLeads.find((lead) => lead.id === selectedLeadId) || allLeads[0];
  const selectedEstimate = selectedLead
    ? calculateMonthlyAmount(selectedLead.cameras, selectedLead.package)
    : 0;
  const surveyChecklist = [
    "Cek upload internet",
    "Pilih kamera prioritas",
    "Rekomendasi paket",
    "Jadwalkan teknisi"
  ];
  const selectedLeadMessage = selectedLead
    ? [
        "Halo Naltech, saya ingin follow-up lead Cloud CCTV.",
        `Nama: ${selectedLead.name}`,
        `Lokasi: ${selectedLead.area}`,
        `Jenis lokasi: ${selectedLead.segment}`,
        `Kamera: ${selectedLead.cameras}`,
        `Paket: ${selectedLead.package}`,
        `Estimasi: ${formatRupiah(selectedEstimate)}/bulan`
      ].join("\n")
    : "";

  async function updateLeadStatus(leadId: string, status: LeadStatus) {
    const previousLeads = allLeads;
    setAllLeads((leads) => leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
    setOpenStatusId("");

    try {
      const updatedLead = await updateLeadStatusApi(leadId, status);
      setAllLeads((leads) => leads.map((lead) => (lead.id === leadId ? updatedLead : lead)));
      setErrorMessage("");
    } catch (error) {
      setAllLeads(previousLeads);
      setErrorMessage(error instanceof Error ? error.message : "Status lead gagal diperbarui.");
    }
  }

  function activateSelectedLead() {
    if (!selectedLead) return;
    updateLeadStatus(selectedLead.id, "Pilot aktif");
    setActivationNote(`${selectedLead.name} sudah ditandai sebagai pelanggan aktif. Cek halaman Kelola Pelanggan.`);
  }

  function toggleStatusDropdown(leadId: string) {
    setOpenStatusId((current) => (current === leadId ? "" : leadId));
  }

  return (
    <DashboardShell
      mode="admin"
      title="Dashboard Sales & Operasional"
      subtitle="Pantau lead survey dari landing page, ubah status follow-up, dan lihat kesiapan kamera cloud."
    >
      <section className="statGrid">
        {adminStats.map((item, index) => (
          <article className="metricCard" key={item.label}>
            <div className={`metricIcon accent-${index + 1}`}>{item.label.slice(0, 2)}</div>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{index === 3 ? "Recurring revenue berjalan" : "Data operasional"}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboardGrid">
        <article className="panel wide" id="status-kamera">
          <div className="panelHeader">
            <div>
              <h2>Lead survey terbaru</h2>
              <p>Data baru dari form landing page akan muncul di bagian paling atas.</p>
            </div>
            <span>{allLeads.length} lead</span>
          </div>
          {errorMessage ? <p className="activationNotice">{errorMessage}</p> : null}
          <div className="tableLike leadTable">
            {isLoading ? (
              <div className="emptyState">
                <strong>Memuat lead...</strong>
                <span>Data sedang diambil dari API internal.</span>
              </div>
            ) : allLeads.map((lead) => (
              <div className={`tableRow leadRow ${selectedLead?.id === lead.id ? "is-selected" : ""}`} key={lead.id}>
                <div className="leadIdentity">
                  <strong>{lead.name}</strong>
                  <span>{lead.phone || lead.area}</span>
                </div>
                <span className="leadMeta">{lead.segment}</span>
                <span className="leadMeta">{lead.cameras} kamera</span>
                <span className="leadMeta">{lead.package}</span>
                <div className="statusDropdown">
                  <button
                    type="button"
                    className="statusDropdownButton"
                    aria-label={`Status ${lead.name}`}
                    aria-expanded={openStatusId === lead.id}
                    onClick={() => toggleStatusDropdown(lead.id)}
                    onBlur={() => window.setTimeout(() => setOpenStatusId(""), 120)}
                  >
                    <span>{lead.status}</span>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="m5 7.5 5 5 5-5" />
                    </svg>
                  </button>
                  {openStatusId === lead.id ? (
                    <div className="statusDropdownMenu">
                      {leadStatusOptions.map((status) => (
                        <button
                          type="button"
                          key={status}
                          className={status === lead.status ? "is-active" : ""}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => updateLeadStatus(lead.id, status)}
                        >
                          <span>{status === lead.status ? "✓" : ""}</span>
                          {status}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="leadRowFooter">
                  <p>{lead.notes || "Menunggu follow-up tim sales."}</p>
                  <button type="button" onClick={() => setSelectedLeadId(lead.id)}>Detail</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel leadDetailPanel">
          <div className="panelHeader">
            <div>
              <h2>Detail lead</h2>
              <p>Ringkasan follow-up dan potensi recurring revenue.</p>
            </div>
            <span>{selectedLead?.status || "Lead"}</span>
          </div>
          {selectedLead ? (
            <div className="leadDetail">
              <div className="leadDetailHero">
                <strong>{selectedLead.name}</strong>
                <span>{selectedLead.segment} · {selectedLead.area}</span>
              </div>
              <div className="leadDetailGrid">
                <div>
                  <span>Kamera</span>
                  <strong>{selectedLead.cameras}</strong>
                </div>
                <div>
                  <span>Paket</span>
                  <strong>{selectedLead.package}</strong>
                </div>
                <div className="wide">
                  <span>Estimasi bulanan</span>
                  <strong>{formatRupiah(selectedEstimate)}</strong>
                </div>
              </div>
              <div className="leadDetailBlock">
                <span>Catatan kebutuhan</span>
                <p>{selectedLead.notes || "Menunggu follow-up tim sales untuk detail kebutuhan lokasi."}</p>
              </div>
              <div className="leadChecklist">
                {surveyChecklist.map((item, index) => (
                  <label key={item}>
                    <input type="checkbox" defaultChecked={index < 2 && selectedLead.status !== "Baru"} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              {activationNote ? <p className="activationNotice">{activationNote}</p> : null}
              <button className="button buttonGhost fullWidth" type="button" onClick={activateSelectedLead}>
                Aktifkan Jadi Pelanggan
              </button>
              <a
                className="button buttonPrimary fullWidth"
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(selectedLeadMessage)}`}
                target="_blank"
                rel="noreferrer"
              >
                Follow-up WhatsApp
              </a>
            </div>
          ) : null}
        </article>

        <article className="panel wide">
          <div className="panelHeader">
            <div>
              <h2>Status kamera</h2>
              <p>Monitoring singkat kamera yang sudah aktif cloud recording.</p>
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
