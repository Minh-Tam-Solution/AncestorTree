---
project: AncestorTree
path: docs/04-build/SPRINT-PLAN.md
type: build
version: 3.2.0
updated: 2026-03-01
owner: "@pm"
status: approved
---

# Sprint Plan - Gia Phả Điện Tử

## 📅 Sprint Overview

```
Timeline: Feb 24 → Apr 11, 2026 (7 weeks)

Sprint 1  ████████████████████████████████ Week 1 (Feb 24-28)    ✅ DONE
Sprint 2  ████████████████████████████████ Week 2 (Mar 3-7)      ✅ DONE
Sprint 3  ████████████████████████████████ Week 3 (Mar 10-14)    ✅ DONE
Sprint 4  ████████████████████████████████ Week 4 (Mar 17-21)    ✅ DONE
Sprint 5  ████████████████████████████████ Week 5 (Mar 24-28)    ✅ DONE
Sprint 6  ████████████████████████████████ Week 6 (Mar 31-Apr 4) ✅ DONE
Sprint 7  ████████████████████████████████ Week 7 (Apr 7-11)     ✅ DONE
Sprint 7.5 ██████████████████████████████ (same day)             ✅ DONE
Sprint 8  ████████████████████████████████ Week 8 (Apr 14-18)    ✅ DONE
Sprint 9  ████████████████████████████████ Week 9 (Feb 26)       ✅ DONE (Phase 1-3)
Sprint 10 ████████████████████████████████ Week 10 (Feb 26-27)    ✅ DONE

--- Future (community contribution / owner has time) ---

Sprint 11 ████████████████████████████████ v2.2.0 Kho tài liệu     ✅ DONE
Sprint 12 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ v2.3.0 Bảo mật & Xác nhận 🚧 IN PROGRESS
Sprint 13 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ v2.4.0 Góc giao lưu     📋 PLANNED
Sprint 14 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ v2.5.0 Thông báo        📋 PLANNED
Sprint 15 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ v2.6.0 Export/Import    📋 PLANNED
Sprint 16 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ v3.0.0 Nhà thờ họ       📋 PLANNED

Milestones:
├── v0.1.0 Alpha    → End Sprint 1    ✅
├── v0.5.0 Beta     → End Sprint 2    ✅
├── v1.0.0 MVP      → End Sprint 3    ✅
├── v1.1.0 Enhanced → End Sprint 4    ✅
├── v1.2.0 Release  → End Sprint 5    ✅
├── v1.3.0 Culture  → End Sprint 6    ✅
├── v1.4.0 CauDuong → End Sprint 7    ✅
├── v1.5.0 Relations→ End Sprint 7.5  ✅
├── v1.7.0 LocalDev+Security → End Sprint 8 ✅
├── v2.0.0 Desktop  → End Sprint 9    ✅ (Phase 1-3)
├── v2.1.0 Landing  → End Sprint 10   ✅
├── v2.2.0 KhoTaiLieu→ End Sprint 11  ✅
└── v2.3.0 Privacy+Verify → Sprint 12  🚧
```

---

## 🏃 Sprint 1: Foundation (5 days) ✅

**Dates:** Feb 24-28, 2026
**Goal:** Project setup + Database + Basic UI shell
**Version:** v0.1.0-alpha

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1** | | | | |
| | Project scaffolding (Next.js 16, TypeScript) | 2h | @fullstack | ✅ |
| | Tailwind CSS 4 + shadcn/ui setup | 1h | @fullstack | ✅ |
| | Project structure (folders, configs) | 1h | @fullstack | ✅ |
| | Git repo setup, .gitignore, README | 1h | @fullstack | ✅ |
| **Day 2** | | | | |
| | Supabase project creation | 1h | @fullstack | ✅ |
| | Database schema (people, families, children) | 2h | @fullstack | ✅ |
| | RLS policies setup | 1h | @fullstack | ✅ |
| | Seed data (sample family) | 1h | @fullstack | ✅ |
| **Day 3** | | | | |
| | Supabase client setup | 1h | @fullstack | ✅ |
| | Auth provider (login/register) | 2h | @fullstack | ✅ |
| | Protected routes (middleware) | 1h | @fullstack | ✅ |
| | User profiles table | 1h | @fullstack | ✅ |
| **Day 4** | | | | |
| | Layout component (app-sidebar) | 2h | @fullstack | ✅ |
| | Navigation menu | 1h | @fullstack | ✅ |
| | Mobile responsive shell | 1h | @fullstack | ✅ |
| | Theme setup (colors, fonts) | 1h | @fullstack | ✅ |
| **Day 5** | | | | |
| | Homepage (dashboard with stats) | 1h | @fullstack | ✅ |
| | Deploy to Vercel | 1h | @fullstack | ✅ |
| | Environment variables setup | 0.5h | @fullstack | ✅ |
| | Sprint 1 testing & fixes | 2h | @fullstack | ✅ |
| | Documentation update | 0.5h | @fullstack | ✅ |

### Deliverables

- [x] Next.js 16 project running locally
- [x] Supabase database with schema
- [x] Auth flow (login/register/logout)
- [x] Basic layout with sidebar
- [x] Deployed to Vercel (staging)
- [x] README with setup instructions

### Exit Criteria

```
✅ pnpm dev runs without errors
✅ Can register & login
✅ Database tables created
✅ Vercel deployment working
✅ Mobile responsive shell
```

---

## 🏃 Sprint 2: Core Data & Tree (5 days) ✅

**Dates:** Mar 3-7, 2026
**Goal:** People CRUD + Family relationships + Basic tree
**Version:** v0.5.0-beta

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1** | | | | |
| | Data layer (supabase-data.ts) | 2h | @fullstack | ✅ |
| | React Query setup | 1h | @fullstack | ✅ |
| | usePeople, useFamilies hooks | 2h | @fullstack | ✅ |
| **Day 2** | | | | |
| | People list page | 2h | @fullstack | ✅ |
| | Person card component | 1h | @fullstack | ✅ |
| | Search functionality | 1h | @fullstack | ✅ |
| | Filter by generation/chi | 1h | @fullstack | ✅ |
| **Day 3** | | | | |
| | Person detail page | 2h | @fullstack | ✅ |
| | Person edit form | 2h | @fullstack | ✅ |
| | Form validation (Zod) | 1h | @fullstack | ✅ |
| **Day 4** | | | | |
| | Family relationships UI | 2h | @fullstack | ✅ |
| | Parent selector (searchable) | 1h | @fullstack | ✅ |
| | Children management | 1h | @fullstack | ✅ |
| | Add new person flow | 1h | @fullstack | ✅ |
| **Day 5** | | | | |
| | Tree layout algorithm | 2h | @fullstack | ✅ |
| | Basic tree view component | 2h | @fullstack | ✅ |
| | Sprint 2 testing & fixes | 1h | @fullstack | ✅ |

### Deliverables

- [x] Full CRUD for people
- [x] Family relationships working
- [x] Search & filter functional
- [x] Basic tree renders correctly
- [x] Form validation

### Exit Criteria

```
✅ Can add/edit/delete people
✅ Can link parents/children
✅ Search finds people by name
✅ Tree shows family structure
✅ Data persists in Supabase
```

---

## 🏃 Sprint 3: Interactive Tree & MVP (5 days) ✅

**Dates:** Mar 10-14, 2026
**Goal:** Full interactive tree + Admin panel + MVP release
**Version:** v1.0.0-mvp

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1** | | | | |
| | Tree zoom & pan | 2h | @fullstack | ✅ |
| | Tree node click → detail panel | 1h | @fullstack | ✅ |
| | Collapse/expand branches | 2h | @fullstack | ✅ |
| **Day 2** | | | | |
| | Ancestor view filter | 1.5h | @fullstack | ✅ |
| | Descendant view filter | 1.5h | @fullstack | ✅ |
| | Tree minimap | 1h | @fullstack | ✅ |
| | Tree controls (zoom buttons) | 1h | @fullstack | ✅ |
| **Day 3** | | | | |
| | Admin panel - dashboard | 2h | @fullstack | ✅ |
| | User management page | 2h | @fullstack | ✅ |
| | Role assignment (admin/editor/viewer) | 1h | @fullstack | ✅ |
| **Day 4** | | | | |
| | Homepage with stats | 2h | @fullstack | ✅ |
| | Feature cards (navigation) | 1h | @fullstack | ✅ |
| | Mobile tree view optimization | 2h | @fullstack | ✅ |
| **Day 5** | | | | |
| | Performance testing | 1h | @fullstack | ✅ |
| | Bug fixes | 2h | @fullstack | ✅ |
| | MVP documentation | 1h | @fullstack | ✅ |
| | Error boundaries | 1h | @fullstack | ✅ |

### Deliverables

- [x] Interactive tree with zoom/pan
- [x] Collapse/expand working
- [x] Ancestor/descendant views
- [x] Admin panel functional
- [x] Homepage with stats
- [x] Error boundaries for all routes

### Exit Criteria

