import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Runs on every matched request (see config below) purely to keep the
// Supabase session cookie fresh. No auth/role decisions happen here —
// see lib/auth/authorize.ts for that, used inside individual pages/layouts.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - image files (svg, png, jpg, jpeg, gif, webp)
     * Keeps the middleware from doing unnecessary work on static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
