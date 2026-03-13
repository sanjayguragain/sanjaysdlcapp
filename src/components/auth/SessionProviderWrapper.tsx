"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Thin client-side wrapper so we can import SessionProvider in the
 * server-side root layout without making the whole layout a client component.
 */
export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