```
✅ Tree is fully interactive
✅ Admin can manage users
✅ Mobile tree works
✅ MVP feature complete
```

---

## 🏃 Sprint 4: Enhanced Features (5 days) ✅

**Dates:** Mar 17-21, 2026
**Goal:** Directory + Memorial calendar + Contributions
**Version:** v1.1.0

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1** | | | | |
| | Directory page (contact list) | 2h | @fullstack | ✅ |
| | Directory filters | 1h | @fullstack | ✅ |
| | Contact info display | 1h | @fullstack | ✅ |
| | Privacy controls | 1h | @fullstack | ✅ |
| **Day 2** | | | | |
| | Events table setup | 1h | @fullstack | ✅ |
| | Lunar calendar utility | 2h | @fullstack | ✅ |
| | Memorial calendar page | 2h | @fullstack | ✅ |
| **Day 3** | | | | |
| | Upcoming giỗ list | 1.5h | @fullstack | ✅ |
| | Calendar view component | 2h | @fullstack | ✅ |
| | Death lunar date input | 1.5h | @fullstack | ✅ |
| **Day 4** | | | | |
| | Contributions table | 1h | @fullstack | ✅ |
| | Contribution form (viewer) | 2h | @fullstack | ✅ |
| | Admin review page | 2h | @fullstack | ✅ |
| **Day 5** | | | | |
| | Approve/reject workflow | 1.5h | @fullstack | ✅ |
| | Contribution history | 1h | @fullstack | ✅ |
| | Sprint 4 testing & fixes | 2h | @fullstack | ✅ |
| | Documentation update | 0.5h | @fullstack | ✅ |

### Deliverables

- [x] Directory with contacts
- [x] Memorial calendar working
- [x] Lunar date support
- [x] Contribution workflow
- [x] Privacy settings

### Exit Criteria

```
✅ Directory shows contacts (with privacy)
✅ Memorial calendar displays giỗ dates
✅ Lunar dates convert correctly
✅ Viewers can submit contributions
✅ Admins can approve/reject
```

---

## 🏃 Sprint 5: Polish & Release (5 days) ✅

**Dates:** Mar 24-28, 2026
**Goal:** GEDCOM export + Book generator + Final polish
**Version:** v1.2.0-release

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1** | | | | |
| | GEDCOM export utility | 2h | @fullstack | ✅ |
| | Export button & download | 1h | @fullstack | ✅ |
| | GEDCOM validation | 1h | @fullstack | ✅ |
| | Can Chi (zodiac) display | 1h | @fullstack | ✅ |
| **Day 2** | | | | |
| | Book generator utility | 2h | @fullstack | ✅ |
| | Book page (formatted view) | 2h | @fullstack | ✅ |
| | Print styles | 1h | @fullstack | ✅ |
| **Day 3** | | | | |
| | Media upload (photos) | 2h | @fullstack | ✅ |
| | Photo gallery component | 1.5h | @fullstack | ✅ |
| | Avatar upload | 1h | @fullstack | ✅ |
| | Supabase storage setup | 0.5h | @fullstack | ✅ |
| **Day 4** | | | | |
| | Performance optimization | 2h | @fullstack | ✅ |
| | SEO meta tags | 1h | @fullstack | ✅ |
| | Error boundaries | 1h | @fullstack | ✅ |
| | Loading states polish | 1h | @fullstack | ✅ |
| **Day 5** | | | | |
| | Final testing (all features) | 2h | @fullstack | ✅ |
| | Bug fixes | 1.5h | @fullstack | ✅ |
| | User documentation | 1h | @fullstack | ✅ |
| | Release notes | 0.5h | @fullstack | ✅ |

### Deliverables

- [x] GEDCOM export working
- [x] Book generator functional
- [x] Photo upload working
- [x] Performance optimized
- [x] Full documentation
- [x] v1.2.0 released

### Exit Criteria

```
✅ GEDCOM exports valid file
✅ Book view renders correctly
✅ Photos upload & display
✅ All features documented
✅ Production stable
```

---

## 🏃 Sprint 6: Culture & Community (5 days) ✅

**Dates:** Mar 31 - Apr 4, 2026
**Goal:** Achievement honors + Education fund + Family charter
**Version:** v1.3.0-culture

### Prerequisites (from Sprint 4-5)

> Sprint 6 has FK dependencies on `people` and `profiles` tables (Sprint 1-2) which are stable.
> Sprint 4-5 features are fully implemented.
>
> **Result:** Sprint 6 completed successfully on top of Sprint 4-5.

### Migration Strategy

> **DO NOT** modify `database-setup.sql` directly. Create a separate migration file:
> `frontend/supabase/sprint6-migration.sql` with all new tables, RLS policies, and indexes.
>
> **Data layer:** Split new functions into separate modules to avoid bloating `supabase-data.ts`:
> - `supabase-data-achievements.ts`
> - `supabase-data-fund.ts`
> - `supabase-data-charter.ts`

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1: Database + Types + Data Layer** | | | | |
| | DB migration: CREATE tables (achievements, fund_transactions, scholarships, clan_articles) | 1.5h | @fullstack | ✅ |
| | DB migration: RLS policies for 4 new tables | 1h | @fullstack | ✅ |
| | DB migration: Indexes (person, category, status, date) | 0.5h | @fullstack | ✅ |
| | TypeScript types: Achievement, FundTransaction, Scholarship, ClanArticle + enums | 1h | @fullstack | ✅ |
| | Data layer: supabase-data-achievements.ts (~8 functions) | 1.5h | @fullstack | ✅ |
| | Data layer: supabase-data-fund.ts (~8 functions) | 1.5h | @fullstack | ✅ |
| **Day 2: Data Layer (cont.) + Achievement UI** | | | | |
| | Data layer: supabase-data-charter.ts (~8 functions) | 1h | @fullstack | ✅ |
| | React Query hooks: use-achievements.ts, use-fund.ts, use-clan-articles.ts | 1.5h | @fullstack | ✅ |
| | Achievement honors page (featured + list) | 2h | @fullstack | ✅ |
| | Achievement category filters (hoc_tap, su_nghiep, cong_hien) | 1h | @fullstack | ✅ |
| | Achievement detail card component | 1h | @fullstack | ✅ |
| **Day 3: Fund Dashboard + Scholarships** | | | | |
| | Education fund dashboard (balance, stats) | 2h | @fullstack | ✅ |
| | Scholarship list with tabs (hoc_bong, khen_thuong) | 1.5h | @fullstack | ✅ |
| | Donation history & contribution form | 1.5h | @fullstack | ✅ |
| | Admin: achievement management CRUD | 2h | @fullstack | ✅ |
| **Day 4: Charter + Admin Pages** | | | | |
| | Family charter page with tabs (gia_huan, quy_uoc, loi_dan) | 2h | @fullstack | ✅ |
| | Rich text article display component | 1h | @fullstack | ✅ |
| | Admin: fund & scholarship management | 2h | @fullstack | ✅ |
| | Admin: charter article management CRUD | 1.5h | @fullstack | ✅ |
| **Day 5: Integration + Testing** | | | | |
| | Sidebar navigation update (3 new sections) | 0.5h | @fullstack | ✅ |
| | Homepage integration (honors + fund summary + featured charter) | 1.5h | @fullstack | ✅ |
| | Annual report views (achievements + fund) | 1h | @fullstack | ✅ |
| | Sprint 6 testing & fixes | 2h | @fullstack | ✅ |
| | Documentation update | 0.5h | @fullstack | ✅ |

### Hour Summary

| Day | Total | Focus |
|-----|-------|-------|
| Day 1 | 7h | DB migration + Types + Data layer (achievements, fund) |
| Day 2 | 6.5h | Data layer (charter) + Hooks + Achievement UI |
| Day 3 | 7h | Fund dashboard + Scholarships + Admin achievements |
| Day 4 | 6.5h | Charter page + Admin fund & charter |
| Day 5 | 5.5h | Integration + Testing + Docs |
| **Total** | **32.5h** | |

### Deliverables

- [x] DB migration file with 4 tables, RLS policies, indexes
- [x] TypeScript types + enums for all Sprint 6 entities
- [x] Data layer modules (3 files) + React Query hooks (3 files)
- [x] Achievement honors page with category filters
- [x] Education fund dashboard with balance tracking
- [x] Scholarship & reward management
- [x] Family charter page with 3 article categories
- [x] Admin CRUD for all 3 features
- [x] Homepage integration (honors + fund + charter)

### Exit Criteria

```
✅ sprint6-migration.sql applies without errors
✅ Achievements display with category filters
✅ Fund dashboard shows balance and transactions
✅ Scholarships can be created, approved, and paid
✅ Charter articles display with category tabs
✅ Admin can manage all new content
✅ Sidebar shows 3 new navigation sections
✅ pnpm build passes without errors
```

---

## 📊 Sprint Summary

