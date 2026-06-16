import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function LoginPage() {
  return (
    <main className="loginPage">
      <section className="loginCard">
        <Brand />
        <div>
          <p className="eyebrow">Akses platform</p>
          <h1>Masuk ke dashboard Naltech</h1>
          <p>Pilih area kerja sesuai kebutuhan operasional.</p>
        </div>
        <div className="loginActions">
          <Link className="button buttonPrimary" href="/admin">
            Masuk sebagai Admin
          </Link>
          <Link className="button buttonGhost" href="/customer-portal">
            Masuk sebagai Pelanggan
          </Link>
        </div>
      </section>
    </main>
  );
}
