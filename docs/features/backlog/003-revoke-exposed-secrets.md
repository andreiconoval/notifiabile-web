# TASK-003: Revoke exposed secrets in `.env.local`

**Priority:** CRITICAL
**Category:** Security
**Effort:** Small

## Problem

`.env.local` is committed to git with real Supabase credentials:

- `SUPABASE_SERVICE_ROLE_KEY` — **super-admin key** that grants full read/write/delete access to all Supabase data
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anonymous JWT
- `NEXT_PUBLIC_SUPABASE_PROJECTID` — project identifier

The `.gitignore` has `.env*` on line 34 but the file was already committed before that rule existed.

## What To Do

1. **Immediately** revoke and rotate both keys in the Supabase dashboard (Project Settings > API)
2. Remove `.env.local` from git history:
   ```bash
   git filter-repo --invert-paths --path .env.local
   ```
   or if `git-filter-repo` is unavailable:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local' --prune-empty -- --all
   ```
3. Force-push the cleaned history (coordinate with team)
4. Create `.env.example` with placeholder values for developer onboarding:
   ```env
   NEXT_PUBLIC_API_URL=https://localhost:7119
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_PROJECTID=your_project_id
   NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/oauth/callback
   OPENAPI_URL=https://localhost:7119/swagger/notifiable-api/swagger.json
   ```
5. Add a pre-commit hook to reject `.env*` files (except `.env.example`)

## Acceptance Criteria

- Old keys are revoked in Supabase
- `.env.local` is removed from git history
- `.env.example` exists with safe placeholder values
- No secrets exist in any git commit
