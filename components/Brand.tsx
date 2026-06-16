import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/">
      <img src="/naltech-cctv-cloud-logo.svg" alt="Naltech CCTV Cloud" />
    </Link>
  );
}
