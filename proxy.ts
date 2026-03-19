/**
 * Next.js Proxy for OJT Connect PH.
 *
 * Route protection rules:
 *   /student/*          → requires roleName === 'student'
 *   /company/*          → requires roleName === 'company'
 *   /university-admin/* → requires roleName === 'university_admin'
 *   /admin/*            → requires roleName === 'super_admin'
 *   /login, /register   → redirect to dashboard if already authenticated
 *   /claim/*            → public (no auth required)
 *   Everything else     → public
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { ProfileType } from "@/types";

// ---------------------------------------------------------------------------
// Route → required role mapping
// ---------------------------------------------------------------------------
const PROTECTED_ROUTES: Array<{ prefix: string; requiredRole: string }> = [
  { prefix: "/student",           requiredRole: "student" },
  { prefix: "/company",           requiredRole: "company" },
  { prefix: "/university-admin",  requiredRole: "university_admin" },
  { prefix: "/admin",             requiredRole: "super_admin" },
];

// Always-public prefixes — skip all auth checks
const PUBLIC_PREFIXES: string[] = [
  "/claim",
  "/api/auth", // NextAuth internal endpoints
  "/_next",
  "/favicon.ico",
  "/public",
];

// Auth pages — redirect to dashboard if already signed in
const AUTH_PAGES: string[] = ["/login", "/register"];

// ---------------------------------------------------------------------------
// Dashboard URL per role
// ---------------------------------------------------------------------------
function getDashboardUrl(profileType: ProfileType | string): string {
  switch (profileType) {
    case "student":
      return "/student/dashboard";
    case "company":
      return "/company/dashboard";
    case "university_admin":
      return "/university-admin/dashboard";
    case "super_admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

// ---------------------------------------------------------------------------
// Proxy handler
// ---------------------------------------------------------------------------
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip purely public prefixes immediately
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Read JWT token from cookie (edge-runtime safe)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = Boolean(token);
  const roleName = (token?.roleName as string) ?? "";
  const profileType = ((token?.profileType as string) ?? roleName) as ProfileType;

  // 3. Redirect authenticated users away from auth pages
  if (AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(page + "/"))) {
    if (isAuthenticated) {
      const dashboardUrl = getDashboardUrl(profileType);
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }
    return NextResponse.next();
  }

  // 4. Check protected routes
  const matchedRoute = PROTECTED_ROUTES.find(({ prefix }) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (matchedRoute) {
    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Wrong role → redirect to their own dashboard
    if (roleName !== matchedRoute.requiredRole) {
      const correctDashboard = getDashboardUrl(profileType);
      return NextResponse.redirect(new URL(correctDashboard, req.url));
    }
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Route matcher — tell Next.js which paths this middleware should run on.
// Excludes static assets and Next.js internals for performance.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - Files with common static extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf|map)).*)",
  ],
};
