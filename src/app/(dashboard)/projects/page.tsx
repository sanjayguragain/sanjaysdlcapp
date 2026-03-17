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

  return (
    <div className="p-8">
      <Header
        title="Projects"
        subtitle="Manage your SDLC documentation projects"
        actions={<NewProjectDropdown />}
      />

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
        ) : projects.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
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
