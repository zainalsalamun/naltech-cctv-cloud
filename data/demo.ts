export const company = {
  name: "Naltech CCTV Cloud",
  phoneDisplay: "0815 7355 0017",
  phoneWa: "6281573550017",
  email: "info@naltech.id",
  serviceArea: "Yogyakarta, Sleman, Bantul, dan sekitarnya",
  tagline: "Backup CCTV Aman. Lokal tetap jalan, cloud jadi cadangan."
};

export const stats = [
  { label: "Pelanggan pilot", value: "12" },
  { label: "Kamera cloud", value: "68" },
  { label: "Kamera online", value: "61" },
  { label: "MRR simulasi", value: "Rp4,1 jt" }
];

export const leads = [
  {
    name: "Toko Sumber Rejeki",
    segment: "Toko",
    cameras: 4,
    package: "Standard",
    status: "Survey dijadwalkan",
    area: "Sleman"
  },
  {
    name: "Gudang Berkah Logistik",
    segment: "Gudang",
    cameras: 8,
    package: "Standard",
    status: "Pilot aktif",
    area: "Bantul"
  },
  {
    name: "Kost Nusa Indah",
    segment: "Kos",
    cameras: 3,
    package: "Basic",
    status: "Menunggu follow-up",
    area: "Yogyakarta"
  }
];

export const cameras = [
  { name: "Kasir 01", location: "Toko Sumber Rejeki", status: "Online", retention: "14 hari" },
  { name: "Pintu Masuk", location: "Toko Sumber Rejeki", status: "Online", retention: "14 hari" },
  { name: "Gudang A", location: "Berkah Logistik", status: "Online", retention: "14 hari" },
  { name: "Loading Dock", location: "Berkah Logistik", status: "Offline", retention: "14 hari" },
  { name: "Gerbang Kos", location: "Kost Nusa Indah", status: "Online", retention: "7 hari" }
];

export const packages = [
  { name: "Basic", retention: "7 hari", price: "Rp45.000", fit: "Rumah, toko kecil, kamera prioritas" },
  { name: "Standard", retention: "14 hari", price: "Rp65.000", fit: "Toko, gudang, kantor kecil" },
  { name: "Pro", retention: "30 hari", price: "Rp110.000", fit: "Lokasi bisnis aktif dan butuh bukti lebih lama" }
];
