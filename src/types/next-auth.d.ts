import NextAuth from "next-auth";
import { Session } from "next-auth";

// Extend the built-in session/user types to include our custom fields.
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** DB primary key from the User table */
      id?: string;
      /** Role stored in the User table (e.g. "Product Manager") */
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** DB primary key */
    dbId?: string;
    /** User role */
    role?: string;
    /** GitHub OAuth access token for server-side API calls */
    githubAccessToken?: string;
  }
}
