"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserProvider } from "@/lib/UserContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto ml-64 flex flex-col">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
