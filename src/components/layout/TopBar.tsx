"use client";

import React from "react";
import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex items-center justify-between px-8 z-50 shadow-lg">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 flex-shrink-0 group hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-base leading-none">SDLC</span>
          <span className="text-indigo-400 text-xs font-medium leading-none">Platform</span>
        </div>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side icons */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}
