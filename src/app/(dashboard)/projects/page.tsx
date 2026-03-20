"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { NewProjectDropdown } from "@/components/projects/NewProjectDropdown";

interface Project {
  id: string;
  name: string;
  description: string | null;
  sdlcMode?: "modern" | "traditional" | null;
  status: string;
  phase: string;
  createdAt: string;
  _count: { artifacts: number };
  awaitingApproval?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      p.phase.toLowerCase().includes(q) ||
      (p.sdlcMode ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <Header
        title="Projects"
        subtitle="Manage your SDLC documentation projects"
        actions={<NewProjectDropdown />}
      />

      {/* Search */}
      <div className="mt-4 relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name, description, or phase…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-edison-500/40 focus:border-edison-500 transition-colors"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-48"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search.trim() ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">No matching projects</h3>
              <p className="text-sm text-gray-500">
                No projects match &ldquo;{search}&rdquo;. Try a different search term.
              </p>
            </div>
          ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first project to start generating SDLC documentation.
            </p>
            <div className="flex justify-center">
              <NewProjectDropdown label="Create First Project" />
            </div>
          </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <ProjectCard
                  name={project.name}
                  description={project.description || ""}
                  phase={project.phase}
                  artifactCount={project._count?.artifacts || 0}
                  sdlcMode={project.sdlcMode}
                  createdAt={project.createdAt}
                  awaitingApproval={project.awaitingApproval}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