| Sprint | Focus | Key Deliverables | LOC Est. | Status |
|--------|-------|------------------|----------|--------|
| **Sprint 1** | Foundation | Project setup, DB, Auth, Layout | ~2,000 | ✅ |
| **Sprint 2** | Core Data | CRUD, Relationships, Basic Tree | ~3,000 | ✅ |
| **Sprint 3** | MVP | Interactive Tree, Admin, Deploy | ~2,500 | ✅ |
| **Sprint 4** | Enhanced | Directory, Calendar, Contributions | ~2,500 | ✅ |
| **Sprint 5** | Polish | GEDCOM, Book, Photos, Release | ~2,000 | ✅ |
| **Sprint 6** | Culture | Honors, Fund, Scholarships, Charter | ~3,000 | ✅ |
| **Sprint 7** | Ceremony | Cầu đương rotation + DFS algorithm | ~1,500 | ✅ |
| **Sprint 7.5** | Relations | Family relations UX + tree filter | ~2,000 | ✅ |
| **Sprint 8** | LocalDev + Security | Supabase CLI + Docker + RLS hardening + middleware fix | ~1,200 | ✅ |
| **Sprint 9** | Desktop App | Electron + sql.js shim, SQLite DB, 3-platform build | ~1,800 | ✅ (P1-3) |
| **Sprint 10** | Landing Page | Public landing page + community funnel + download links | ~500 est. | 🔄 |
| **Total** | | | **~22,000** | |

---

## 📋 Feature Completion Matrix

| Feature | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S7.5 | S8 | S9 | S10 | Status |
|---------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:----:|:--:|:--:|:---:|:------:|
| Project Setup | ✅ | | | | | | | | | | | DONE |
| Database Schema | ✅ | | | | | | | | | | | DONE |
| Auth (Login/Register) | ✅ | | | | | | | | | | | DONE |
| Layout & Navigation | ✅ | | | | | | | | | | | DONE |
| People CRUD | | ✅ | | | | | | | | | | DONE |
| Family Relationships | | ✅ | | | | | | | | | | DONE |
| Search & Filter | | ✅ | | | | | | | | | | DONE |
| Basic Tree View | | ✅ | | | | | | | | | | DONE |
| Interactive Tree | | | ✅ | | | | | | | | | DONE |
| Admin Panel | | | ✅ | | | | | | | | | DONE |
| Homepage & Stats | | | ✅ | | | | | | | | | DONE |
| Directory | | | | ✅ | | | | | | | | DONE |
| Memorial Calendar | | | | ✅ | | | | | | | | DONE |
| Lunar Calendar | | | | ✅ | | | | | | | | DONE |
| Contributions | | | | ✅ | | | | | | | | DONE |
| GEDCOM Export | | | | | ✅ | | | | | | | DONE |
| Book Generator | | | | | ✅ | | | | | | | DONE |
| Photo Upload | | | | | ✅ | | | | | | | DONE |
| Error Boundaries | | | | | ✅ | | | | | | | DONE |
| Achievement Honors | | | | | | ✅ | | | | | | DONE |
| Education Fund | | | | | | ✅ | | | | | | DONE |
| Scholarships & Rewards | | | | | | ✅ | | | | | | DONE |
| Family Charter | | | | | | ✅ | | | | | | DONE |
| Cầu đương (rotation+DFS) | | | | | | | ✅ | | | | | DONE |
| FamilyRelationsCard | | | | | | | | ✅ | | | | DONE |
| Tree hierarchical layout | | | | | | | | ✅ | | | | DONE |
| Tree-scoped editor | | | | | | | | ✅ | | | | DONE |
| Local dev (Supabase CLI) | | | | | | | | | ✅ | | | DONE |
| Middleware auth guard | | | | | | | | | ✅ | | | DONE |
| RLS: profiles protected | | | | | | | | | ✅ | | | DONE |
| RLS: contact data private | | | | | | | | | ✅ | | | DONE |
| RLS: tables auth-gated | | | | | | | | | ✅ | | | DONE |
| Electron shell (Desktop) | | | | | | | | | | ✅ | | DONE |
| sql.js SQLite shim | | | | | | | | | | ✅ | | DONE |
| Desktop build targets | | | | | | | | | | ✅ | | DONE |
| ZIP export/import | | | | | | | | | | ✅ | | DONE |
| First-run wizard | | | | | | | | | | ✅ | | DONE |
| Public landing page | | | | | | | | | | | 🔄 | S10 |
| GitHub issue templates | | | | | | | | | | | 🔄 | S10 |
| Community docs v2.1.0 | | | | | | | | | | | 🔄 | S10 |
| SEO (canonical + robots) | | | | | | | | | | | 🔄 | S10 |

---

## 🎯 Success Metrics

### Per Sprint

| Sprint | Metric | Target | Result |
|--------|--------|--------|--------|
| S1 | Project runs | ✅ No errors | PASS |
| S1 | Deployment | ✅ Vercel live | PASS |
| S2 | Data operations | ✅ CRUD works | PASS |
| S2 | Tree renders | ✅ 5 generations | PASS |
| S3 | Interactive tree | ✅ Zoom/pan/collapse | PASS |
| S3 | User management | ✅ Roles work | PASS |
| S4 | Calendar | ✅ Lunar dates correct | PASS |
| S4 | Contributions | ✅ Workflow complete | PASS |
| S5 | GEDCOM | ✅ Valid export | PASS |
| S5 | Error boundaries | ✅ All routes covered | PASS |
| S6 | DB migration | ✅ sprint6-migration.sql applies cleanly | PASS |
| S6 | Achievements | ✅ Honors page with filters | PASS |
| S6 | Fund | ✅ Dashboard with balance | PASS |
| S6 | Charter | ✅ Articles with categories | PASS |
| S6 | Build | ✅ pnpm build passes | PASS |
| S7 | DB migration | ✅ cau-duong-migration.sql applies cleanly | PASS |
| S7 | DFS algorithm | ✅ Correct preorder traversal | PASS |
| S7 | Public schedule | ✅ 4 ceremonies/year with status badges | PASS |
| S7 | Admin panel | ✅ Pool + assignment + delegation management | PASS |
| S7.5 | FamilyRelationsCard | ✅ Parents/siblings/spouses/children | PASS |
| S7.5 | Tree hierarchical layout | ✅ Bottom-up subtree width algorithm | PASS |
| S7.5 | Tree branch filter | ✅ ?root= URL parameter working | PASS |
| S7.5 | Tree-scoped editor | ✅ RLS + admin UI complete | PASS |

### Sprint 9 — Desktop App

| Metric | Target | Result |
|--------|--------|--------|
| Electron launches + BrowserWindow renders | Yes | PASS |
| sql.js WASM loads in standalone mode | Yes | PASS |
| Desktop DB API (6 files) passes | Yes | PASS |
| Supabase client shim (auth, storage, query) | Yes | PASS |
| Build targets (mac/win/linux) configured | Yes | PASS |
| First-run wizard works | Yes | PASS |
| ZIP export/import works | Yes | PASS |
| Web build (`pnpm build`) unaffected | Yes | PASS |

### Sprint 10 — Landing Page

| Metric | Target | Result |
|--------|--------|--------|
| `/welcome` loads without login | Yes | ⏳ |
| All 7 sections render correctly | Yes | ⏳ |
| Download links point to GitHub Releases | Yes | ⏳ |
| Community links to GitHub Issues/Discussions | Yes | ⏳ |
| SEO: canonical URL + robots.txt | Yes | ⏳ |
| Mobile responsive (375px, 768px, 1024px) | Yes | ⏳ |
| Community docs updated to v2.1.0 | Yes | ⏳ |
| `pnpm build` passes | Yes | ⏳ |

### Final Release

| Metric | Target | Result |
|--------|--------|--------|
| **Features complete** | 100% of MVP + v2.1 | ✅ DONE (through S9) |
| **Bugs** | 0 critical, <5 minor | ✅ 0 critical |
| **Mobile** | 100% responsive | ✅ DONE |
| **Build** | pnpm build + lint clean | ✅ PASS |

---

## 🔧 Technical Dependencies

### Sprint 1 Prerequisites
- Node.js 22+
- pnpm
- Supabase account
- Vercel account
- GitHub repository

### Key Libraries (Actual)

| Library | Version | Sprint | Notes |
|---------|---------|--------|-------|
| Next.js | 16.1.6 | S1 | |
| React | 19.2.3 | S1 | |
| TypeScript | 5.x | S1 | |
| Tailwind CSS | 4.x | S1 | |
| shadcn/ui | 3.8.5 | S1 | |
| @supabase/supabase-js | 2.97.0 | S1 | |
| @supabase/ssr | 0.8.0 | S1 | Server-side auth |
| React Query | 5.90.21 | S2 | |
| Zod | 4.3.6 | S2 | |
| react-hook-form | 7.71.2 | S2 | |
| Framer Motion | 12.34.3 | S3 | |
| Lucide React | 0.575.0 | S1 | Icons |

> **Note:** Zustand 5.0.11 is installed but not actively used. State management is handled via React Context (AuthProvider) + React Query cache.

---

---

## 🏃 Sprint 7: Lịch Cầu đương (5 days) 🔄

