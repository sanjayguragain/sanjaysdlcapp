"use client";

import React from "react";
import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-[#101820] border-b border-gray-700 flex items-center justify-between px-8 z-50 shadow-lg">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 flex-shrink-0 group hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-gradient-to-br from-edison-500 to-edison-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <circle cx="4" cy="6" r="2" />
            <circle cx="20" cy="6" r="2" />
            <circle cx="4" cy="18" r="2" />
            <circle cx="20" cy="18" r="2" />
            <line x1="9.5" y1="10.5" x2="5.5" y2="7.5" />
            <line x1="14.5" y1="10.5" x2="18.5" y2="7.5" />
            <line x1="9.5" y1="13.5" x2="5.5" y2="16.5" />
            <line x1="14.5" y1="13.5" x2="18.5" y2="16.5" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-base leading-none">SDLC Hub</span>
          <span className="text-edison-400 text-xs font-medium leading-none">AI Powered</span>
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
