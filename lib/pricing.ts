import type { CloudPackage } from "@/types/operational";

export const packageRates: Record<CloudPackage, number> = {
  Basic: 45000,
  Standard: 65000,
  Pro: 110000
};

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

export function calculateMonthlyAmount(cameraCount: number, packageName: CloudPackage) {
  return cameraCount * packageRates[packageName];
}
