"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  artifactId: string;
  projectId: string;
  projectName: string;
  artifactTitle: string;
  hoursElapsed: number;
  isOverdue: boolean;
}

export function NotificationBell() {
  const [notifCount, setNotifCount] = useState(0);
  const [notifOverdue, setNotifOverdue] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifCount(data.count ?? 0);
          setNotifOverdue(data.overdueCount ?? 0);
          setNotifications(data.notifications ?? []);
        }
      } catch {
        // ignore
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={notifRef}>
      <button
        onClick={() => setShowNotifs((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white"
        title="Approval notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifCount > 0 && (
          <span className={`absolute -top-0 -right-0 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${notifOverdue > 0 ? "bg-red-500" : "bg-amber-500"} ring-2 ring-gray-900`}>
            {notifCount > 9 ? "9+" : notifCount}
          </span>
        )}
      </button>

      {/* Notifications dropdown */}
      {showNotifs && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <span className="text-sm font-semibold text-gray-900">
              Pending Approvals
            </span>
            {notifOverdue > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
                {notifOverdue} overdue
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending approvals</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/projects/${n.projectId}/artifacts/${n.artifactId}`}
                  onClick={() => setShowNotifs(false)}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-indigo-50 transition-colors hover:border-l-4 hover:border-indigo-500 hover:pl-4"
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.isOverdue ? "bg-red-500" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {n.artifactTitle}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{n.projectName}</p>
                    <p className={`text-xs mt-2 font-medium ${n.isOverdue ? "text-red-600" : "text-amber-600"}`}>
                      {n.isOverdue
                        ? `⚠️ Overdue by ${n.hoursElapsed - 48}h`
                        : `⏱️ ${n.hoursElapsed}h elapsed · SLA: 48h`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
