# Claude Code Configuration — Setup Guide

## Two files, two jobs

| File | Purpose | Location |
|------|---------|----------|
| `CLAUDE.md` | Instructions, context, workflow rules | Project root (next to `package.json`) |
| `settings.json` | Permissions (what Claude can do without asking) | `.claude/settings.json` in project root |

## Installation

```bash
# From your project root:

# 1. Copy CLAUDE.md to project root
cp CLAUDE.md /path/to/your/project/CLAUDE.md

# 2. Create .claude directory and copy settings
mkdir -p /path/to/your/project/.claude
cp settings.json /path/to/your/project/.claude/settings.json
```

## What's allowed without prompting

**Reading** — All files (Claude needs to read to understand your code)

**Writing** — Only to `src/`, `supabase/`, `public/`, and specific config files. NOT `.env` files.

**Shell commands allowed:**
- `npm install/run/test` — package management & scripts
- `npx` — running project tools (Supabase CLI, etc.)
- `git` — all standard git operations
- File inspection — `cat`, `ls`, `find`, `grep`, `head`, `tail`
- File operations — `mkdir`, `cp`, `mv`, `touch`
- `node`, `tsx`, `tsc` — running scripts and type-checking
- `curl` — fetching URLs (but NOT piping to bash)

**Explicitly blocked:**
- `sudo` anything
- `rm -rf /`, `rm -rf ~`, `rm -rf .` (catastrophic deletes)
- `chmod 777` (wide-open permissions)
- `curl | bash` or `wget | sh` (remote code execution)
- `eval` (arbitrary execution)
- Writing to `.env*` files (secrets)
- Exporting API keys

## Customizing

### To allow more
Add patterns to the `allow` array. Examples:
```json
"Bash(docker *)",
"Bash(vercel *)",
"Write(scripts/**)"
```

### To restrict more
Add patterns to the `deny` array. Deny always wins over allow:
```json
"Bash(git push --force*)",
"Bash(npm publish*)",
"Write(supabase/migrations/**)"
```

### Global vs project settings
- **Project** (shared with team): `.claude/settings.json`
- **Project** (personal, gitignored): `.claude/settings.local.json`
- **Global** (all projects): `~/.claude/settings.json`

Project settings override global. Deny rules from any level are always enforced.

## Tips

1. **Start conservative, loosen as needed.** If Claude keeps asking permission for something safe, add it to the allow list.

2. **Use `settings.local.json`** for personal preferences you don't want to push to the team repo.

3. **`CLAUDE.md` evolves.** After a coding session, ask Claude: "What should we add to CLAUDE.md based on what we learned?" or use `/init` to regenerate.

4. **You can have nested `CLAUDE.md` files.** Put one in `src/components/CLAUDE.md` if that directory has specific conventions.