**Dates:** Apr 7-11, 2026
**Goal:** Ceremony rotation schedule — phân công xoay vòng chủ lễ Cầu đương
**Version:** v1.4.0
**BRD Coverage:** FR-1501~1507

### Business Context

Cầu đương là nghi lễ cúng tổ tiên xoay vòng trong dòng họ:
- **4 lễ/năm:** Tết Nguyên Đán, Rằm tháng Giêng (15/1 AL), Giỗ tổ Can Thăng (15/3 AL), Rằm tháng Bảy (15/7 AL)
- **Người đủ điều kiện:** Nam giới đã lập gia đình, dưới 70 tuổi âm, từ đời 12 trở xuống
- **Thứ tự xoay vòng:** DFS preorder của cây gia phả từ tổ tông, đời trên trước, trong mỗi đời theo thứ tự gia đình (sort_order)
- **Tuổi âm:** `currentYear - birthYear + 1` (cách tính tuổi Việt Nam)
- **Chu kỳ:** Sau khi xoay hết 1 vòng sẽ bắt đầu lại từ đầu

### Database Design

**Tables mới:**

```sql
cau_duong_pools          -- Cấu hình nhóm xoay vòng
├── id (UUID PK)
├── name                 -- VD: "Nhánh ông Đặng Đình Nhân"
├── ancestor_id          -- FK → people (tổ tông gốc của nhóm)
├── min_generation       -- Đời tối thiểu (VD: 12)
├── max_age_lunar        -- Tuổi âm tối đa (mặc định: 70)
├── description
└── is_active

cau_duong_assignments    -- Phân công từng lễ
├── id (UUID PK)
├── pool_id              -- FK → cau_duong_pools
├── year                 -- Năm dương lịch
├── ceremony_type        -- ENUM: tet | ram_thang_gieng | gio_to | ram_thang_bay
├── host_person_id       -- Người được phân công
├── actual_host_person_id -- Người thực sự thực hiện (nếu ủy quyền)
├── status               -- ENUM: scheduled | completed | delegated | rescheduled | cancelled
├── scheduled_date       -- Ngày dự kiến (DATE)
├── actual_date          -- Ngày thực hiện (DATE, nếu đổi)
├── reason               -- Lý do ủy quyền / đổi ngày
├── notes
├── rotation_index       -- Vị trí trong DFS list khi phân công (để theo dõi vòng xoay)
└── UNIQUE(pool_id, year, ceremony_type)
```

**Migration file:** `frontend/supabase/cau-duong-migration.sql`

### Algorithm: DFS Preorder Traversal

```
Mục tiêu: Xác định thứ tự xoay vòng theo cây gia phả

Input:
  - ancestor_id: UUID của tổ tông nhóm Cầu đương
  - families: {father_id → [family]} (sorted by sort_order)
  - children: {family_id → [child]} (sorted by sort_order)

Algorithm (DFS preorder):
  1. Stack = [ancestor_id]
  2. While stack not empty:
     a. current = stack.pop()
     b. Nếu current là male, married → thêm vào eligible_list
     c. Lấy tất cả families mà father_id = current (sort by sort_order)
     d. Với mỗi family (theo thứ tự ngược để push đúng thứ tự):
        - Lấy children của family (sort by sort_order)
        - Push children vào stack (thứ tự ngược)
  3. Lọc eligible_list: gender=1, is_living, generation>=min_gen, ageLunar<max_age

Rotation logic:
  - next_rotation_index = (last_assignment.rotation_index + 1) % eligible_count
  - eligible_list[next_rotation_index] = người được phân công tiếp theo
```

**Algorithm file:** `frontend/src/lib/supabase-data-cau-duong.ts`

### Tasks

| Day | Task | Hours | Owner | Status |
|-----|------|-------|-------|--------|
| **Day 1: Database + Types** | | | | |
| | Tạo `cau-duong-migration.sql` (tables + RLS) | 2h | @fullstack | ✅ |
| | Thêm types vào `src/types/index.ts` | 1h | @fullstack | ✅ |
| | Run migration trên Supabase | 0.5h | @fullstack | ✅ |
| **Day 2: Data Layer + Hooks** | | | | |
| | Tạo `src/lib/supabase-data-cau-duong.ts` | 3h | @fullstack | ✅ |
| | Implement DFS algorithm (`buildDFSOrder`) | 1h | @fullstack | ✅ |
| | Tạo `src/hooks/use-cau-duong.ts` | 1h | @fullstack | ✅ |
| **Day 3: Public View** | | | | |
| | Tạo `/cau-duong/page.tsx` — xem lịch phân công | 2h | @fullstack | ✅ |
| | Tab 1: Lịch phân công năm (4 lễ, có status badge) | 1h | @fullstack | ✅ |
| | Tab 2: Danh sách thành viên đủ điều kiện (DFS order) | 1h | @fullstack | ✅ |
| | Thêm error.tsx + loading.tsx | 0.5h | @fullstack | ✅ |
| **Day 4: Admin Panel** | | | | |
| | Tạo `/admin/cau-duong/page.tsx` | 3h | @fullstack | ✅ |
| | Form tạo/sửa pool (tổ tông, đời, tuổi) | 1h | @fullstack | ✅ |
| | Nút phân công tự động + manual assign | 1h | @fullstack | ✅ |
| | Xử lý ủy quyền (delegation form) | 1h | @fullstack | ✅ |
| | Xử lý đổi ngày (reschedule form) | 0.5h | @fullstack | ✅ |
| | Ghi nhận hoàn thành (mark complete) | 0.5h | @fullstack | ✅ |
| **Day 5: Navigation + Docs** | | | | |
| | Thêm "Cầu đương" vào sidebar navigation | 0.5h | @fullstack | ✅ |
| | Update `docs/02-design/technical-design.md` | 1h | @pm | ✅ |
| | Update `CLAUDE.md` với Sprint 7 info | 0.5h | @pm | ✅ |
| | Verify build passes (`pnpm build`) | 1h | @fullstack | ✅ |

### Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-S7-01 | Admin có thể tạo nhóm Cầu đương với cấu hình đời/tuổi | ✅ |
| AC-S7-02 | Hệ thống tính đúng danh sách đủ điều kiện theo tuổi âm | ✅ |
| AC-S7-03 | Thứ tự danh sách đúng theo DFS preorder cây gia phả | ✅ |
| AC-S7-04 | Admin phân công tự động chọn người tiếp theo trong vòng xoay | ✅ |
| AC-S7-05 | Viewer xem được lịch phân công 4 lễ/năm với status | ✅ |
| AC-S7-06 | Ủy quyền: ghi nhận người ủy quyền + người thực hiện + lý do | ✅ |
| AC-S7-07 | Đổi ngày: cập nhật actual_date, lý do, status=rescheduled | ✅ |
| AC-S7-08 | Vòng xoay tự động reset sau khi hết 1 chu kỳ | ✅ |

### File Structure

```
frontend/
├── supabase/
│   └── cau-duong-migration.sql   ✅ Created
├── src/
│   ├── types/
│   │   └── index.ts              ✅ Added CauDuong types
│   ├── lib/
│   │   └── supabase-data-cau-duong.ts  ✅ Created
│   ├── hooks/
│   │   └── use-cau-duong.ts      ✅ Created
│   └── app/(main)/
│       ├── cau-duong/
│       │   ├── page.tsx          ✅ Created
│   │   ├── error.tsx         ✅ Created
│   │   └── loading.tsx       ✅ Created
│       └── admin/
│           └── cau-duong/
│               └── page.tsx      ✅ Created
└── src/components/layout/
    └── app-sidebar.tsx           ✅ Updated (nav item added)
```

### Dependencies

- Requires: Sprint 1-6 complete (DB tables `people`, `families`, `children` with `sort_order`)
- Requires: `is_living`, `gender`, `generation`, `birth_year` fields on `people` table
- Requires: `sort_order` on `families` and `children` tables (Sprint 3)

---

---

## 🏃 Sprint 7.5: Family Relations UX ✅

**Dates:** Feb 25, 2026 (same day as Sprint 7)
**Goal:** Cải thiện UX quan hệ gia đình + Tree layout phân nhánh + Tree-scoped editor

### Tasks

| # | Task | Hours | Status |
|---|------|:-----:|:------:|
| 1 | `PersonRelations` interface + `getPersonRelations()` data layer | 1h | ✅ |
| 2 | `usePersonRelations()` + family mutation hooks | 1h | ✅ |
| 3 | `FamilyRelationsCard` component (parents/siblings/spouses/children + AddRelationDialog) | 2h | ✅ |
| 4 | Parent selection on `/people/new` (PersonCombobox for Cha/Mẹ) | 1h | ✅ |
| 5 | Hierarchical tree layout engine (bottom-up subtree width → top-down X assignment) | 2h | ✅ |
| 6 | Branch filter `?root=<id>` URL state + DFS from root | 1h | ✅ |
| 7 | Tree-scoped editor: `edit_root_person_id` + `is_person_in_subtree()` RLS (FR-507~510) | 2h | ✅ |
| 8 | Admin UI: TreeMappingDialog (linked_person + edit scope) | 1h | ✅ |

