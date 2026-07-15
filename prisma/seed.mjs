import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync } from "node:crypto";

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const packageMap = {
  Basic: "Basic",
  Standard: "Standard",
  Pro: "Pro"
};

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const adminPasswordHash = hashPassword(process.env.ADMIN_SEED_PASSWORD || "NaltechAdmin123!");
  const admin = await prisma.user.upsert({
    where: { email: "admin@naltech.id" },
    update: {
      name: "Admin Naltech",
      passwordHash: adminPasswordHash,
      role: "admin"
    },
    create: {
      id: "seed-user-admin",
      name: "Admin Naltech",
      email: "admin@naltech.id",
      passwordHash: adminPasswordHash,
      role: "admin"
    }
  });

  const tokoLead = await prisma.lead.upsert({
    where: { id: "seed-lead-toko-sumber-rejeki" },
    update: {
      name: "Toko Sumber Rejeki",
      phone: "081573550017",
      segment: "Toko",
      camerasCount: 4,
      packageName: packageMap.Standard,
      status: "SurveyDijadwalkan",
      area: "Sleman",
      notes: "Survey kamera kasir dan pintu masuk.",
      assignedToId: admin.id
    },
    create: {
      id: "seed-lead-toko-sumber-rejeki",
      name: "Toko Sumber Rejeki",
      phone: "081573550017",
      segment: "Toko",
      camerasCount: 4,
      packageName: packageMap.Standard,
      status: "SurveyDijadwalkan",
      area: "Sleman",
      notes: "Survey kamera kasir dan pintu masuk.",
      assignedToId: admin.id
    }
  });

  const gudangLead = await prisma.lead.upsert({
    where: { id: "seed-lead-gudang-berkah-logistik" },
    update: {
      name: "Gudang Berkah Logistik",
      phone: "081573550017",
      segment: "Gudang",
      camerasCount: 8,
      packageName: packageMap.Standard,
      status: "PilotAktif",
      area: "Bantul",
      notes: "Cloud recording untuk area gudang dan loading dock.",
      assignedToId: admin.id
    },
    create: {
      id: "seed-lead-gudang-berkah-logistik",
      name: "Gudang Berkah Logistik",
      phone: "081573550017",
      segment: "Gudang",
      camerasCount: 8,
      packageName: packageMap.Standard,
      status: "PilotAktif",
      area: "Bantul",
      notes: "Cloud recording untuk area gudang dan loading dock.",
      assignedToId: admin.id
    }
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-kost-nusa-indah" },
    update: {
      name: "Kost Nusa Indah",
      phone: "081573550017",
      segment: "Kos",
      camerasCount: 3,
      packageName: packageMap.Basic,
      status: "MenungguFollowUp",
      area: "Yogyakarta",
      notes: "Follow-up kebutuhan kamera gerbang kos.",
      assignedToId: admin.id
    },
    create: {
      id: "seed-lead-kost-nusa-indah",
      name: "Kost Nusa Indah",
      phone: "081573550017",
      segment: "Kos",
      camerasCount: 3,
      packageName: packageMap.Basic,
      status: "MenungguFollowUp",
      area: "Yogyakarta",
      notes: "Follow-up kebutuhan kamera gerbang kos.",
      assignedToId: admin.id
    }
  });

  const customer = await prisma.customer.upsert({
    where: { leadId: gudangLead.id },
    update: {
      name: gudangLead.name,
      phone: gudangLead.phone,
      segment: gudangLead.segment,
      packageName: gudangLead.packageName,
      status: "active",
      area: gudangLead.area,
      managedById: admin.id,
      activatedAt: new Date("2026-05-20T00:00:00.000Z")
    },
    create: {
      id: "seed-customer-gudang-berkah-logistik",
      leadId: gudangLead.id,
      name: gudangLead.name,
      phone: gudangLead.phone,
      segment: gudangLead.segment,
      packageName: gudangLead.packageName,
      status: "active",
      area: gudangLead.area,
      managedById: admin.id,
      activatedAt: new Date("2026-05-20T00:00:00.000Z")
    }
  });

  const customerPasswordHash = hashPassword(process.env.CUSTOMER_SEED_PASSWORD || "NaltechCustomer123!");
  await prisma.user.upsert({
    where: { email: "customer@naltech.id" },
    update: {
      name: customer.name,
      passwordHash: customerPasswordHash,
      role: "customer",
      customerId: customer.id
    },
    create: {
      id: "seed-user-customer-gudang-berkah-logistik",
      name: customer.name,
      email: "customer@naltech.id",
      passwordHash: customerPasswordHash,
      role: "customer",
      customerId: customer.id
    }
  });

  await Promise.all([
    prisma.camera.upsert({
      where: { id: "seed-camera-gudang-a" },
      update: {
        customerId: customer.id,
        name: "Gudang A",
        location: "Berkah Logistik",
        status: "online",
        retentionDays: 14,
        cloudRecordingEnabled: true,
        lastOnlineAt: new Date()
      },
      create: {
        id: "seed-camera-gudang-a",
        customerId: customer.id,
        name: "Gudang A",
        location: "Berkah Logistik",
        status: "online",
        retentionDays: 14,
        cloudRecordingEnabled: true,
        lastOnlineAt: new Date()
      }
    }),
    prisma.camera.upsert({
      where: { id: "seed-camera-loading-dock" },
      update: {
        customerId: customer.id,
        name: "Loading Dock",
        location: "Berkah Logistik",
        status: "offline",
        retentionDays: 14,
        cloudRecordingEnabled: true
      },
      create: {
        id: "seed-camera-loading-dock",
        customerId: customer.id,
        name: "Loading Dock",
        location: "Berkah Logistik",
        status: "offline",
        retentionDays: 14,
        cloudRecordingEnabled: true
      }
    })
  ]);

  const invoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2026-05-001" },
    update: {
      customerId: customer.id,
      status: "paid",
      subtotal: 520000,
      total: 520000,
      issuedDate: new Date("2026-05-01T00:00:00.000Z"),
      dueDate: new Date("2026-05-20T00:00:00.000Z"),
      paidAt: new Date("2026-05-18T00:00:00.000Z")
    },
    create: {
      id: "seed-invoice-2026-05-001",
      customerId: customer.id,
      invoiceNumber: "INV-2026-05-001",
      status: "paid",
      subtotal: 520000,
      total: 520000,
      issuedDate: new Date("2026-05-01T00:00:00.000Z"),
      dueDate: new Date("2026-05-20T00:00:00.000Z"),
      paidAt: new Date("2026-05-18T00:00:00.000Z")
    }
  });

  await prisma.invoiceItem.upsert({
    where: { id: "seed-invoice-item-cloud-recording-standard" },
    update: {
      invoiceId: invoice.id,
      description: "Cloud recording Standard 8 kamera",
      quantity: 8,
      unitPrice: 65000,
      total: 520000
    },
    create: {
      id: "seed-invoice-item-cloud-recording-standard",
      invoiceId: invoice.id,
      description: "Cloud recording Standard 8 kamera",
      quantity: 8,
      unitPrice: 65000,
      total: 520000
    }
  });

  await prisma.payment.upsert({
    where: { id: "seed-payment-invoice-2026-05-001" },
    update: {
      invoiceId: invoice.id,
      amount: 520000,
      method: "bank_transfer",
      reference: "SEED-TRX-20260518",
      notes: "Pembayaran contoh untuk invoice awal.",
      paidAt: new Date("2026-05-18T00:00:00.000Z")
    },
    create: {
      id: "seed-payment-invoice-2026-05-001",
      invoiceId: invoice.id,
      amount: 520000,
      method: "bank_transfer",
      reference: "SEED-TRX-20260518",
      notes: "Pembayaran contoh untuk invoice awal.",
      paidAt: new Date("2026-05-18T00:00:00.000Z")
    }
  });

  console.log(`Seed complete. Admin: ${admin.email}. Customer: customer@naltech.id. Lead sample: ${tokoLead.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
