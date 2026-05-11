import Link from "next/link";
import { Brand } from "./Brand";
import { company } from "@/data/demo";

export function PublicHeader() {
  return (
    <>
      <div className="topbar">
        <span>{company.email}</span>
        <span>{company.phoneDisplay}</span>
        <span>{company.serviceArea}</span>
      </div>
      <header className="header">
        <Brand />
        <nav>
          <Link href="#services">Services</Link>
          <Link href="#packages">Paket</Link>
          <Link href="#why">Kenapa Naltech</Link>
          <Link href="/login">Login Demo</Link>
        </nav>
        <Link className="button buttonPrimary" href={`https://wa.me/${company.phoneWa}`}>
          Minta Survey
        </Link>
      </header>
    </>
  );
}
