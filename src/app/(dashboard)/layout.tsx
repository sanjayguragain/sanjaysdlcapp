"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { UserProvider } from "@/lib/UserContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    // Hydrate from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      setSidebarCollapsed(saved === 'true');
    }

    // Listen for custom sidebar toggle events
    const handleSidebarToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isCollapsed: boolean }>;
      setSidebarCollapsed(customEvent.detail.isCollapsed);
    };
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle);
  }, []);

  return (
    <UserProvider>
      <TopBar />
      <div className="flex min-h-dvh h-dvh pt-16">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto flex flex-col transition-all duration-200 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
