import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================
// DESIGN SANDBOX — Middleware disabled.
// All routes are accessible without authentication.
// ============================================================

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