### Deliverables

- ✅ `/people/[id]` — FamilyRelationsCard with add relation dialog
- ✅ `/people/new` — Parent selection (auto-fill generation)
- ✅ `/tree` — Hierarchical layout + branch filter + `?root=` URL
- ✅ `/admin/users` — Tree mapping dialog (linked_person, edit_root)
- ✅ `sprint75-migration.sql` — `is_person_in_subtree()` + RLS policies

---

## 🏃 Sprint 8: Local Development Mode + Security Hardening ✅

**Dates:** Feb 26, 2026
**Goal:** Local dev offline + vá lỗ hổng bảo mật dữ liệu cá nhân
**Version:** v1.7.0

### Business Context

Nhiều thành viên dòng họ không rành kỹ thuật, không muốn đăng ký dịch vụ cloud.
Supabase CLI + Docker cho phép chạy **toàn bộ stack offline** với zero code change.

### Prerequisites

- Docker Desktop (2GB+ RAM)
- Node.js 18+, pnpm
- Sprints 1-7.5 complete (all migrations ready)

### Tasks — Part A: Local Development

| # | Task | Hours | Status |
|---|------|:-----:|:------:|
| 1 | Create `supabase/config.toml` (ports, auth, storage bucket) | 0.5h | ✅ |
| 2 | Move SQL files to `supabase/migrations/` (timestamped, single source of truth) | 0.5h | ✅ |
| 3 | Fix `handle_new_user()` trigger — add `SET search_path = public` | 0.5h | ✅ |
| 4 | Create `supabase/seed.sql` (demo family tree + auth users with bcrypt + auth.identities) | 1.5h | ✅ |
| 5 | Create `scripts/local-setup.mjs` (cross-platform Node.js setup script) | 1h | ✅ |
| 6 | Update `package.json` (`local:setup/start/stop/reset` scripts) | 0.25h | ✅ |
| 7 | Update `.env.local.example` (local-first defaults) | 0.25h | ✅ |
| 8 | Create `docs/04-build/LOCAL-DEVELOPMENT.md` (detailed guide) | 1h | ✅ |
| 9 | Update `README.md` + `CLAUDE.md` | 0.5h | ✅ |
| 10 | End-to-end test: `supabase start` → `pnpm dev` → login → browse | 0.5h | ✅ |

### Tasks — Part B: Security Hardening

> Tham khảo: https://anninhthudo.vn — rủi ro lộ lọc dữ liệu cá nhân trên các nền tảng gia phả Việt Nam

| # | Task | Issue | Hours | Status |
|---|------|-------|:-----:|:------:|
| 11 | Rename `proxy.ts` → `middleware.ts` (Next.js requires exact filename) | SEC-00: middleware was never executed | 0.25h | ✅ |
| 12 | Extend middleware `authRequiredPaths` to cover ALL `(main)` routes | SEC-01: only `/admin` + `/contributions` were protected | 0.25h | ✅ |
| 13 | Fix `profiles` RLS `SELECT USING (true)` → `auth.uid() IS NOT NULL` | SEC-02: any anonymous request could list all user emails + roles | 0.5h | ✅ |
| 14 | Fix `people` RLS: strip contact fields from public/anon reads + add admin-only policy | SEC-03: phone/email/zalo/address exposed to unauthenticated API calls | 0.5h | ✅ |
| 15 | Change `people.privacy_level` default `0` (public) → `1` (members only) | SEC-04: new entries accidentally public | 0.25h | ✅ |
| 16 | Backfill: set `privacy_level = 1` for living members with contact data | SEC-05: existing data protection | 0.25h | ✅ |
| 17 | Restrict `families`/`children`/`events`/`media` SELECT to authenticated users | SEC-06: structural data crawlable without login | 0.5h | ✅ |
| 18 | Add `CONTACT_FIELDS` constant in `supabase-data.ts` (code-level documentation) | Defense in depth | 0.25h | ✅ |
| 19 | Increase minimum password length 6 → 8 chars in register page | SEC-07: weak password policy | 0.25h | ✅ |
| 20 | Add migration `20260226000005_security_hardening.sql` | All DB-level fixes in one migration | 0.5h | ✅ |

### Acceptance Criteria

**Part A — Local Development:**
- [x] `pnpm local:setup` khởi chạy Docker containers + tạo `.env.local`
- [x] `pnpm dev` → login `admin@giapha.local` / `admin123` thành công
- [x] Cây gia phả hiển thị 15-20 thành viên demo
- [x] Tạo sự kiện, search thành viên, CRUD hoạt động bình thường
- [x] Supabase Studio (`http://localhost:54323`) truy cập được
- [x] `supabase db reset` xoá sạch + seed lại thành công
- [x] `pnpm build` vẫn pass (cloud mode không ảnh hưởng)

**Part B — Security Hardening:**
- [x] Middleware thực sự chạy (file được đặt tên đúng `middleware.ts`)
- [x] Người chưa đăng nhập không thể truy cập bất kỳ trang nào trong `(main)/`
- [x] API Supabase (REST) không trả về email/số điện thoại thành viên khi chưa đăng nhập
- [x] `profiles` table không bị liệt kê anon qua Supabase REST API
- [x] Thành viên mới tạo mặc định `privacy_level = 1` (members only)
- [x] Thành viên sống có contact data được backfill `privacy_level = 1`
- [x] Mật khẩu tối thiểu 8 ký tự khi đăng ký

### File Structure

```text
frontend/
├── supabase/
│   ├── config.toml                                      ✅ NEW (8A)
│   ├── seed.sql                                         ✅ NEW (8A)
│   └── migrations/
│       ├── 20260224000000_database_setup.sql            ✅ Moved (8A)
│       ├── 20260224000001_sprint6_migration.sql         ✅ Moved (8A)
│       ├── 20260224000002_cau_duong_migration.sql       ✅ Moved (8A)
│       ├── 20260224000003_sprint75_migration.sql        ✅ Moved (8A)
│       ├── 20260224000004_storage_setup.sql             ✅ Moved (8A)
│       └── 20260226000005_security_hardening.sql        ✅ NEW (8B)
├── scripts/
│   └── local-setup.mjs                                  ✅ NEW (8A)
├── src/
│   └── middleware.ts                                    ✅ Renamed from proxy.ts (8B)
├── package.json                                         ✅ Modified (8A)
└── .env.local.example                                   ✅ Modified (8A)
```

### Dependencies

- Requires: Docker Desktop running
- Requires: All migrations from Sprint 1-7.5

---

**Status:** ✅ Sprints 1-9 Complete (v2.0.0) | 🔄 Sprint 10 In Progress (v2.1.0)

*Updated: 2026-02-26 — Sprint 9 complete (Phase 1-3): Electron shell, sql.js SQLite shim, desktop build targets, ZIP export/import, first-run wizard, GitHub Actions, auto-update. Sprint 10 in progress: Landing page + community docs update.*

---

## 🏃 Sprint 9: Standalone Desktop App 🔄 (Phase 3 Complete)

**Dates:** TBD (22–34 days estimated)
**Goal:** Bản cài đặt "double-click" cho thành viên phi kỹ thuật — không cần Node.js, Docker, Supabase, hay terminal
**Version:** v2.0.0
**CTO Review:** ✅ v1 (7 issues resolved) → ✅ v2 Approved with 3 conditions

### Business Context

Target user: Thành viên dòng họ không rành kỹ thuật muốn dùng app mà không cần cài đặt stack dev.
Approach được chọn: **Electron + sql.js (WASM SQLite) Shim** — zero code change cho 79 data layer functions, offline, single-file DB.

### Architecture: Supabase Client Shim

```
Web mode:    supabase.from('people').select('*') → PostgREST HTTP → PostgreSQL
Desktop mode: supabase.from('people').select('*') → /api/desktop-db → sql.js SQLite
```

Data layer (5 files, 79 functions), hooks (7), pages/components (~40): **KHÔNG ĐỔI**.

```
┌─────────────────────────────────────────────────────────┐
│ Browser (Electron Renderer)                              │
│   sqlite-supabase-shim.ts → fetch('/api/desktop-db')    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (localhost)
┌──────────────────────────▼──────────────────────────────┐
│ Next.js Server (Node.js)                                 │
│   /api/desktop-db/ → query-builder → sql.js             │
│   /api/media/[...path] → local filesystem               │
└──────────────────────────┬──────────────────────────────┘
                           │
                   ancestortree.db (SQLite)
```

### Design Limitations (Documented)

- Desktop = **single-user admin** only — no multi-user, no RBAC
- Middleware server-side role check bypassed in desktop mode (documented, not a bug)

### CTO-Approved Prerequisites (3 conditions before Phase 2)

