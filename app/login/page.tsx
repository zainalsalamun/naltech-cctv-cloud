import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { LoginForm } from "./LoginForm";
import { getSession } from "@/lib/server/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(session.role === "customer"
      ? `/customer-portal?customerId=${encodeURIComponent(session.customerId || "")}`
      : "/admin");
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <Brand />
        <div>
          <p className="eyebrow">Akses platform</p>
          <h1>Masuk ke dashboard Naltech</h1>
          <p>Gunakan akun admin atau customer yang sudah terdaftar.</p>
        </div>
        <LoginForm />
        <div className="loginCredentials">
          <div>
            <strong>Admin lokal</strong>
            <span>admin@naltech.id</span>
          </div>
          <div>
            <strong>Customer lokal</strong>
            <span>customer@naltech.id</span>
          </div>
        </div>
      </section>
    </main>
  );
}
