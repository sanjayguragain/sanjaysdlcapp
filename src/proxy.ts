import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

/**
 * Protect all routes except:
 * - /login           — the sign-in page itself
 * - /api/**          — API routes handle auth/authorization in handlers
 * - /_next/**        — Next.js build assets
 * - /favicon.ico
 * - /public/**       — Static files
 * 
 * NOTE: Middleware runs on every request but uses token verification which is fast.
 * Session callbacks are only called when explicitly requested by client code.
 */
export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};