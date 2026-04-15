# Prompt Manager App — Implementation Plan

## Context
Build a personal prompt management tool from scratch in the existing empty project directory. The app lets users organize prompts across multiple projects, with drag-and-drop reordering, quick copy, and a done/clear workflow. Data persists in localStorage (no database needed for this personal tool).

## Stack
- Next.js (App Router) + React + TypeScript + Tailwind CSS
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` for drag-and-drop
- `uuid` for ID generation
- `localStorage` for persistence (replacing Supabase from CLAUDE.md — overkill for this use case)

## Data Model (`src/types/prompt.ts`)

```typescript
interface Prompt { id: string; text: string; done: boolean; createdAt: number }
interface Project { id: string; name: string; prompts: Prompt[] }
interface AppState { projects: Project[]; activeProjectId: string | null }
```

## Component Architecture

```
page.tsx ('use client') — calls usePromptStore(), renders AppShell
  AppShell.tsx — two-column flex: sidebar + main
    ProjectSidebar.tsx — vertical tabs, add/remove projects
    PromptList.tsx — input (Enter submits) + DndContext/SortableContext + clear done button
      PromptItem.tsx — drag handle | text | copy button | checkbox
```

## Hooks
- `src/hooks/use-local-storage.ts` — generic SSR-safe localStorage hook (reads in useEffect to avoid hydration mismatch)
- `src/hooks/use-prompt-store.ts` — all app state + actions: addProject, removeProject, setActiveProject, addPrompt, togglePromptDone, reorderPrompts, clearDone, exportState, importState

## Key Behaviors
- **Drag-and-drop**: Only not-done prompts are draggable. Done prompts render below the SortableContext. Uses `PointerSensor` with `distance: 5` to prevent accidental drags on click.
- **Done prompts**: Checkbox toggles `done` → text gets `line-through text-gray-400 opacity-50`, item moves to bottom of list, drag handle hidden.
- **Copy**: Uses `navigator.clipboard.writeText()`, brief checkmark feedback.
- **Clear Done**: Button appears when done prompts exist, removes all checked prompts from the active project.
- **Project delete**: `window.confirm` before removing.
- **Export**: Serializes full `AppState` to a `.json` file and triggers a browser download (`prompt-manager-export-YYYY-MM-DD.json`). Uses `URL.createObjectURL` + hidden anchor click pattern.
- **Import**: File input (`accept=".json"`) reads a JSON file, validates it has the expected `AppState` shape, and replaces the current state. Shows `window.confirm` warning that this will overwrite existing data. Uses `FileReader` API.

## Implementation Steps

1. **Scaffold** — `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias`, then install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities uuid @types/uuid`
2. **Types + Hooks** — Create data model, localStorage hook, and prompt store hook
3. **Layout + Sidebar** — AppShell two-column layout, ProjectSidebar with add/remove/select
4. **Prompt Input + List** — PromptList with input, PromptItem with checkbox/copy (no DnD yet)
5. **Drag-and-Drop** — Wire up @dnd-kit sortable in PromptList and PromptItem
6. **Import/Export** — Add export (download JSON) and import (file upload with overwrite confirm) to the sidebar or a header area
7. **Polish** — Styling, transitions, copy feedback, update CLAUDE.md

## Files to Create/Modify
- `src/types/prompt.ts`
- `src/hooks/use-local-storage.ts`
- `src/hooks/use-prompt-store.ts`
- `src/components/AppShell.tsx`
- `src/components/ProjectSidebar.tsx`
- `src/components/PromptList.tsx`
- `src/components/PromptItem.tsx`
- `src/app/page.tsx`
- `src/app/layout.tsx` (minor tweaks)
- `src/app/globals.css` (minor tweaks)
- `CLAUDE.md` (update to reflect localStorage instead of Supabase)

## Verification
1. `npm run dev` — app loads without errors
2. Add/remove/switch projects via sidebar
3. Type a prompt, press Enter — appears in list
4. Drag prompts to reorder — order persists on refresh
5. Click copy — prompt text in clipboard
6. Check a prompt — strikes out, grays, moves to bottom
7. Click Clear Done — checked prompts removed
8. Refresh browser — all state persists from localStorage
9. Export → download JSON file, open it, verify it contains all projects/prompts
10. Import → load the exported file back in, verify state restores correctly
11. `npm run build` — no type errors
