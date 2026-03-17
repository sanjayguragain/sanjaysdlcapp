"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface NewProjectDropdownProps {
  label?: string;
  className?: string;
}

export function NewProjectDropdown({ label = "New Project", className = "" }: NewProjectDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="primary"
        size="md"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {label}
        <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <Link
            href="/projects/new?sdlcMode=modern"
            className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
            onClick={() => setOpen(false)}
          >
            <p className="text-sm font-semibold text-gray-900">Modern SDLC Project</p>
            <p className="text-xs text-gray-500 mt-0.5">PRD-first path with consolidated requirements/design.</p>
          </Link>
          <Link
            href="/projects/new?sdlcMode=traditional"
            className="block px-4 py-3 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <p className="text-sm font-semibold text-gray-900">Traditional SDLC Project</p>
            <p className="text-xs text-gray-500 mt-0.5">Document-by-document path: BRD, AVD, SRS, SAD, SES.</p>
          </Link>
        </div>
      )}
    </div>
  );
}
