export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DbPrompt {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  done: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbProjectWithPrompts extends DbProject {
  prompts: DbPrompt[];
}
