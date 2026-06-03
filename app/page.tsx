"use client";

import { FormEvent, useMemo, useState } from "react";
import { createLead } from "@/lib/api";
import { calculateMonthlyAmount, formatRupiah, packageRates } from "@/lib/pricing";
import type { CloudPackage } from "@/types/operational";

const whatsappNumber = "6281573550017";

const buildWaLink = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

export default function HomePage() {
  const [cameraCount, setCameraCount] = useState("4");
  const [selectedPackage, setSelectedPackage] = useState<CloudPackage>("Standard");
  const [note, setNote] = useState("Nomor WhatsApp tujuan sudah terhubung ke Naltech CCTV Cloud.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericCameraCount = Math.max(1, Number.parseInt(cameraCount || "1", 10) || 1);
  const estimateValue = useMemo(
    () => calculateMonthlyAmount(numericCameraCount, selectedPackage),
    [numericCameraCount, selectedPackage]
  );

  const estimateMessage = `Halo Naltech, saya ingin survey Cloud CCTV. Estimasi awal: ${numericCameraCount} kamera paket ${selectedPackage}, sekitar ${formatRupiah(estimateValue)} per bulan.`;

  function handlePackageClick(packageName: CloudPackage) {
    setSelectedPackage(packageName);
    setNote(`Paket ${packageName} dipilih. Silakan isi form agar pesan WhatsApp dibuat otomatis.`);
  }

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const segment = String(data.get("segment") || "");
    const cameras = String(data.get("cameras") || "");
    const notes = String(data.get("notes") || "-");
    const message = [
      "Halo Naltech, saya ingin survey Cloud CCTV.",
      `Nama: ${name}`,
      `WhatsApp: ${phone}`,
      `Jenis lokasi: ${segment}`,
      `Jumlah kamera: ${cameras}`,
      `Paket minat: ${selectedPackage}`,
      `Catatan: ${notes}`
    ].join("\n");

    try {
      await createLead({
        name,
        phone,
        segment,
        cameras: Math.max(1, Number.parseInt(cameras || "1", 10) || 1),
        package: selectedPackage,
        area: "Yogyakarta",
        notes
      });
      window.open(buildWaLink(message), "_blank", "noopener,noreferrer");
      setNote("Lead tersimpan di dashboard admin dan pesan WhatsApp sudah dibuat.");
      event.currentTarget.reset();
      setCameraCount("4");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Lead belum berhasil tersimpan. Coba lagi sebentar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <a href="mailto:info@naltech.id">info@naltech.id</a>
          <a href={`https://wa.me/${whatsappNumber}`}>0815 7355 0017</a>
        </div>
        <span>Yogyakarta, Sleman, Bantul, dan sekitarnya</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label="Naltech CCTV Cloud">
          <img src="/naltech-cctv-cloud-logo.svg" alt="Naltech CCTV Cloud" />
        </a>
        <nav className="nav-links" aria-label="Navigasi utama">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#paket">Paket</a>
          <a href="#kontak">Contact</a>
        </nav>
        <div className="header-actions">
          <a className="header-login" href="/login">Masuk</a>
          <a className="header-cta" href="#kontak">Minta Survey</a>
        </div>
      </header>

      <a className="floating-cta is-visible" href="#kontak">Minta Survey Cloud CCTV</a>

      <main>
        <section className="hero" id="home">
          <div className="camera-wall" aria-hidden="true">
            <div className="feed feed-main">
              <span className="feed-label">Kasir 01</span>
              <span className="rec-dot" />
              <div className="shelf-lines" />
            </div>
            <div className="feed">
              <span className="feed-label">Pintu Masuk</span>
              <span className="rec-dot" />
              <div className="door-frame" />
            </div>
            <div className="feed">
              <span className="feed-label">Gudang</span>
              <span className="rec-dot" />
              <div className="rack-grid" />
            </div>
            <div className="feed">
              <span className="feed-label">Parkir</span>
              <span className="rec-dot" />
              <div className="parking-lines" />
            </div>
          </div>

          <div className="hero-content">
            <p className="eyebrow">Naltech CCTV Cloud</p>
            <h1>Backup Rekaman CCTV Aman di Cloud</h1>
            <p className="hero-copy">
              Layanan instalasi CCTV dan cloud recording untuk bisnis, rumah,
              toko, gudang, kantor, dan kos. Lokal tetap jalan, cloud jadi
              cadangan saat harddisk, DVR, NVR, atau memori bermasalah.
            </p>
            <ul className="hero-checklist">
              <li>Backup rekaman kamera prioritas</li>
              <li>Live view dan playback dari dashboard</li>
              <li>Model hybrid: lokal tetap jalan, cloud jadi cadangan</li>
              <li>Survey dan support teknis dari tim CCTV</li>
            </ul>
            <div className="hero-actions">
              <a className="primary-button" href="#kontak">Jadwalkan Survey</a>
              <a className="secondary-button" href="#paket">Lihat Paket</a>
            </div>
            <a className="hero-platform-link" href="/login">Masuk ke platform operasional</a>
            <dl className="hero-metrics" aria-label="Ringkasan layanan">
              <div>
                <dt>7-30 hari</dt>
                <dd>retensi rekaman</dd>
              </div>
              <div>
                <dt>Hybrid</dt>
                <dd>lokal + cloud</dd>
              </div>
              <div>
                <dt>Prioritas</dt>
                <dd>kasir, gudang, pintu</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="trust-strip" aria-label="Keunggulan layanan">
          {[
            ["Survey dulu", "Tidak langsung dipaksa paket"],
            ["Mulai hybrid", "Rekaman lokal tetap berjalan"],
            ["Kamera prioritas", "Kasir, gudang, pintu, parkir"],
            ["Support teknis", "Dibantu dari survey sampai aktif"]
          ].map(([title, body]) => (
            <div className="trust-item" key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </section>

        <section className="about-section" id="about">
          <div className="section-inner two-column">
            <div>
              <p className="eyebrow">About</p>
              <h2>Layanan cloud untuk pelanggan yang sudah memakai CCTV.</h2>
              <p>
                Naltech CCTV Cloud membantu pemilik usaha dan rumah menyimpan
                backup rekaman kamera penting ke cloud. Fokus kami sederhana:
                rekaman tetap bisa diakses ketika perangkat lokal bermasalah.
              </p>
            </div>
            <div className="about-list">
              <div>
                <strong>Cloud recording</strong>
                <span>Rekaman kamera prioritas disimpan ke server/cloud.</span>
              </div>
              <div>
                <strong>Jasa pasang dan konfigurasi</strong>
                <span>Dibantu dari survey, setting kamera, sampai aktivasi.</span>
              </div>
              <div>
                <strong>Area layanan</strong>
                <span>Yogyakarta, Sleman, Bantul, dan sekitarnya.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="why-section">
          <div className="section-inner">
            <div className="section-heading compact">
              <p className="eyebrow">Kenapa Naltech</p>
              <h2>Dari pemasangan CCTV sampai backup cloud, dibantu satu tim.</h2>
            </div>
            <div className="why-grid">
              {[
                ["01", "Berpengalaman pasang CCTV", "Kami memahami kondisi lapangan, jenis kamera, NVR, jaringan, dan kendala yang sering terjadi."],
                ["02", "Survey sebelum aktivasi", "Kamera, upload internet, dan titik prioritas dicek dulu agar paket cloud tidak asal dipasang."],
                ["03", "Hybrid lokal + cloud", "Rekaman lokal tetap berjalan, cloud menjadi cadangan untuk kamera yang paling penting."],
                ["04", "Support sampai aktif", "Tim membantu konfigurasi, uji live view, playback, dan memastikan pelanggan bisa memakai layanan."]
              ].map(([number, title, body]) => (
                <article key={title}>
                  <span className="why-icon">{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="problem-band">
          <div className="section-inner two-column">
            <div>
              <p className="eyebrow">Masalah yang sering terjadi</p>
              <h2>Rekaman lokal sering baru terasa penting saat sudah hilang.</h2>
            </div>
            <div className="problem-list">
              {[
                ["HD", "Harddisk rusak", "Rekaman hilang ketika media penyimpanan lokal error atau sudah aus."],
                ["DV", "DVR/NVR bermasalah", "Perangkat mati, error, atau dicuri membuat bukti ikut berisiko hilang."],
                ["UP", "Tidak ada backup", "Backup manual sering terlambat dilakukan saat kejadian sudah lewat."]
              ].map(([icon, title, body]) => (
                <article key={title}>
                  <span className="icon-box" aria-hidden="true">{icon}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="service-section" id="services">
          <div className="section-inner">
            <div className="section-heading">
              <p className="eyebrow">Layanan yang dijual</p>
              <h2>Mulai dari kamera paling penting, tidak harus semua kamera.</h2>
              <p>
                Cocok untuk toko, gudang, kantor kecil, kos, dan pelanggan yang
                sudah memiliki CCTV tetapi ingin backup rekaman lebih aman.
              </p>
            </div>
            <div className="service-grid">
              {[
                ["01", "Survey CCTV dan internet", "Kami cek kamera, NVR, jaringan lokal, dan upload internet lokasi."],
                ["02", "Aktivasi cloud recording", "Kamera prioritas dihubungkan ke platform untuk backup rekaman."],
                ["03", "Live view dan playback", "Pelanggan bisa cek kamera dan rekaman dari dashboard layanan."],
                ["04", "Download klip bukti", "Bagian rekaman tertentu dapat diunduh saat dibutuhkan."]
              ].map(([number, title, body]) => (
                <article key={title}>
                  <span className="number">{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="package-section" id="paket">
          <div className="section-inner">
            <div className="section-heading compact">
              <p className="eyebrow">Paket layanan</p>
              <h2>Pilih retensi sesuai kebutuhan bukti.</h2>
            </div>
            <div className="pricing-grid">
              <article className="price-card">
                <p className="package-name">Basic</p>
                <h3>7 hari</h3>
                <p className="price">Rp45.000<span>/kamera/bulan</span></p>
                <ul>
                  <li>Cloud recording kamera prioritas</li>
                  <li>Live view</li>
                  <li>Playback rekaman</li>
                </ul>
                <a className="package-action" href="#kontak" onClick={() => handlePackageClick("Basic")}>Pilih Basic</a>
              </article>
              <article className="price-card featured">
                <span className="recommended-badge">Paling fleksibel</span>
                <p className="package-name">Standard</p>
                <h3>14 hari</h3>
                <p className="price">Rp65.000<span>/kamera/bulan</span></p>
                <ul>
                  <li>Semua fitur Basic</li>
                  <li>Download klip bukti</li>
                  <li>Cocok untuk toko dan gudang</li>
                </ul>
                <a className="package-action" href="#kontak" onClick={() => handlePackageClick("Standard")}>Pilih Standard</a>
              </article>
              <article className="price-card">
                <p className="package-name">Pro</p>
                <h3>30 hari</h3>
                <p className="price">Rp110.000<span>/kamera/bulan</span></p>
                <ul>
                  <li>Retensi rekaman lebih panjang</li>
                  <li>Prioritas support</li>
                  <li>Cocok untuk lokasi bisnis aktif</li>
                </ul>
                <a className="package-action" href="#kontak" onClick={() => handlePackageClick("Pro")}>Pilih Pro</a>
              </article>
            </div>
            <p className="pricing-note">
              Harga final mengikuti jumlah kamera, kualitas rekaman, upload
              internet, dan kebutuhan penyimpanan.
            </p>
            <div className="pricing-examples" aria-label="Contoh penggunaan paket">
              <div>
                <strong>Toko kecil</strong>
                <span>2 kamera prioritas mulai Rp90.000/bulan</span>
              </div>
              <div>
                <strong>Gudang kecil</strong>
                <span>4 kamera Standard mulai Rp260.000/bulan</span>
              </div>
              <div>
                <strong>Kantor aktif</strong>
                <span>8 kamera Standard mulai Rp520.000/bulan</span>
              </div>
            </div>
          </div>
        </section>

        <section className="estimator-section" id="estimasi">
          <div className="section-inner estimator-layout">
            <div className="section-heading left">
              <p className="eyebrow">Estimasi cepat</p>
              <h2>Hitung gambaran biaya sebelum survey.</h2>
              <p>
                Masukkan jumlah kamera yang ingin dibackup ke cloud. Angka ini
                hanya estimasi awal, hasil final tetap mengikuti survey lokasi.
              </p>
            </div>
            <div className="estimator-panel">
              <label>
                Jumlah kamera cloud
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={cameraCount}
                  onChange={(event) => setCameraCount(event.target.value.replace(/\D/g, ""))}
                />
              </label>
              <label>
                Paket
                <select
                  value={selectedPackage}
                  onChange={(event) => setSelectedPackage(event.target.value as CloudPackage)}
                >
                  <option value="Basic">Basic - 7 hari</option>
                  <option value="Standard">Standard - 14 hari</option>
                  <option value="Pro">Pro - 30 hari</option>
                </select>
              </label>
              <div className="estimate-result">
                <span>Estimasi bulanan</span>
                <strong>{formatRupiah(estimateValue)}</strong>
              </div>
              <a className="primary-button full" href={buildWaLink(estimateMessage)} target="_blank" rel="noreferrer">
                Minta Survey Dengan Estimasi Ini
              </a>
            </div>
          </div>
        </section>

        <section className="workflow-section" id="alur">
          <div className="section-inner two-column">
            <div className="section-heading left">
              <p className="eyebrow">Cara kerja</p>
              <h2>Alur sederhana dari survey sampai aktif.</h2>
              <p>
                Tim dapat memulai dari model hybrid: rekaman lokal tetap berjalan,
                cloud dipakai untuk kamera yang paling penting.
              </p>
            </div>
            <ol className="timeline">
              {[
                ["1", "Survey lokasi", "Cek kamera, NVR, jaringan, dan upload internet."],
                ["2", "Pilih kamera prioritas", "Kasir, pintu masuk, gudang, parkir, atau area rawan."],
                ["3", "Aktifkan cloud", "Hubungkan stream kamera ke platform cloud recording."],
                ["4", "Aktif dan lanjut bulanan", "Tunjukkan live view, playback, dan download klip bukti."]
              ].map(([number, title, body]) => (
                <li key={title}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="segment-section">
          <div className="section-inner">
            <div className="section-heading compact">
              <p className="eyebrow">Cocok untuk</p>
              <h2>Lokasi yang membutuhkan bukti rekaman saat ada kejadian.</h2>
            </div>
            <div className="segment-grid">
              {[
                ["Toko dan minimarket", "Backup kamera kasir, pintu masuk, dan area transaksi."],
                ["Gudang", "Simpan bukti aktivitas barang masuk, keluar, dan stok."],
                ["Kantor kecil", "Pantau area akses, lobby, ruang kerja, dan parkir."],
                ["Kos dan kontrakan", "Backup kamera area umum, gerbang, dan parkir."]
              ].map(([title, body]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="partner-section">
          <div className="section-inner">
            <div className="section-heading compact">
              <p className="eyebrow">Use case</p>
              <h2>Area kamera yang paling sering dijadikan prioritas cloud.</h2>
            </div>
            <div className="partner-grid" aria-label="Area prioritas">
              {["Kasir", "Pintu Masuk", "Gudang", "Parkir", "Lobby", "Area Stok"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="portfolio-section">
          <div className="section-inner">
            <div className="section-heading compact">
              <p className="eyebrow">Portofolio layanan</p>
              <h2>Contoh kebutuhan yang bisa ditangani Naltech CCTV Cloud.</h2>
            </div>
            <div className="portfolio-grid">
              <article>
                <div className="portfolio-visual cashier" />
                <div>
                  <h3>Toko dan kasir</h3>
                  <p>Backup kamera kasir, pintu masuk, dan area transaksi untuk bukti saat ada selisih atau kejadian.</p>
                </div>
              </article>
              <article>
                <div className="portfolio-visual warehouse" />
                <div>
                  <h3>Gudang dan stok barang</h3>
                  <p>Cloud recording untuk area barang masuk, barang keluar, rak stok, dan akses gudang.</p>
                </div>
              </article>
              <article>
                <div className="portfolio-visual residence" />
                <div>
                  <h3>Rumah, kos, dan kontrakan</h3>
                  <p>Backup kamera gerbang, parkir, lobby, dan area umum agar rekaman penting tetap tersedia.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="section-inner">
            <div className="section-heading compact">
              <p className="eyebrow">FAQ</p>
              <h2>Pertanyaan yang sering muncul.</h2>
            </div>
            <div className="faq-list">
              <details open>
                <summary>Apakah semua kamera harus masuk cloud?</summary>
                <p>Tidak. Bisa mulai dari kamera prioritas seperti kasir, pintu masuk, gudang, atau area rawan.</p>
              </details>
              <details>
                <summary>Apakah sistem lokal tetap dipakai?</summary>
                <p>Ya. Model yang disarankan adalah hybrid: rekaman lokal tetap berjalan, cloud menjadi backup tambahan.</p>
              </details>
              <details>
                <summary>Internet seperti apa yang dibutuhkan?</summary>
                <p>Yang paling penting adalah upload speed. Saat survey, kami cek apakah koneksi cukup untuk jumlah kamera yang dipilih.</p>
              </details>
              <details>
                <summary>Kenapa biayanya bulanan?</summary>
                <p>Karena rekaman disimpan terus di server/cloud dan membutuhkan storage, monitoring, serta support.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="contact-section" id="kontak">
          <div className="section-inner contact-layout">
            <div>
              <p className="eyebrow">Mulai dari survey</p>
              <h2>Amankan rekaman kamera penting sebelum kejadian berikutnya.</h2>
              <p>
                Kirim data lokasi dan jumlah kamera. Tim kami akan cek apakah
                sistem CCTV dan internet sudah siap untuk Cloud CCTV.
              </p>
              <div className="contact-points">
                <span>Cek upload internet</span>
                <span>Pilih kamera prioritas</span>
                <span>Rekomendasi paket</span>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleLeadSubmit}>
              <div className="form-header full">
                <strong>Form permintaan survey</strong>
                <span>Isi singkat, pesan WhatsApp akan dibuat otomatis.</span>
              </div>
              <label>
                Nama
                <input type="text" name="name" placeholder="Nama Anda" required />
              </label>
              <label>
                Nomor WhatsApp
                <input type="tel" name="phone" placeholder="08xxxxxxxxxx" required />
              </label>
              <label>
                Jenis lokasi
                <select name="segment" required defaultValue="">
                  <option value="">Pilih lokasi</option>
                  <option>Toko / Minimarket</option>
                  <option>Gudang</option>
                  <option>Kantor</option>
                  <option>Rumah</option>
                  <option>Kos / Kontrakan</option>
                </select>
              </label>
              <label>
                Jumlah kamera
                <input type="text" name="cameras" inputMode="numeric" pattern="[0-9]*" placeholder="Contoh: 4" required />
              </label>
              <label className="full">
                Catatan
                <textarea name="notes" rows={4} placeholder="Contoh: ingin backup kamera kasir dan gudang 14 hari" />
              </label>
              <button className="primary-button full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan lead..." : "Buat Pesan WhatsApp"}
              </button>
              <p className="form-note">{note}</p>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>Naltech CCTV Cloud</strong>
          <p>Layanan instalasi CCTV dan cloud recording untuk bisnis dan rumah.</p>
        </div>
        <div className="footer-contact">
          <span>Sleman, Yogyakarta</span>
          <a href="mailto:info@naltech.id">info@naltech.id</a>
          <a href="#home">Kembali ke atas</a>
        </div>
      </footer>
    </>
  );
}
