import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./use-local-storage";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { Project, Prompt, AppState } from "@/types/prompt";
import type { DbProjectWithPrompts } from "@/types/database";

interface LocalPrefs {
  activeProjectId: string | null;
  addToTop: boolean;
}

function mapDbToProject(dbProject: DbProjectWithPrompts): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    prompts: (dbProject.prompts ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        id: p.id,
        text: p.text,
        done: p.done,
        createdAt: new Date(p.created_at).getTime(),
      })),
  };
}

function readLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem("prompt-manager");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.projects ?? [];
  } catch {
    return [];
  }
}

function writeLocalProjects(projects: Project[]) {
  try {
    localStorage.setItem(
      "prompt-manager",
      JSON.stringify({ projects })
    );
  } catch {
    // storage full or unavailable
  }
}

export function usePromptStore() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useLocalStorage<LocalPrefs>("prompt-manager-prefs", {
    activeProjectId: null,
    addToTop: false,
  });

  const supabase = createClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const activeProject =
    projects.find((p) => p.id === prefs.activeProjectId) ?? null;

  // --- Load data when auth state resolves or changes ---

  const loadCloud = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Check if user has cloud data
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true });

    // Migrate localStorage data on first login
    if (count === 0) {
      const localProjects = readLocalProjects();
      if (localProjects.length > 0) {
        for (const project of localProjects) {
          const { data: newProject } = await supabase
            .from("projects")
            .insert({ name: project.name, user_id: user.id })
            .select()
            .single();

          if (!newProject) continue;

          if (project.prompts.length > 0) {
            await supabase.from("prompts").insert(
              project.prompts.map((p, i) => ({
                project_id: newProject.id,
                user_id: user.id,
                text: p.text,
                done: p.done,
                sort_order: i,
              }))
            );
          }
        }
      }
    }

    // Load all projects with prompts
    const { data, error } = await supabase
      .from("projects")
      .select("*, prompts(*)")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load projects:", error);
    } else if (data) {
      setProjects((data as DbProjectWithPrompts[]).map(mapDbToProject));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id ?? null;
    if (currentUserId === prevUserIdRef.current) return;
    prevUserIdRef.current = currentUserId;

    if (user) {
      loadCloud();
    } else {
      // Migrate prefs from old format on first load
      const existingPrefs = localStorage.getItem("prompt-manager-prefs");
      if (!existingPrefs) {
        try {
          const raw = localStorage.getItem("prompt-manager");
          if (raw) {
            const old = JSON.parse(raw) as AppState;
            if (old.activeProjectId || old.addToTop) {
              setPrefs({
                activeProjectId: old.activeProjectId ?? null,
                addToTop: old.addToTop ?? false,
              });
            }
          }
        } catch {
          // ignore
        }
      }
      setProjects(readLocalProjects());
      setLoading(false);
    }
  }, [user?.id, authLoading, loadCloud, setPrefs]);

  // --- Mutations ---

  async function addProject(name: string) {
    if (user) {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name, user_id: user.id })
        .select()
        .single();
      if (error || !data) {
        console.error("Failed to create project:", error);
        return;
      }
      const project: Project = { id: data.id, name: data.name, prompts: [] };
      setProjects((prev) => [...prev, project]);
      setPrefs((prev) => ({ ...prev, activeProjectId: data.id }));
    } else {
      const project: Project = { id: crypto.randomUUID(), name, prompts: [] };
      setProjects((prev) => {
        const updated = [...prev, project];
        writeLocalProjects(updated);
        return updated;
      });
      setPrefs((prev) => ({ ...prev, activeProjectId: project.id }));
    }
  }

  async function removeProject(id: string) {
    if (user) {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete project:", error);
        return;
      }
    }

    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (!user) writeLocalProjects(updated);
      if (prefs.activeProjectId === id) {
        setPrefs((prev) => ({
          ...prev,
          activeProjectId: updated[0]?.id ?? null,
        }));
      }
      return updated;
    });
  }

  async function renameProject(id: string, name: string) {
    if (user) {
      const { error } = await supabase
        .from("projects")
        .update({ name })
        .eq("id", id);
      if (error) {
        console.error("Failed to rename project:", error);
        return;
      }
    }

    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name } : p));
      if (!user) writeLocalProjects(updated);
      return updated;
    });
  }

  function setActiveProject(id: string) {
    setPrefs((prev) => ({ ...prev, activeProjectId: id }));
  }

  async function addPrompt(text: string) {
    const projectId = prefs.activeProjectId;
    if (!projectId) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    if (user) {
      const existingPrompts = project.prompts;
      const sortOrder = prefs.addToTop
        ? (existingPrompts.length > 0 ? -1 : 0)
        : existingPrompts.length;

      const { data, error } = await supabase
        .from("prompts")
        .insert({
          project_id: projectId,
          user_id: user.id,
          text,
          done: false,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Failed to add prompt:", error);
        return;
      }

      const prompt: Prompt = {
        id: data.id,
        text: data.text,
        done: data.done,
        createdAt: new Date(data.created_at).getTime(),
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                prompts: prefs.addToTop
                  ? [prompt, ...p.prompts]
                  : [...p.prompts, prompt],
              }
            : p
        )
      );
    } else {
      const prompt: Prompt = {
        id: crypto.randomUUID(),
        text,
        done: false,
        createdAt: Date.now(),
      };

      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                prompts: prefs.addToTop
                  ? [prompt, ...p.prompts]
                  : [...p.prompts, prompt],
              }
            : p
        );
        writeLocalProjects(updated);
        return updated;
      });
    }
  }

  function setAddToTop(value: boolean) {
    setPrefs((prev) => ({ ...prev, addToTop: value }));
  }

  async function togglePromptDone(promptId: string) {
    const project = projects.find((p) => p.id === prefs.activeProjectId);
    const prompt = project?.prompts.find((pr) => pr.id === promptId);
    if (!prompt) return;

    const newDone = !prompt.done;

    if (user) {
      const { error } = await supabase
        .from("prompts")
        .update({ done: newDone })
        .eq("id", promptId);
      if (error) {
        console.error("Failed to toggle prompt:", error);
        return;
      }
    }

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === prefs.activeProjectId
          ? {
              ...p,
              prompts: p.prompts.map((pr) =>
                pr.id === promptId ? { ...pr, done: newDone } : pr
              ),
            }
          : p
      );
      if (!user) writeLocalProjects(updated);
      return updated;
    });
  }

  async function reorderPrompts(activeId: string, overId: string) {
    const project = projects.find((p) => p.id === prefs.activeProjectId);
    if (!project) return;

    const prompts = [...project.prompts];
    const oldIndex = prompts.findIndex((pr) => pr.id === activeId);
    const newIndex = prompts.findIndex((pr) => pr.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const [moved] = prompts.splice(oldIndex, 1);
    prompts.splice(newIndex, 0, moved);

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === prefs.activeProjectId ? { ...p, prompts } : p
      );
      if (!user) writeLocalProjects(updated);
      return updated;
    });

    if (user) {
      for (let i = 0; i < prompts.length; i++) {
        await supabase
          .from("prompts")
          .update({ sort_order: i })
          .eq("id", prompts[i].id);
      }
    }
  }

  async function editPrompt(promptId: string, text: string) {
    if (user) {
      const { error } = await supabase
        .from("prompts")
        .update({ text })
        .eq("id", promptId);
      if (error) {
        console.error("Failed to edit prompt:", error);
        return;
      }
    }

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === prefs.activeProjectId
          ? {
              ...p,
              prompts: p.prompts.map((pr) =>
                pr.id === promptId ? { ...pr, text } : pr
              ),
            }
          : p
      );
      if (!user) writeLocalProjects(updated);
      return updated;
    });
  }

  async function clearDone() {
    const project = projects.find((p) => p.id === prefs.activeProjectId);
    if (!project) return;

    const doneIds = project.prompts.filter((pr) => pr.done).map((pr) => pr.id);
    if (doneIds.length === 0) return;

    if (user) {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .in("id", doneIds);
      if (error) {
        console.error("Failed to clear done prompts:", error);
        return;
      }
    }

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === prefs.activeProjectId
          ? { ...p, prompts: p.prompts.filter((pr) => !pr.done) }
          : p
      );
      if (!user) writeLocalProjects(updated);
      return updated;
    });
  }

  function exportState() {
    const json = JSON.stringify({ projects }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-manager-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importState(file: File) {
    const text = await file.text();
    let parsed: { projects: Project[] };

    try {
      parsed = JSON.parse(text);
      if (!parsed.projects || !Array.isArray(parsed.projects)) {
        alert("Invalid file format: missing projects array.");
        return;
      }
    } catch {
      alert("Failed to parse JSON file.");
      return;
    }

    if (!window.confirm("This will overwrite all existing data. Continue?"))
      return;

    if (user) {
      // Clear cloud data and re-import
      await supabase.from("projects").delete().eq("user_id", user.id);

      for (const project of parsed.projects) {
        const { data: newProject } = await supabase
          .from("projects")
          .insert({ name: project.name, user_id: user.id })
          .select()
          .single();

        if (!newProject) continue;

        if (project.prompts.length > 0) {
          await supabase.from("prompts").insert(
            project.prompts.map((p, i) => ({
              project_id: newProject.id,
              user_id: user.id,
              text: p.text,
              done: p.done,
              sort_order: i,
            }))
          );
        }
      }

      await loadCloud();
    } else {
      setProjects(parsed.projects);
      writeLocalProjects(parsed.projects);
    }
  }

  return {
    state: {
      projects,
      activeProjectId: prefs.activeProjectId,
      addToTop: prefs.addToTop,
    },
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
  };
}