| # | Condition | Resolution | Status |
|---|-----------|------------|--------|
| A | sql.js persistence (in-memory, manual flush) | Singleton `getDatabase()` + `flushToDisk()` after every write + debounced flush + `.bak` before migration | ✅ Done (Phase 2) |
| B | Export format base64 won't scale (100MB+) | Switch to **ZIP archive**: `manifest.json` + `media/` folder (adm-zip, pure JS) | ✅ Done (Phase 3) |
| C | sql.js WASM loading in Next.js standalone | Verify Phase 1 (task 1.7) + fallback: sqljs-dist (inline WASM) | ✅ Done (Phase 1) |

### ADRs Required

| ADR | Title | Decision |
|-----|-------|----------|
| ADR-001 | SQLite adapter (sql.js vs better-sqlite3) | sql.js + `DbAdapter` interface for later swap |
| ADR-002 | desktop-db route decomposition | 4 files: route.ts / query-builder.ts / type-coerce.ts / rpc-handlers.ts |
| ADR-003 | Media export format | ZIP archive (not base64 JSON) |
| ADR-004 | `output: standalone` conditional | `process.env.ELECTRON_BUILD ? 'standalone' : undefined` |

### Phases

#### Phase 1: Electron Shell + Desktop Mode (2–3 ngày)

| # | Task | File | Status |
|---|------|------|--------|
| 1.1 | Electron + sql.js + electron-builder deps | `desktop/package.json` | ✅ |
| 1.2 | BrowserWindow, app lifecycle, migration runner | `desktop/electron/main.ts` | ✅ |
| 1.3 | Spawn Next.js standalone on random port | `desktop/electron/server.ts` | ✅ |
| 1.4 | Minimal context bridge | `desktop/electron/preload.ts` | ✅ |
| 1.5 | `output: 'standalone'` conditional | `frontend/next.config.ts` | ✅ |
| 1.6 | 3-line desktop bypass | `frontend/src/middleware.ts` | ✅ |
| **1.7** | **Verify sql.js WASM loads in standalone** (CTO condition C) | `public/` or `outputFileTracingIncludes` | ✅ |
| Gate | Electron launches → shows web app shell | | ✅ |

#### Phase 2: SQLite Shim — Core (12–18 ngày)

| # | Task | File | Lines | Status |
|---|------|------|-------|--------|
| 2.1 | Mock 8 auth methods | `sqlite-auth-shim.ts` | ~80 | ✅ |
| 2.2 | Storage → API routes serializer | `sqlite-storage-shim.ts` | ~80 | ✅ |
| 2.3 | Client query builder → JSON → fetch | `sqlite-supabase-shim.ts` | ~120 | ✅ |
| 2.4 | SQL executor: query-builder + type-coerce + rpc-handlers (ADR-002) | `api/desktop-db/` (4 files) | ~500 | ✅ |
| **2.4a** | **Singleton DB + `flushToDisk()` after every write** (CTO condition A) | `api/desktop-db/query-builder.ts` | ~50 | ✅ |
| 2.5 | Local file server + path traversal guard | `api/media/[...path]/route.ts` | ~50 | ✅ |
| 2.6 | Return shim in desktop mode | `frontend/src/lib/supabase.ts` | ~12 | ✅ |
| 2.7 | SQLite schema (13 tables, PG→SQLite types) | `sqlite-migrations/001_initial.sql` | ~200 | ✅ |
| 2.8 | Migration runner + `_migrations` table | `desktop/migrations/` | ~50 | ✅ |
| 2.9 | Integration tests: all 79 functions vs SQLite | `__tests__/shim-integration.test.ts` | ~300 | ✅ |
| Gate | All 79 functions pass, 13 routes working, CRUD + tree + cầu đương | | | ✅ |

#### Phase 3: Build & Distribution (5–8 ngày)

| # | Task | File | Status |
|---|------|------|--------|
| 3.1 | macOS .dmg, Windows .exe (NSIS), Linux .AppImage | `electron-builder.yml` | ✅ |
| 3.2 | App icons (3 formats) | `desktop/build/icon.*` | ✅ |
| 3.3 | First-run wizard (tên dòng họ, admin, import) | `(main)/setup/page.tsx` | ✅ |
| **3.4** | **ZIP export format** (CTO condition B) | Export/Import engine | ✅ |
| 3.5 | Code signing: macOS Apple Developer ($99/yr) | electron-builder.yml | ⏸ Deferred |
| 3.6 | Test installers on clean machine: macOS + Windows + Linux | | ⏳ |
| Gate | Install on clean machine → first-run wizard → full app working | | ⏳ |

#### Phase 4: Polish & Documentation (3–5 ngày)

| # | Task | Status |
|---|------|--------|
| 4.1 | Auto-update (electron-updater + GitHub Releases) | ✅ |
| 4.2 | Error handling, graceful shutdown, crash recovery | ⏳ |
| 4.3 | Update SDLC docs (BRD, TDD, Sprint Plan, Roadmap) | 🔄 |
| 4.4 | User guide tiếng Việt | ⏳ |
| 4.5 | GitHub Release với binaries (3 platforms) | 🔄 Workflow ready, push tag to trigger |

### Files Changed

**Modified (3 files):**

| File | Lines changed |
|------|---------------|
| `frontend/next.config.ts` | +1 (output: standalone conditional) |
| `frontend/src/middleware.ts` | +3 (desktop bypass) |
| `frontend/src/lib/supabase.ts` | +~12 (shim conditional) |

**New Files (~15 files, ~1,800 lines):**

```
frontend/src/lib/
  sqlite-supabase-shim.ts     (~120) Client query builder
  sqlite-auth-shim.ts         (~80)  Mock auth
  sqlite-storage-shim.ts      (~80)  Storage → API
frontend/src/app/api/
  desktop-db/
    route.ts                  (~80)  HTTP handler
    query-builder.ts          (~200) SQL builder + DB singleton + flush
    type-coerce.ts            (~80)  Boolean/JSONB/UUID
    error-mapper.ts           (~40)  PGRST116 shapes
    rpc-handlers.ts           (~100) is_person_in_subtree CTE
  media/[...path]/route.ts    (~50)  Local file server
frontend/sqlite-migrations/
  001_initial.sql             (~200) 13 tables SQLite
frontend/src/app/(main)/setup/page.tsx  (~100) First-run wizard
frontend/src/lib/__tests__/
  shim-integration.test.ts    (~300) 79 function coverage
desktop/
  electron/main.ts            (~120)
  electron/server.ts          (~80)
  electron/preload.ts         (~10)
  package.json                (~40)
  tsconfig.json               (~15)
  electron-builder.yml        (~40)
  migrations/001_initial.sql + runner (~50)
docs/02-design/ADR/           ADR-001 ~ ADR-004
```

**Unchanged:** All 50+ data layer, hooks, pages, components files.

### Acceptance Criteria

- [ ] Double-click installer (.dmg / .exe) installs and opens app
- [ ] First-run wizard: nhập tên dòng họ + admin → app immediately usable
- [ ] Tất cả 13 routes hoạt động offline (không có internet)
- [ ] CRUD people/families/events/achievements/fund/cầu đương hoạt động
- [ ] Cây gia phả + tìm kiếm hoạt động
- [ ] Export ZIP → Import vào web instance (data + media intact)
- [ ] Dữ liệu persist sau restart (`ancestortree.db`)
- [ ] Migration: install v1 → add data → update v2 → data preserved
- [ ] `pnpm build` (web mode) vẫn pass
- [ ] macOS install không có Gatekeeper warning

### Estimate

| Phase | Duration |
|-------|----------|
| Phase 1 | 2–3 ngày |
| Phase 2 | 12–18 ngày |
| Phase 3 | 5–8 ngày |
| Phase 4 | 3–5 ngày |
| **Total** | **22–34 ngày** |

---

## 🏃 Sprint 10: Landing Page — ancestortree.info 🔄

**Dates:** Feb 26, 2026+
**Goal:** Public landing page tại `ancestortree.info` — showcase, community support, download links
**Version:** v2.1.0
**CTO Review:** ✅ Approved with 5 conditions

### Business Context

Dự án cần một trang web công khai để:
1. Demo/giới thiệu app cho cộng đồng
2. Hỗ trợ người dùng — liên kết GitHub Issues/Discussions
3. Nhận góp ý sửa lỗi và đề xuất tính năng
4. Cung cấp link tải bản desktop (.dmg macOS, .exe Windows) cho người dùng phi kỹ thuật

### CTO Conditions (5)

| # | Condition | Resolution |
|---|-----------|------------|
| 1 | Version = v2.1.0 (not v1.8.0) | Sprint 9 = v2.0.0, Sprint 10 = v2.1.0 |
| 2 | Download links: no dead links | State B (pending) for launch, swap to State A after artifacts exist |
| 3 | Root layout wraps everything | Known limitation — `(landing)` inherits AuthProvider. Document, fix later |
| 4 | SEO: canonical + robots.txt | Add canonical URL + `public/robots.txt` |
| 5 | Offline claim correction | Fix "Does not work offline" in community docs |

### Approach

Add `(landing)` route group to existing Next.js app — reuse Tailwind 4, shadcn/ui, emerald theme. No separate project.

