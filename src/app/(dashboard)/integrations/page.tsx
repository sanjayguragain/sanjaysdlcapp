"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "connected" | "available" | "coming_soon";
  icon: React.ReactNode;
  fields?: { label: string; placeholder: string; type?: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Display pull requests, commits, and issue tracking context alongside SDLC artifacts.",
    category: "Source Control",
    status: "available",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    fields: [
      { label: "Repository URL", placeholder: "https://github.com/org/repo" },
      { label: "Personal Access Token", placeholder: "ghp_...", type: "password" },
    ],
  },
  {
    id: "azure",
    name: "Azure DevOps",
    description: "Show deployment status, pipeline runs, and environment health from Azure.",
    category: "Cloud & Deployment",
    status: "available",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-blue-600">
        <path d="M22.125 0H14.04L5.67 8.685.135 17.932 3.82 24H9.31l3.73-6.525 7.055 6.525H24V0h-1.875zM19.5 1.5v19.455l-5.73-5.31-3.975 6.96H4.59l-2.7-4.695 5.01-8.52L14.55 1.5H19.5z" />
      </svg>
    ),
    fields: [
      { label: "Organization URL", placeholder: "https://dev.azure.com/org" },
      { label: "Project Name", placeholder: "MyProject" },
      { label: "Personal Access Token", placeholder: "PAT token", type: "password" },
    ],
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description:
      "Send approval notifications and escalation alerts directly to Teams channels.",
    category: "Notifications",
    status: "available",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-edison-600">
        <path d="M20.625 0H14.04L5.67 8.685.135 17.932 3.82 24H9.31l3.73-6.525 7.055 6.525H24V0h-3.375zM14.625 15.75a3.375 3.375 0 110-6.75 3.375 3.375 0 010 6.75zm6-4.5h-.75v-2.625a2.625 2.625 0 10-5.25 0V11.25h-.75a.75.75 0 00-.75.75v3a.75.75 0 00.75.75h6.75a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75z" />
      </svg>
    ),
    fields: [
      { label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/..." },
    ],
  },
  {
    id: "bmc_cmdb",
    name: "BMC CMDB",
    description:
      "Map applications and configuration items for governance traceability across deployments.",
    category: "ITSM",
    status: "coming_soon",
    icon: (
      <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">B</div>
    ),
  },
  {
    id: "bmc_helix",
    name: "BMC Helix ITSM",
    description:
      "Auto-generate change requests for production deployments with full audit trail.",
    category: "ITSM",
    status: "coming_soon",
    icon: (
      <div className="w-6 h-6 rounded bg-orange-600 flex items-center justify-center text-white text-xs font-bold">H</div>
    ),
  },
  {
    id: "email",
    name: "Microsoft 365 Email",
    description:
      "Approval responses and SDLC status updates via Outlook email notifications.",
    category: "Notifications",
    status: "coming_soon",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-blue-500">
        <path d="M21.386 3H2.614C1.17 3 0 4.144 0 5.557v12.886C0 19.856 1.17 21 2.614 21h18.772C22.83 21 24 19.856 24 18.443V5.557C24 4.144 22.83 3 21.386 3zM12 13.5L2.25 7.5h19.5L12 13.5z" />
      </svg>
    ),
  },
];

const STATUS_CONFIG = {
  connected: { label: "Connected", className: "bg-emerald-100 text-emerald-700" },
  available: { label: "Available", className: "bg-blue-100 text-blue-700" },
  coming_soon: { label: "Coming Soon", className: "bg-gray-100 text-gray-500" },
};

export default function IntegrationsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function handleFieldChange(integrationId: string, label: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [integrationId]: {
        ...(prev[integrationId] ?? {}),
        [label]: value,
      },
    }));
  }

  function handleSave(integrationId: string, e: React.FormEvent) {
    e.preventDefault();
    // Stub — in production this would call an API to store encrypted credentials
    setSaved((prev) => ({ ...prev, [integrationId]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [integrationId]: false })), 2500);
    setExpanded(null);
  }

  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))];

  return (
    <div className="p-8">
      <Header
        title="Integrations"
        subtitle="Connect SDLC Hub with your enterprise toolchain"
      />

      <div className="mt-6 space-y-8">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {category}
            </h2>
            <div className="space-y-3">
              {INTEGRATIONS.filter((i) => i.category === category).map((integration) => {
                const isExpanded = expanded === integration.id;
                const isSaved = saved[integration.id];
                const cfg = STATUS_CONFIG[integration.status];

                return (
                  <div
                    key={integration.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 flex-shrink-0">
                        {integration.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {integration.name}
                          </h3>
                          <Badge className={cfg.className}>{cfg.label}</Badge>
                          {isSaved && (
                            <Badge className="bg-emerald-100 text-emerald-700">✓ Saved</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{integration.description}</p>
                      </div>
                      {integration.status !== "coming_soon" && (
                        <Button
                          variant={isExpanded ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setExpanded(isExpanded ? null : integration.id)}
                        >
                          {isExpanded ? "Cancel" : "Configure"}
                        </Button>
                      )}
                    </div>

                    {/* Config form */}
                    {isExpanded && integration.fields && (
                      <form
                        onSubmit={(e) => handleSave(integration.id, e)}
                        className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3"
                      >
                        {integration.fields.map((field) => (
                          <div key={field.label}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {field.label}
                            </label>
                            <input
                              type={field.type ?? "text"}
                              value={formValues[integration.id]?.[field.label] ?? ""}
                              onChange={(e) =>
                                handleFieldChange(integration.id, field.label, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edison-500 bg-white"
                            />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <Button type="submit" variant="primary" size="sm">
                            Save Connection
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
