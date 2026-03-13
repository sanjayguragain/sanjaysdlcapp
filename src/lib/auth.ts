import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    /**
     * On sign-in: upsert the user into our DB so they have a stable DB record.
     * Returns false to reject the sign-in if no email is available.
     */
    async signIn({ user }) {
      if (!user.email) return false;

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? user.email.split("@")[0],
          avatarUrl: user.image ?? null,
        },
        create: {
          name: user.name ?? user.email.split("@")[0],
          email: user.email,
          role: "Product Manager",
          avatarUrl: user.image ?? null,
        },
      });

      return true;
    },

    /**
     * Enrich the JWT with the DB user's id and role on first login.
     * The DB round-trip is only done once (when `user` is populated, i.e. sign-in).
     */
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.dbId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },

    /**
     * Expose the DB id and role on the client-side session object.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.dbId as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};
