import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function LoginPage() {
  return (
    <main className="loginPage">
      <section className="loginCard">
        <Brand />
        <div>
          <p className="eyebrow">Demo mode</p>
          <h1>Masuk ke dashboard Naltech</h1>
          <p>Pilih role untuk melihat alur demo investor.</p>
        </div>
        <div className="loginActions">
          <Link className="button buttonPrimary" href="/admin">
            Masuk sebagai Admin
          </Link>
          <Link className="button buttonGhost" href="/customer">
            Masuk sebagai Pelanggan
          </Link>
        </div>
      </section>
    </main>
  );
}
