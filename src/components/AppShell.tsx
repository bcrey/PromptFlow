"use client";

import { useState, useRef } from "react";
import { usePromptStore } from "@/hooks/use-prompt-store";
import { useAuth } from "@/components/AuthProvider";
import PromptList from "./PromptList";

export default function AppShell() {
  const { user, signOut } = useAuth();
  const {
    state,
    loading,
    activeProject,
    addProject,
    removeProject,
    renameProject,
    setActiveProject,
    addPrompt,
    setAddToTop,
    editPrompt,
    togglePromptDone,
    reorderPrompts,
    clearDone,
    exportState,
    importState,
  } = usePromptStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    addProject(name);
    setNewProjectName("");
    setShowNewProject(false);
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) removeProject(id);
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) renameProject(editingId, editName.trim());
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="text-[var(--color-text-tertiary)] text-[14px]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col h-full select-none">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            PromptFlow
          </h1>
        </div>

        {/* New project button */}
        <div className="px-3 pb-1">
          <button
            className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors ${
              showNewProject
                ? "bg-[var(--color-accent-light)] text-[var(--color-accent-text)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            }`}
            onClick={() => setShowNewProject(!showNewProject)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        </div>

        {/* New project input */}
        {showNewProject && (
          <div className="px-3 pb-2 animate-slide-down">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                className="flex-1 min-w-0 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-[7px] text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProject();
                  if (e.key === "Escape") { setShowNewProject(false); setNewProjectName(""); }
                }}
              />
              <button
                className={`px-2.5 py-[7px] text-[12px] font-medium rounded-lg transition-all shrink-0 ${
                  newProjectName.trim()
                    ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                    : "bg-[var(--color-surface-active)] text-[var(--color-text-tertiary)] cursor-default"
                }`}
                onClick={handleCreateProject}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Section label */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
            Projects
          </span>
        </div>

        {/* Project list */}
        <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-px">
          {state.projects.length === 0 && (
            <p className="px-3 py-6 text-[12px] text-[var(--color-text-tertiary)] text-center">
              No projects yet
            </p>
          )}
          {state.projects.map((project) => {
            const isActive = project.id === state.activeProjectId;
            return (
              <div
                key={project.id}
                className={`group flex items-center rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent-light)] text-[var(--color-accent-text)] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {editingId === project.id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-[var(--color-surface)] text-[var(--color-text-primary)] text-[13px] px-3 py-[7px] rounded-lg outline-none ring-2 ring-[var(--color-accent)]/40"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <>
                    <button
                      className="flex-1 text-left px-3 py-[7px] truncate"
                      onClick={() => setActiveProject(project.id)}
                      onDoubleClick={() => startRename(project.id, project.name)}
                    >
                      {project.name}
                    </button>
                    <button
                      className="p-1 mr-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-[var(--color-danger-light)]"
                      onClick={() => handleRemove(project.id, project.name)}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--color-border-subtle)]">
          <div className="flex gap-1">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-[6px] text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              onClick={exportState}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-[6px] text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importState(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="my-1.5 border-t border-[var(--color-border-subtle)]" />
          {user ? (
            <div className="mt-1.5 flex items-center gap-1.5 px-2">
              <span className="flex-1 text-[11px] text-[var(--color-text-tertiary)] truncate">
                {user.email}
              </span>
              <button
                className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-colors shrink-0"
                onClick={signOut}
              >
                Sign out
              </button>
            </div>
          ) : (
            <a
              href="/auth"
              className="mt-1.5 flex items-center justify-center gap-1.5 px-2 py-[6px] text-[11px] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-light)] rounded-lg transition-colors"
            >
              Sign in to save your work
            </a>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {activeProject ? (
          <PromptList
            project={activeProject}
            addToTop={state.addToTop ?? false}
            onSetAddToTop={setAddToTop}
            onAdd={addPrompt}
            onEdit={editPrompt}
            onToggleDone={togglePromptDone}
            onReorder={reorderPrompts}
            onClearDone={clearDone}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[var(--color-text-secondary)] text-[14px] font-medium">
                {state.projects.length === 0
                  ? "Get started by creating a project"
                  : "Select a project from the sidebar"}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-[13px] mt-1">
                Organize your prompts across different projects
              </p>
            </div>
            {state.projects.length === 0 && (
              <button
                className="mt-1 px-5 py-2.5 text-[13px] font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors"
                onClick={() => setShowNewProject(true)}
              >
                Create project
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
