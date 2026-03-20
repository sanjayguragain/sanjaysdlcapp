import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const enableDevLogin =
  process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_LOGIN === "true";

const providers: NextAuthOptions["providers"] = [];

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    })
  );
}

if (enableDevLogin) {
  providers.push(
    CredentialsProvider({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email =
          credentials?.email?.trim() ||
          process.env.DEV_LOGIN_EMAIL ||
          "developer@local.dev";
        const name =
          credentials?.name?.trim() ||
          process.env.DEV_LOGIN_NAME ||
          "Local Developer";

        return {
          id: email,
          email,
          name,
          image: null,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,

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
    async jwt({ token, user, account }) {
      if (account?.access_token) {
        token.githubAccessToken = account.access_token;
      }

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
