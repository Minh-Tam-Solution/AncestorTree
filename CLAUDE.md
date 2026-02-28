---
project: AncestorTree
path: CLAUDE.md
type: agent-guidelines
version: 2.3.0
updated: 2026-02-28
---

# CLAUDE.md

This file provides guidance to AI assistants (Claude, GPT, etc.) when working with code in this repository.

## Project Overview

**AncestorTree** (Gia Phả Điện Tử) is a digital family tree management system for Chi tộc Đặng Đình, Thạch Lâm, Hà Tĩnh.

- **Repository:** https://github.com/Minh-Tam-Solution/AncestorTree
- **Current Version:** v2.3.0 (Privacy, Verification & Sub-admin)
- **SDLC Tier:** LITE (5 stages)
- **Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Supabase, Electron 34 (desktop)
- **Built with:** [TinySDLC](https://github.com/Minh-Tam-Solution/tinysdlc) + [MTS-SDLC-Lite](https://github.com/Minh-Tam-Solution/MTS-SDLC-Lite)

## SDLC Framework v6.1.0 - LITE Tier

This project follows MTS SDLC Framework with 5 stages:

```
docs/
├── 00-foundation/     # Vision, scope, requirements, community
│   └── 06-Community/  # Community launch posts (7 platform-specific)
├── 01-planning/       # Roadmap, sprints, milestones
├── 02-design/         # Architecture, UI/UX, data models
├── 04-build/          # Implementation guidelines
└── 05-test/           # Test plans, QA
```

**DO NOT** use generic 6-stage or 11-stage SDLC structure.
**ALWAYS** use the structure defined in `.sdlc-config.json`.

## File Header Standard

All documentation files MUST include YAML front matter:

```yaml
---
project: AncestorTree
path: docs/XX-stage/filename.md
type: document-type
version: X.X.X
updated: YYYY-MM-DD
owner: team/person
status: draft|review|approved
---
```

All code files MUST include header comment:

```typescript
/**
 * @project AncestorTree
 * @file src/path/to/file.ts
 * @description Brief description
 * @version 1.0.0
 * @updated 2026-02-25
 */
```

## Project Structure

```
AncestorTree/
├── docs/                           # SDLC Documentation
│   ├── 00-foundation/              # Vision, requirements
│   │   └── 06-Community/           # Community launch posts
│   ├── 01-planning/                # Sprints, roadmap
│   ├── 02-design/                  # Architecture, UI/UX
│   ├── 04-build/                   # Implementation
│   └── 05-test/                    # Testing
├── frontend/                       # Next.js application
│   ├── src/app/                    # App router (route groups)
│   │   ├── (auth)/                 # Auth pages (login, register, forgot-password, reset-password, pending-verification)
│   │   └── (main)/                 # Main app with sidebar
│   │       ├── achievements/       # Vinh danh thành tích (Sprint 6)
│   │       ├── cau-duong/          # Lịch Cầu đường (Sprint 7)
│   │       ├── charter/            # Hương ước (Sprint 6)
│   │       ├── contributions/      # Đóng góp (Sprint 4)
│   │       ├── directory/          # Thư mục thành viên (Sprint 4)
│   │       ├── documents/book/     # Gia phả sách (Sprint 5)
│   │       ├── documents/library/ # Kho tài liệu (Sprint 11)
│   │       ├── events/             # Lịch sự kiện (Sprint 4)
│   │       ├── fund/               # Quỹ khuyến học (Sprint 6)
│   │       ├── help/               # Hướng dẫn sử dụng (Sprint 11)
│   │       ├── people/             # Quản lý thành viên
│   │       ├── tree/               # Cây gia phả
│   │       └── admin/              # Admin panel
│   │           ├── achievements/   # QL Vinh danh (Sprint 6)
│   │           ├── cau-duong/      # QL Cầu đường (Sprint 7)
│   │           ├── charter/        # QL Hương ước (Sprint 6)
│   │           ├── contributions/  # QL Đóng góp (Sprint 4)
│   │           ├── documents/      # QL Tài liệu (Sprint 11)
│   │           ├── fund/           # QL Quỹ & Học bổng (Sprint 6)
│   │           ├── settings/       # Cài đặt
│   │           └── users/          # QL Người dùng
│   ├── src/components/             # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── auth/                   # Auth components (auth-provider, verification-guard)
│   │   ├── layout/                 # Layout components (sidebar, header)
│   │   ├── home/                   # Homepage components (featured-charter)
│   │   └── people/                 # People components (person-form, family-relations-card)
│   ├── src/hooks/                  # Custom React hooks
│   │   ├── use-achievements.ts     # Achievement CRUD hooks (Sprint 6)
│   │   ├── use-cau-duong.ts        # Cầu đường rotation hooks (Sprint 7)
│   │   ├── use-clan-articles.ts    # Charter CRUD hooks (Sprint 6)
│   │   ├── use-contributions.ts    # Contribution hooks (Sprint 4)
│   │   ├── use-events.ts           # Event hooks (Sprint 4)
│   │   ├── use-families.ts         # Family relations hooks (Sprint 7.5)
│   │   ├── use-documents.ts        # Document CRUD hooks (Sprint 11)
│   │   └── use-fund.ts             # Fund & scholarship hooks (Sprint 6)
│   ├── src/lib/                    # Utilities, Supabase client
│   │   ├── supabase.ts             # Supabase client init
│   │   ├── supabase-data.ts        # Core data layer (people, families)
│   │   ├── supabase-data-achievements.ts  # Achievement data (Sprint 6)
│   │   ├── supabase-data-cau-duong.ts     # Cầu đường + DFS algorithm (Sprint 7)
│   │   ├── supabase-data-charter.ts       # Charter data (Sprint 6)
│   │   ├── supabase-data-documents.ts     # Document data (Sprint 11)
│   │   ├── supabase-data-fund.ts          # Fund & scholarship data (Sprint 6)
│   │   └── lunar-calendar.ts       # Lunar-solar conversion (Sprint 4)
│   ├── src/types/                  # TypeScript types
│   │   └── index.ts                # All type definitions
│   └── supabase/                   # Database migrations
│       ├── migrations/             # Timestamped migration files (8)
│       ├── config.toml             # Supabase CLI config (ports, storage)
│       └── seed.sql                # Demo data: 18 thành viên 5 đời
├── desktop/                        # Electron desktop app (Sprint 9)
│   ├── electron/
│   │   ├── main.ts                 # App lifecycle, window, server start
│   │   ├── server.ts               # Start/stop Next.js standalone server
│   │   └── preload.ts              # Context bridge (minimal)
│   ├── build/                      # App icons (icns, ico, png)
│   ├── migrations/                 # SQLite versioned migrations
│   │   ├── 001-initial-schema.sql  # 13 tables (ported from PG)
│   │   ├── 002-seed-demo-data.sql  # Demo: 18 thành viên, 5 đời
│   │   ├── 003-clan-documents.sql  # Kho tài liệu (Sprint 11)
│   │   └── 004-sprint12-verification.sql  # Verification + privacy (Sprint 12)
│   ├── electron-builder.yml        # Cross-platform build config
│   ├── package.json                # Electron + sql.js deps
│   └── tsconfig.json
├── .sdlc-config.json               # SDLC configuration
├── CLAUDE.md                       # AI assistant guidelines
└── README.md                       # Project overview
```

## Database Schema

14 tables across 5 layers (profiles extended with verification in Sprint 12):

| Layer | Tables | Migration File |
|-------|--------|----------------|
| **Core Genealogy** | `people`, `families`, `children` | `database-setup.sql` |
| **Platform** | `profiles`, `contributions`, `media`, `events` | `database-setup.sql` |
| **Culture (v1.3)** | `achievements`, `fund_transactions`, `scholarships`, `clan_articles` | `sprint6-migration.sql` |
| **Ceremony (v1.4)** | `cau_duong_pools`, `cau_duong_assignments` | `cau-duong-migration.sql` |
| **Documents (v2.2)** | `clan_documents` | `sprint11-kho-tai-lieu.sql` |

All tables have RLS policies with 4 roles: `admin`, `editor`, `viewer`, `guest`.

## Development Commands

```bash
cd frontend

# Install dependencies
pnpm install

# Development
pnpm dev              # Start dev server (localhost:4000)

# Build & Test
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm test             # Run tests (when configured)

# Type checking
pnpm tsc --noEmit     # TypeScript check

# Local development (Supabase CLI + Docker)
pnpm local:setup      # Full setup: start Docker + write .env.local
pnpm local:start      # Start containers (after first setup)
pnpm local:stop       # Stop containers (keep data)
pnpm local:reset      # Reset DB + re-seed demo data
```

See `docs/04-build/LOCAL-DEVELOPMENT.md` for full local dev guide.

### Desktop App (Electron)

```bash
cd desktop

# Install dependencies
pnpm install

# Development (requires frontend standalone build first)
cd ../frontend && ELECTRON_BUILD=true pnpm build && cd ../desktop
pnpm dev              # Compile TS + launch Electron

# Build installers
pnpm build:mac        # macOS .dmg
pnpm build:win        # Windows .exe (NSIS)
```

**Architecture:** Electron shell → Next.js standalone server (localhost) → sql.js (WASM SQLite)

**Key env vars:** `DESKTOP_MODE=true`, `NEXT_PUBLIC_DESKTOP_MODE=true`, `DESKTOP_DATA_DIR=~/AncestorTree`

**Data:** `~/AncestorTree/data/ancestortree.db` (SQLite), `~/AncestorTree/media/` (photos)

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use explicit types (avoid `any`)
- Prefer interfaces over types for objects

### React/Next.js
- Use functional components with hooks
- Server Components by default, `'use client'` only when needed
- Use route groups: `(auth)` for public, `(main)` for authenticated
- React Query for server state (no global client state library needed)
- Each feature module has: data layer (`src/lib/`) + hooks (`src/hooks/`) + pages (`src/app/`)

### Styling
- Tailwind CSS 4 with WindCSS
- shadcn/ui component library
- Mobile-first responsive design

### Naming
- **Files:** kebab-case (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Functions/vars:** camelCase (`getUserData`)
- **Constants:** SCREAMING_SNAKE (`MAX_RETRY_COUNT`)
- **Data layer files:** `supabase-data-{module}.ts`
- **Hook files:** `use-{module}.ts`

## Git Workflow

### Commit Messages
Follow Conventional Commits:
```
feat: add family tree visualization
fix: resolve date picker timezone issue
docs: update API documentation
chore: upgrade dependencies
```

### Branch Naming
```
feature/tree-visualization
fix/auth-session-bug
docs/api-reference
chore/upgrade-deps
```

## Key Files Reference

| Purpose | Location |
|---------|----------|
| SDLC Config | `.sdlc-config.json` |
| Vision & Scope | `docs/00-foundation/VISION.md` |
| Business Requirements | `docs/01-planning/BRD.md` |
| Technical Design | `docs/02-design/technical-design.md` |
| UI/UX Design | `docs/02-design/ui-ux-design.md` |
| Core DB Schema | `frontend/supabase/migrations/20260224000000_database_setup.sql` |
| Sprint 6 Migration | `frontend/supabase/migrations/20260224000001_sprint6_migration.sql` |
| Sprint 7 Migration | `frontend/supabase/migrations/20260224000002_cau_duong_migration.sql` |
| Security Migration | `frontend/supabase/migrations/20260226000005_security_hardening.sql` |
| Sprint 11 Migration | `frontend/supabase/migrations/20260227000006_sprint11_kho_tai_lieu.sql` |
| Sprint 12 Migration | `frontend/supabase/migrations/20260228000008_sprint12_privacy_verification.sql` |
| Verification Guard | `frontend/src/components/auth/verification-guard.tsx` |
| Pending Verification | `frontend/src/app/(auth)/pending-verification/page.tsx` |
| Local Dev Guide | `docs/04-build/LOCAL-DEVELOPMENT.md` |
| Sprint Plan | `docs/04-build/SPRINT-PLAN.md` |
| Test Plan | `docs/05-test/TEST-PLAN.md` |
| Community Launch | `docs/00-foundation/06-Community/Community-Launch-Strategy.md` |
| Desktop Main | `desktop/electron/main.ts` |
| Desktop Server | `desktop/electron/server.ts` |
| SQLite Shim (client) | `frontend/src/lib/sqlite-supabase-shim.ts` |
| SQLite DB API | `frontend/src/app/api/desktop-db/route.ts` |
| SQLite Schema | `desktop/migrations/001-initial-schema.sql` |
| Installation Guide | `docs/04-build/INSTALLATION-GUIDE.md` |
| User Guide | `docs/04-build/USER-GUIDE.md` |
| Landing Page | `frontend/src/app/(landing)/welcome/page.tsx` |
| Help Page | `frontend/src/app/(main)/help/page.tsx` |
| Document Library | `frontend/src/app/(main)/documents/library/page.tsx` |
| Admin Documents | `frontend/src/app/(main)/admin/documents/page.tsx` |

## Common Tasks

### Adding a New Page
1. Create page in appropriate route group (`(auth)` or `(main)`)
2. Add error.tsx and loading.tsx boundaries
3. Add navigation link in `app-sidebar.tsx` if needed
4. Update `docs/02-design/ui-ux-design.md`

### Adding a Database Table
1. For core tables: add SQL to `frontend/supabase/database-setup.sql`
2. For feature tables: create separate migration file (e.g., `sprint6-migration.sql`)
3. Add RLS policies in the same migration file
4. Update types in `src/types/index.ts`
5. Create data layer in `src/lib/supabase-data-{module}.ts`
6. Create hooks in `src/hooks/use-{module}.ts`
7. Update `docs/02-design/technical-design.md`

### Adding a Feature Module (Sprint 6 Pattern)
1. **Types:** Add interfaces to `src/types/index.ts`
2. **Data layer:** Create `src/lib/supabase-data-{module}.ts` with CRUD functions
3. **Hooks:** Create `src/hooks/use-{module}.ts` with React Query hooks
4. **Public page:** Create `src/app/(main)/{module}/page.tsx` + error.tsx + loading.tsx
5. **Admin page:** Create `src/app/(main)/admin/{module}/page.tsx`
6. **Navigation:** Add items to `src/components/layout/app-sidebar.tsx`

### Adding a Component
1. Create in appropriate folder under `src/components/`
2. Use shadcn/ui primitives when possible

## Notes for AI Assistants

- Always check `.sdlc-config.json` for project tier and stages
- Include proper file headers when creating/modifying files
- Follow existing code patterns in the codebase (especially Sprint 6 module pattern)
- Run `pnpm build` to verify changes compile
- Update relevant documentation when making changes
- Use Vietnamese for user-facing content, English for code/comments
- Data layer functions return typed results using Supabase client
- React Query hooks handle caching, invalidation, and optimistic updates
- Admin pages require editor role guard
- All pages should have error.tsx and loading.tsx boundaries

### Desktop Mode Specifics

- Desktop uses **sql.js (WASM SQLite)** — data layer code is UNCHANGED
- `sqlite-supabase-shim.ts` serializes Supabase queries → fetch `/api/desktop-db`
- `sqlite-auth-shim.ts` mocks auth (single-user admin, no real login)
- `sqlite-storage-shim.ts` routes media to `/api/media/` (local filesystem)
- Desktop mode is detected via `process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true'`
- `supabase.ts` conditionally returns shim client in desktop mode
- `middleware.ts` bypasses auth checks when `DESKTOP_MODE=true`, enforces `is_verified` for web
- `verification-guard.tsx` client-side defense-in-depth for unverified users
- SQLite migrations in `desktop/migrations/` — additive only, `_migrations` version table
- Desktop DB at `~/AncestorTree/data/ancestortree.db`, media at `~/AncestorTree/media/`
- Boolean columns: SQLite uses 0/1, API route converts ↔ true/false
- JSONB columns: stored as TEXT in SQLite, `JSON.stringify()`/`JSON.parse()` in API route

## Secure Coding Standards (Updated 2026-02-27)

> Full review: `docs/backend/SECURE-CODING-REVIEW.md`
> API reference: `docs/backend/API-ENDPOINTS.md`

### Mandatory Controls

**File Upload (OWASP A05):**
- ALWAYS validate `file.size` before processing — max 50MB for media, 500MB for ZIP import
- ALWAYS validate MIME type via allowlist (not just file extension)
- Use `resolveSafePath()` pattern for all local file operations (prevents path traversal)

**SQL / Query Safety (OWASP A03):**
- ALWAYS use parameterized queries (`?` placeholders) — never string-concatenate user input into SQL
- Whitelist column names before including in dynamic SQL (query-builder pattern)
- Escape LIKE special chars: `query.replace(/[%_\\]/g, '\\$&')` before `.ilike()`

**Mass Assignment (OWASP A04):**
- ALWAYS use allowlist pattern (`allowedFields`) when applying user-provided changes to DB records
- Never spread untrusted objects directly into Supabase `.update()` or `.insert()`

**Import / Data Integrity (OWASP A08):**
- Validate ZIP manifest schema before INSERT — check column names against per-table whitelist
- Use `INSERT OR IGNORE` not `INSERT OR REPLACE` to prevent silent overwrites

**Access Control (OWASP A01):**
- All desktop API routes MUST call `guardDesktopOnly()` at the top
- Admin pages require `role === 'admin' || role === 'editor'` check in middleware
- Contact fields (phone/email/zalo/facebook/address) are PII — never return to unauthenticated users
- Unverified users (`is_verified = false`) are redirected to `/pending-verification` by middleware
- Middleware uses `!profile || profile.is_verified !== true` (fail-closed, not fail-open)
- Sub-admin RLS uses `WITH CHECK` to restrict updates to `is_verified` column only
- `clan_documents.privacy_level`: 0=public, 1=members, 2=admin+editor only

**Authentication:**
- Supabase JWT stored in HttpOnly cookies (via `@supabase/ssr`) — never localStorage
- Desktop mode bypasses auth only when `NEXT_PUBLIC_DESKTOP_MODE === 'true'`
- Always `try/catch` auth calls with timeout (5s in middleware) to avoid cold-start hangs

### Known Issues (Backlog)
- `SEC-CRIT-01` P0: No file size limit on `/api/media` upload → add `MAX_FILE_SIZE` check
- `SEC-CRIT-02` P0: No MIME type validation on upload → validate `file.type` allowlist
- `SEC-CRIT-03` P1: Import manifest column names not whitelisted → SQL injection via column names
- `SEC-WARN-02` P2: `deleteDocumentFile` path extraction fragile (multiple `/media/` segments)
