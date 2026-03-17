"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Listen for storage events (sidebar toggle from different instances)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebar-collapsed') {
        setIsCollapsed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events from Sidebar
  useEffect(() => {
    const handleSidebarToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isCollapsed: boolean }>;
      setIsCollapsed(customEvent.detail.isCollapsed);
    };
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarCollapsed() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    return { isCollapsed: false };
  }
  return context;
}
