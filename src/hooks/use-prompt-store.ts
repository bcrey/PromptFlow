import { useLocalStorage } from "./use-local-storage";
import type { AppState, Project, Prompt } from "@/types/prompt";

const DEFAULT_STATE: AppState = {
  projects: [],
  activeProjectId: null,
};

function newId(): string {
  return crypto.randomUUID();
}

export function usePromptStore() {
  const [state, setState] = useLocalStorage<AppState>("prompt-manager", DEFAULT_STATE);

  const activeProject = state.projects.find((p) => p.id === state.activeProjectId) ?? null;

  function addProject(name: string) {
    const project: Project = { id: newId(), name, prompts: [] };
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
      activeProjectId: project.id,
    }));
  }

  function removeProject(id: string) {
    setState((prev) => {
      const projects = prev.projects.filter((p) => p.id !== id);
      return {
        ...prev,
        projects,
        activeProjectId:
          prev.activeProjectId === id ? (projects[0]?.id ?? null) : prev.activeProjectId,
      };
    });
  }

  function setActiveProject(id: string) {
    setState((prev) => ({ ...prev, activeProjectId: id }));
  }

  function addPrompt(text: string) {
    const prompt: Prompt = { id: newId(), text, done: false, createdAt: Date.now() };
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === prev.activeProjectId ? { ...p, prompts: [...p.prompts, prompt] } : p
      ),
    }));
  }

  function togglePromptDone(promptId: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === prev.activeProjectId
          ? { ...p, prompts: p.prompts.map((pr) => (pr.id === promptId ? { ...pr, done: !pr.done } : pr)) }
          : p
      ),
    }));
  }

  function reorderPrompts(activeId: string, overId: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== prev.activeProjectId) return p;
        const prompts = [...p.prompts];
        const oldIndex = prompts.findIndex((pr) => pr.id === activeId);
        const newIndex = prompts.findIndex((pr) => pr.id === overId);
        if (oldIndex === -1 || newIndex === -1) return p;
        const [moved] = prompts.splice(oldIndex, 1);
        prompts.splice(newIndex, 0, moved);
        return { ...p, prompts };
      }),
    }));
  }

  function editPrompt(promptId: string, text: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === prev.activeProjectId
          ? { ...p, prompts: p.prompts.map((pr) => (pr.id === promptId ? { ...pr, text } : pr)) }
          : p
      ),
    }));
  }

  function clearDone() {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === prev.activeProjectId ? { ...p, prompts: p.prompts.filter((pr) => !pr.done) } : p
      ),
    }));
  }

  function exportState() {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-manager-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importState(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.projects || !Array.isArray(parsed.projects)) {
          alert("Invalid file format: missing projects array.");
          return;
        }
        if (!window.confirm("This will overwrite all existing data. Continue?")) return;
        setState(parsed as AppState);
      } catch {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function renameProject(id: string, name: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  return {
    state,
    activeProject,
    addProject,
    removeProject,
    renameProject,
    setActiveProject,
    addPrompt,
    editPrompt,
    togglePromptDone,
    reorderPrompts,
    clearDone,
    exportState,
    importState,
  };
}
