"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser, PERSONAS } from "@/lib/UserContext";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export function UserMenu() {
  const { currentUser, setCurrentUser } = useUser();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        title="User menu"
      >
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={32}
            height={32}
            className="w-7 h-7 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-edison-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span className="text-sm text-gray-300 font-medium">
          {session?.user?.name?.split?.(" ")?.[0] ?? "User"}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>

      {/* User menu dropdown */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* User header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-edison-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {session?.user?.name ?? "GitHub User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email ?? ""}
                </p>
              </div>
            </div>
          </div>

          {/* Role switcher */}
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
              Switch View Role
            </p>
            <div className="space-y-1">
              {PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => { setCurrentUser(persona); setShowMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    currentUser.id === persona.id
                      ? "bg-edison-50 text-edison-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${persona.color}`}>
                    {persona.initials}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium truncate">{persona.name}</p>
                    <p className="text-xs text-gray-400 truncate">{persona.role}</p>
                  </div>
                  {currentUser.id === persona.id && (
                    <svg className="w-4 h-4 text-edison-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <div className="px-3 py-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