- Landing page at `/welcome` path (keeping `/` as authenticated homepage)
- Middleware updated: `/welcome` in publicPaths, check public paths FIRST
- Vercel custom domain: `ancestortree.info` → same deployment

### Tasks

| # | Task | Hours | Owner | Status |
|---|------|:-----:|:------|:------:|
| **Phase 1: Middleware + Route** | | | | |
| 1 | Update middleware — add `/welcome` to publicPaths, fix path matching | 0.5h | @fullstack | ✅ |
| 2 | Create `(landing)/layout.tsx` — standalone layout (no sidebar) | 0.5h | @fullstack | ⏳ |
| 3 | Create `(landing)/welcome/page.tsx` — 7 sections (hero, features, screenshots, download, community, developers, footer) | 2h | @fullstack | ⏳ |
| 4 | Add canonical URL metadata + `public/robots.txt` (CTO #4) | 0.5h | @fullstack | ⏳ |
| **Phase 2: Assets** | | | | |
| 5 | App screenshots (tree, people, admin, mobile) → `public/screenshots/` | 1h | @fullstack | ⏳ |
| 6 | OG social preview image → `public/og-landing.png` | 0.5h | @fullstack | ⏳ |
| **Phase 3: GitHub Templates** | | | | |
| 7 | Bug report template → `.github/ISSUE_TEMPLATE/bug_report.md` | 0.25h | @pm | ⏳ |
| 8 | Feature request template → `.github/ISSUE_TEMPLATE/feature_request.md` | 0.25h | @pm | ⏳ |
| **Phase 4: Community Docs** | | | | |
| 9 | Update 8 community docs v1.5.0 → v2.1.0 (desktop info, landing URL, offline fix) | 1.5h | @pm | ⏳ |
| **Phase 5: Domain** | | | | |
| 10 | Configure Vercel custom domain `ancestortree.info` + DNS CNAME | 0.5h | @pm | ⏳ |

### Page Sections

1. **Hero** — "Gia Phả Điện Tử" + tagline + CTAs: "Tải về máy tính" + "Mã nguồn GitHub"
2. **Features** — 8 cards (tree, lunar calendar, chi/nhánh, vinh danh, hương ước, cầu đương, relations, security)
3. **Screenshots** — 3-4 app screenshots (placeholder boxes if captures not ready)
4. **Download** — Windows (.exe) + macOS (.dmg) cards → GitHub Releases (State B: "Sắp có" until artifacts exist)
5. **Community** — Báo lỗi + Đề xuất tính năng + Thảo luận (→ GitHub Issues/Discussions)
6. **For Developers** — MIT license, fork & deploy 30 min, tech stack
7. **Footer** — GitHub, MTS, TinySDLC links, version

### File Structure

```text
frontend/
├── public/
│   ├── robots.txt                              NEW (S10)
│   ├── og-landing.png                          NEW (S10)
│   └── screenshots/                            NEW (S10)
│       ├── tree-view.png
│       ├── people-list.png
│       ├── admin-panel.png
│       └── mobile-view.png
├── src/app/
│   └── (landing)/
│       ├── layout.tsx                          NEW (S10)
│       └── welcome/
│           └── page.tsx                        NEW (S10)
└── src/middleware.ts                            MODIFIED (S10)

.github/ISSUE_TEMPLATE/
├── bug_report.md                               NEW (S10)
└── feature_request.md                          NEW (S10)
```

### Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-S10-01 | `/welcome` loads without login — 9 sections visible | ✅ |
| AC-S10-02 | `/` still redirects to login (existing behavior preserved) | ✅ |
| AC-S10-03 | Download links point to GitHub Releases (.exe, .dmg) | ✅ |
| AC-S10-04 | Community links to GitHub Issues/Discussions work | ✅ |
| AC-S10-05 | canonical URL set to `https://ancestortree.info/welcome` | ✅ |
| AC-S10-06 | `robots.txt` disallows auth/app pages, allows `/welcome` | ✅ |
| AC-S10-07 | Mobile responsive (375px, 768px, 1024px) | ✅ |
| AC-S10-08 | 8 community docs updated to v2.1.0 with landing URL + desktop info | ✅ |
| AC-S10-09 | `pnpm build` passes without errors | ✅ |

### Dependencies

- Requires: Sprint 9 complete (desktop build targets for download links) ✅
- Requires: Vercel account with custom domain support ✅
- Requires: Domain `ancestortree.info` configured on Vercel ✅

---

## Sprint 11 — Kho tài liệu (v2.2.0) 📋

**Status:** Planned — community contribution hoặc owner implement khi có thời gian
**Goal:** Lưu trữ tài liệu, ảnh cũ, giấy tờ, video — kho ký ức dòng họ
**Ước lượng:** ~4-6 giờ (theo pattern Sprint 6 — CRUD module)

### Tasks

| # | Task | Est. | Owner | Status |
| --- | --- | --- | --- | --- |
| S11-01 | DB: Bảng `clan_documents` + RLS policies | 30m | @dev | ✅ |
| S11-02 | Types: `ClanDocument`, `DocumentCategory` interfaces in `types/index.ts` | 15m | @dev | ✅ |
| S11-03 | Data layer: `supabase-data-documents.ts` — CRUD + search + filter by category | 45m | @dev | ✅ |
| S11-04 | Hooks: `use-documents.ts` — React Query hooks | 30m | @dev | ✅ |
| S11-05 | Storage: File upload helper (Supabase + Desktop mode) | 30m | @dev | ✅ |
| S11-06 | Public page: `/documents/library` gallery view + category filter + search | 60m | @dev | ✅ |
| S11-07 | Admin page: `/admin/documents` — CRUD + file upload + delete confirmation | 45m | @dev | ✅ |
| S11-08 | Sidebar: "QL Tài liệu" admin nav item | 5m | @dev | ✅ |
| S11-09 | Desktop: SQLite table `003-clan-documents.sql` + shim support | 30m | @dev | ✅ |
| S11-10 | Build & verify (Kho tài liệu) — 36 routes, 0 errors | 15m | @dev | ✅ |
| S11-11 | In-App Help Page: `/help` — 5 sections + Desktop conditional | 60m | @dev | ✅ |
| S11-12 | Sidebar: Add "Hướng dẫn" nav item (HelpCircle icon) | 5m | @dev | ✅ |
| S11-13 | Middleware: Add `/help` to authRequiredPaths | 5m | @dev | ✅ |
| S11-14 | Build & verify (Help page) | 10m | @dev | ✅ |

### Categories

| Category | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| **Ảnh lịch sử** | Ảnh cũ, ảnh gia đình | Ảnh thủy tổ, ảnh nhà thờ 1960 |
| **Giấy tờ** | Văn bản, giấy khen | Gia phả viết tay, sắc phong |
| **Bản đồ** | Bản đồ địa phương | Bản đồ làng, sơ đồ nhà thờ |
| **Video** | Video sự kiện | Lễ giỗ tổ, họp họ, phóng sự |
| **Bài viết** | Lịch sử, hồi ký | Lịch sử dòng họ, hồi ức |
| **Khác** | Tài liệu khác | Nhạc lễ, bản thiết kế |

### Acceptance Criteria

| ID | Criteria | Status |
| --- | --- | --- |
| AC-S11-01 | `/help` page renders 5 sections (điều hướng, workflow, phân quyền, mẹo, FAQ) | ✅ |
| AC-S11-02 | Desktop mode shows backup guide + Desktop vs Web table | ✅ |
| AC-S11-03 | Sidebar shows "Hướng dẫn" with HelpCircle icon | ✅ |
| AC-S11-04 | Unauthenticated → `/help` redirects to `/welcome` | ✅ |
| AC-S11-05 | Upload tài liệu (ảnh, PDF) hoạt động | ✅ |
| AC-S11-06 | Gallery view với filter theo category | ✅ |
| AC-S11-07 | Admin CRUD + file upload + delete confirmation | ✅ |
| AC-S11-08 | Desktop mode hỗ trợ đầy đủ (Kho tài liệu) | ✅ |
| AC-S11-09 | `pnpm build` passes (36 routes, 0 errors) | ✅ |

---

## Sprint 12 — Bảo mật & Xác nhận thành viên (v2.3.0) 🚧

**Status:** IN PROGRESS
**Goal:** Tăng cường bảo mật thông tin cá nhân, xác nhận email & thành viên, sub-admin
**Ước lượng:** ~2-3 ngày
**Spec:** [SPRINT-12-SPEC.md](./SPRINT-12-SPEC.md)

> 💡 **Từ phản hồi cộng đồng:** Cần bảo mật thông tin cá nhân thành viên hơn —
> viewer chỉ nên thấy thông tin công khai, đăng ký cần xác nhận email + admin duyệt.

### Tasks

| # | Task | Est. | Owner |
| --- | --- | --- | --- |
| S12-01 | Migration SQL: profiles (is_verified, can_verify_members) + documents (privacy_level) + RLS | 30m | @coder |
| S12-02 | Supabase config: enable email confirmations | 5m | @coder |
| S12-03 | Fix person form privacy default (0→1) | 5m | @coder |
| S12-04 | Types: Profile + ClanDocument new fields | 10m | @coder |
| S12-05 | Data layer: verify/unverified functions | 20m | @coder |
| S12-06 | Auth provider: isVerified context | 10m | @coder |
| S12-07 | Hooks: verification hooks (useVerifyUser, useUnverifiedProfiles) | 15m | @coder |
| S12-08 | Middleware: is_verified check + /pending-verification page | 30m | @coder |
| S12-09 | Sidebar: hide "Danh bạ" for viewer | 10m | @coder |
| S12-10 | People list: hide "Thêm mới" for viewer | 5m | @coder |
| S12-11 | Person detail: useCanEditPerson + hide contacts for viewer | 20m | @coder |
| S12-12 | Directory: mask zalo/facebook + viewer restrictions | 15m | @coder |
| S12-13 | Admin Users: verification controls + sub-admin | 60m | @coder |
| S12-14 | Admin Documents: privacy selector | 15m | @coder |
| S12-15 | Document Library: privacy badge | 10m | @coder |
| S12-16 | Register: email verification success card | 15m | @coder |
| S12-17 | Admin Users: suspend/unsuspend accounts (migration 20260228000009) | 30m | @coder |
| S12-18 | Admin Users: delete accounts permanently (server action) | 20m | @coder |
| S12-19 | Profile type: add is_suspended, suspension_reason fields | 10m | @coder |

### Acceptance Criteria

| ID | Criteria | Status |
| --- | --- | --- |
| AC-S12-01 | Đăng ký → email xác nhận (Supabase native) | ⏳ |
| AC-S12-02 | Login khi is_verified=false → redirect /pending-verification | ⏳ |
| AC-S12-03 | Admin → /admin/users → "Chờ duyệt" badge + nút "Xác nhận" | ⏳ |
| AC-S12-04 | Viewer sidebar: không thấy "Danh bạ" | ⏳ |
| AC-S12-05 | Viewer → /people/:id → không thấy card liên hệ | ⏳ |
| AC-S12-06 | Viewer → /directory → contacts masked (kể cả zalo/facebook) | ⏳ |
| AC-S12-07 | Upload tài liệu với privacy_level → viewer chỉ thấy public+members | ⏳ |
| AC-S12-08 | Sub-admin (editor+can_verify) chỉ verify users trong subtree | ⏳ |
| AC-S12-09 | Person detail uses useCanEditPerson hook (branch-aware) | ⏳ |
| AC-S12-10 | Desktop mode hoạt động bình thường (auto-verified) | ⏳ |
| AC-S12-11 | `pnpm build` passes | ⏳ |
| AC-S12-12 | Admin suspend user → user bị đình chỉ, không đăng nhập được | ⏳ |
| AC-S12-13 | Admin unsuspend user → user đăng nhập bình thường | ⏳ |
| AC-S12-14 | Admin delete user → xóa vĩnh viễn khỏi auth + profiles | ⏳ |

---

## Sprint 13 — Góc giao lưu (v2.4.0) 📋

**Status:** Planned — community contribution hoặc owner implement khi có thời gian
**Goal:** Không gian chia sẻ cho người trẻ + Việt kiều — gửi ảnh quê, giao lưu
**Ước lượng:** ~6-8 giờ

> 💡 **Từ phản hồi người dùng:** "Người trẻ cũng nhiều, đi khắp trong nước, có cả nước ngoài.
> Có box giao lưu thi thoảng gửi cái ảnh ở quê cho người xa nhà."

### Tasks

| # | Task | Est. | Owner |
| --- | --- | --- | --- |
| S13-01 | DB: Bảng `posts` (author_id, content, images[], created_at) + RLS | 30m | @dev |
| S13-02 | DB: Bảng `post_comments` + `post_reactions` | 30m | @dev |
| S13-03 | Types + Data layer + Hooks | 60m | @dev |
| S13-04 | Feed page: `/feed` — timeline, create post, multi-image upload | 90m | @dev |
| S13-05 | Comments + Reactions UI | 60m | @dev |
| S13-06 | Admin: Moderation — ẩn/xóa bài không phù hợp | 30m | @dev |
| S13-07 | Desktop: SQLite tables + migrations | 30m | @dev |
| S13-08 | Build & verify | 15m | @dev |

### Backlog — Bulk Admin Actions (deferred)

> **CTO Review Decision (2026-03-01):** Bulk user actions (mass suspend / delete / unverify)
> were proposed during Sprint 12 but **rejected** due to security and architecture concerns:
>
> - ISS-01: No undo for permanent delete — bulk amplifies damage
> - ISS-02: Service-role key bypass via client-side API is too risky at scale
> - ISS-03: No server-side authorization on API routes (only client-side role check)
> - ISS-04: Frontend-only batch loop (N sequential API calls) — no transactional guarantee
> - ISS-05: Scope creep — current user count (~30) doesn't justify the engineering
> - ISS-06: Better handled by a one-time SQL migration for existing data cleanup
>
> **Resolution:** One-time cleanup of legacy viewer accounts via SQL migration.
> Bulk actions will be properly scoped in Sprint 13+ **only if needed**, with:
>
> - Full FR (Functional Requirements) spec
> - Server-side batch API endpoint (single transaction)
> - Service-role authorization with audit logging
> - Confirmation dialogs with explicit count + action preview
> - Undo/soft-delete instead of permanent delete
>
> See also: `docs/backend/SECURE-CODING-REVIEW.md`

---

## Sprint 14 — Thông báo & Nhắc nhở (v2.5.0) 📋

**Status:** Planned
**Goal:** Email nhắc ngày giỗ, thông báo sự kiện mới
**Ước lượng:** ~4-6 giờ

### S14 Tasks

| # | Task | Est. | Owner |
| --- | --- | --- | --- |
| S14-01 | Email service: Supabase Edge Function + Resend/SendGrid | 60m | @dev |
| S14-02 | DB: Bảng `notification_preferences` (user_id, type, enabled) | 15m | @dev |
| S14-03 | Giỗ reminders: Cron job gửi email 3 ngày trước ngày giỗ | 60m | @dev |
| S14-04 | Event alerts: Thông báo sự kiện mới, bài viết mới | 30m | @dev |
| S14-05 | Preferences page: UI cài đặt on/off per notification type | 30m | @dev |
| S14-06 | In-app notifications: Bell icon + dropdown (optional) | 45m | @dev |
| S14-07 | Build & verify | 15m | @dev |

---

## Sprint 15 — Export/Import & Đồng bộ (v2.6.0) 📋

**Status:** Planned
**Goal:** Chuyển dữ liệu Desktop ↔ Web, GEDCOM import, CSV export
**Ước lượng:** ~4-6 giờ

### S15 Tasks

| # | Task | Est. | Owner |
| --- | --- | --- | --- |
| S15-01 | ZIP export: DB + media → .zip file (Desktop) | 60m | @dev |
| S15-02 | ZIP import: Restore từ .zip file | 60m | @dev |
| S15-03 | GEDCOM import: Parse .ged → tạo people + families | 90m | @dev |
| S15-04 | CSV export: Danh sách thành viên → Excel/CSV | 30m | @dev |
| S15-05 | Desktop → Web sync: Guide + migration script | 30m | @dev |
| S15-06 | Build & verify | 15m | @dev |

---

## Sprint 16+ — Nhà thờ họ & Cộng đồng (v3.0.0) 📋

**Status:** Future — Q2-Q3 2026
**Goal:** Mở rộng cho cộng đồng rộng hơn

### Features (chưa chi tiết)

| Feature | Mô tả | Priority |
| --- | --- | --- |
| **Nhà thờ họ** | Thông tin, bản đồ, ảnh 360°, lịch sử | P2 |
| **Đa ngôn ngữ** | English UI cho Việt kiều (next-intl) | P2 |
| **Cross-clan** | Kết nối liên dòng họ, shared events | P3 |
| **Multi-tenant SaaS** | Nhiều dòng họ trên 1 instance — tenant isolation, onboarding, billing | P3 |
| **PWA Mobile** | Progressive Web App cho điện thoại | P2 |

> **Multi-tenant SaaS Note (2026-03-01):**
> Hiện tại [ancestortree.info](https://ancestortree.info) chỉ phục vụ riêng chi tộc Đặng Đình,
> Thạch Lâm, Hà Tĩnh — không phải SaaS platform. Nếu có thời gian, sẽ phát triển thành
> multi-tenant platform cho nhiều dòng họ. Yêu cầu:
>
> - Tenant isolation (DB schema per tenant hoặc RLS-based)
> - Onboarding flow (tạo dòng họ mới, invite thành viên)
> - Custom branding per tenant (tên dòng họ, logo, màu sắc)
> - Billing & subscription (nếu SaaS thương mại)
> - Admin dashboard per tenant vs super-admin cross-tenant

---

*SDLC Framework 6.1.1 - Stage 04 Build*
