import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth-token";

const adminPaths = ["/admin", "/customer", "/camera", "/billing", "/users"];
const adminApiPaths = ["/api/leads", "/api/customers", "/api/cameras", "/api/invoices", "/api/users"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifyAuthToken(token, process.env.AUTH_SECRET || "");
  const isApiRequest = pathname.startsWith("/api/");

  if (!session) {
    if (isApiRequest) {
      return NextResponse.json({ message: "Sesi login diperlukan." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesPath(pathname, adminPaths) || matchesPath(pathname, adminApiPaths)) {
    if (session.role !== "admin") {
      if (isApiRequest) {
        return NextResponse.json({ message: "Akses admin diperlukan." }, { status: 403 });
      }

      return NextResponse.redirect(
        new URL(`/customer-portal?customerId=${encodeURIComponent(session.customerId || "")}`, request.url)
      );
    }
  }

  if (pathname.startsWith("/customer-portal") && session.role === "customer" && !session.customerId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
    "/camera/:path*",
    "/billing/:path*",
    "/users/:path*",
    "/customer-portal/:path*",
    "/api/leads/:path*",
    "/api/customers/:path*",
    "/api/cameras/:path*",
    "/api/invoices/:path*",
    "/api/users/:path*"
  ]
};
