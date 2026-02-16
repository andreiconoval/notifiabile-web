# TASK-011: Consolidate overlapping documentation

**Priority:** LOW
**Category:** Documentation
**Effort:** Small

## Problem

Three separate OAuth docs cover the same material with overlapping content:

- `docs/OAUTH_SETUP.md` (12.9 KB)
- `docs/OAUTH_CLIENT_SETUP.md` (11.1 KB)
- `docs/OAUTH_IMPLEMENTATION_SUMMARY.md` (9.0 KB)

Similarly, MCP docs may be outdated:
- `docs/MCP_QUICKSTART.md` (6.7 KB)
- `docs/MCP_SERVER_SETUP.md` (13.3 KB)
- `docs/MCP_MIGRATION.sql` (6.0 KB)

Developers don't know which file to follow.

## What To Do

1. Consolidate the 3 OAuth files into a single `docs/OAUTH.md` with sections:
   - Overview & Architecture
   - Supabase OAuth Setup
   - MCP Authorization Code Flow
   - Troubleshooting
2. Review MCP docs — if MCP is still supported, keep and update; if deprecated, archive or delete
3. Update `docs/features/api-keys.md` to reflect current implementation status (Tasks 1-8 from `api-keys/tasks.md` are now implemented)
4. Ensure README.md links point to correct doc files

## Acceptance Criteria

- Single `docs/OAUTH.md` replaces three overlapping files
- MCP docs are either updated or clearly marked as deprecated
- No broken documentation links
