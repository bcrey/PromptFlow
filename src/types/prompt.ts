export interface Prompt {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  prompts: Prompt[];
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  addToTop?: boolean;
}
