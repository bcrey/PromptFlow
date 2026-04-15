# Project Context

## Stack
- Frontend: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL + Auth + Realtime)
- Deployment: Vercel
- Package Manager: npm

## Common Commands
- `npm install` — install dependencies
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npx supabase start` — start local Supabase
- `npx supabase db push` — push migrations
- `npx supabase gen types typescript --local > src/types/database.ts` — regenerate DB types

## Workflow Rules

### Before Making Changes
- Read the relevant files before editing them
- If a task affects database schema, check `supabase/migrations/` first
- Run `npm run build` after significant changes to catch type errors

### Code Style
- Use functional components with hooks
- Prefer `async/await` over `.then()` chains
- Use TypeScript strict mode — no `any` types unless truly unavoidable
- Name files: `kebab-case.ts` for utils, `PascalCase.tsx` for components
- Colocate tests with source files: `thing.test.ts` next to `thing.ts`

### Git
- Write clear commit messages: `type: short description` (e.g., `feat: add workout timer`)
- Commit after completing each logical unit of work
- Don't commit `.env` files, `node_modules`, or `.next/`

### When Installing Packages
- Always run `npm install <package>` — don't manually edit package.json
- After installing, verify it works with `npm run build`
- Prefer well-maintained packages with active repos

### Error Handling
- Never swallow errors silently — at minimum `console.error`
- Use try/catch for async operations
- Show user-facing errors in the UI, not just console

### Supabase Specifics
- Row Level Security (RLS) is required on all tables
- Create migrations with `npx supabase migration new <name>`
- Always regenerate TypeScript types after schema changes
- Use Supabase client from `src/lib/supabase.ts` — don't create new clients

## File Structure
```
src/
  app/           — Next.js App Router pages + layouts
  components/    — Reusable React components
  lib/           — Supabase client, utilities, helpers
  types/         — TypeScript types (including generated DB types)
  hooks/         — Custom React hooks
supabase/
  migrations/    — SQL migration files
  seed.sql       — Seed data
```

## Don'ts
- Don't delete or overwrite `.env.local` without asking
- Don't run destructive database commands (`DROP TABLE`, `TRUNCATE`) without confirmation
- Don't install global packages — keep everything project-local
- Don't use `sudo` for anything
