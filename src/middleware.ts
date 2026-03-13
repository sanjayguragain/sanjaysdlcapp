import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

/**
 * Protect all routes except:
 * - /login           — the sign-in page itself
 * - /api/auth/**     — NextAuth internal API routes
 * - /_next/**        — Next.js build assets
 * - /favicon.ico
 */
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
