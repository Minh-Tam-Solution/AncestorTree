---
project: AncestorTree
path: docs/02-design/technical-design.md
type: design
version: 2.1.0
updated: 2026-02-26
owner: "@dev-team"
status: approved
---

# Technical Design Document (TDD)

## 1. Document Control

| Version | Date       | Author    | Changes                                           |
|---------|------------|-----------|---------------------------------------------------|
| 1.0.0   | 2026-02-24 | @dev-team | Initial draft                                     |
| 1.1.0   | 2026-02-25 | @pm       | Add Vinh danh, Quỹ khuyến học, Hương ước         |
| 1.2.0   | 2026-02-25 | @architect | Update to match actual implementation (S1-S6)    |
| 1.3.0   | 2026-02-25 | @architect | Add Cầu đương tables + DFS rotation algorithm (Sprint 7) |
| 1.4.0   | 2026-02-26 | @architect | Add Local Development Mode — Supabase CLI + Docker (Sprint 8) |
| 1.5.0   | 2026-02-26 | @architect | Add Desktop App Architecture — Electron + sql.js Shim (Sprint 9 Phase 1) |
| 2.1.0   | 2026-02-26 | @pm        | Add Landing Page route group + SEO architecture (Sprint 10) |
| 2.2.0   | 2026-02-27 | @pm        | Add In-App Help Page `/help` route (Sprint 11)    |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│   │   Desktop   │    │   Mobile    │    │   Tablet    │                │
│   │   Browser   │    │   Browser   │    │   Browser   │                │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │
│          │                  │                  │                        │
│          └──────────────────┼──────────────────┘                        │
│                             │                                           │
│                             ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                     NEXT.JS APPLICATION                          │  │
│   │  ┌───────────────────────────────────────────────────────────┐  │  │
│   │  │                    React Components                        │  │  │
│   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │  │
│   │  │  │  Tree   │ │ Profile │ │ Search  │ │  Admin Panel    │  │  │  │
│   │  │  │  View   │ │  Page   │ │  Page   │ │                 │  │  │  │
│   │  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │  │  │
│   │  └───────────────────────────────────────────────────────────┘  │  │
│   │                                                                  │  │
│   │  ┌───────────────────────────────────────────────────────────┐  │  │
│   │  │                    State Management                        │  │  │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │  │
│   │  │  │ React Query │  │ Auth Context│  │  Local State    │   │  │  │
│   │  │  │   Cache     │  │  (useAuth)  │  │  (component)   │   │  │  │
│   │  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │  │
│   │  └───────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                             │                                           │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│   │    Auth     │    │  Database   │    │   Storage   │                │
│   │  (GoTrue)   │    │ (PostgreSQL)│    │   (S3-like) │                │
│   └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐                                   │
│   │  Realtime   │    │  Edge Func  │                                   │
│   │ (WebSocket) │    │  (Deno)     │                                   │
│   └─────────────┘    └─────────────┘                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            VERCEL                                        │
├─────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│   │    Edge     │    │   Build     │    │   CDN       │                │
│   │   Network   │    │   System    │    │   Cache     │                │
│   └─────────────┘    └─────────────┘    └─────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | Next.js 16 | SSR, App Router, performance |
| **Language** | TypeScript 5 | Type safety, maintainability |
| **Styling** | Tailwind CSS 4 | Utility-first, responsive |
| **UI Components** | shadcn/ui | Accessible, customizable |
| **State Management** | React Context + React Query | Auth context, server state cache |
| **Form Handling** | react-hook-form + Zod 4 | Validation, type-safe forms |
| **Backend** | Supabase | Auth, DB, Storage in one |
| **Database** | PostgreSQL | Relational, ACID, powerful |
| **Hosting** | Vercel | Free, auto-deploy, edge |

---

## 3. Database Design

### 3.0 Migration Strategy

> All migration files nằm trong `frontend/supabase/migrations/` (Supabase CLI format, timestamped):
>
> | File | Tables |
> |------|--------|
> | `20260224000000_database_setup.sql` | people, families, children, profiles, contributions, events, media |
> | `20260224000001_sprint6_migration.sql` | achievements, fund_transactions, scholarships, clan_articles |
> | `20260224000002_cau_duong_migration.sql` | cau_duong_pools, cau_duong_assignments |
> | `20260224000003_sprint75_migration.sql` | profiles.edit_root_person_id + is_person_in_subtree() |
> | `20260224000004_storage_setup.sql` | Storage bucket `media` + RLS policies |
>
> **Cloud:** Chạy thủ công trên Supabase SQL Editor.
> **Local:** Tự động chạy khi `supabase start` (Supabase CLI + Docker).
>
> See [SPRINT-PLAN.md](../04-build/SPRINT-PLAN.md) and [LOCAL-DEVELOPMENT.md](../04-build/LOCAL-DEVELOPMENT.md).

### 3.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│                 people                    │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│    │ handle          VARCHAR(50) UNIQUE │
│    │ display_name    VARCHAR(255)       │
│    │ first_name      VARCHAR(100)       │
│    │ middle_name     VARCHAR(100)       │
│    │ surname         VARCHAR(100)       │
│    │ gender          SMALLINT (1=M,2=F) │
│    │ generation      INTEGER            │
│    │ chi             INTEGER            │
│    │ birth_date      DATE               │
│    │ birth_year      INTEGER            │
│    │ birth_place     VARCHAR(255)       │
│    │ death_date      DATE               │
│    │ death_year      INTEGER            │
│    │ death_place     VARCHAR(255)       │
│    │ death_lunar     VARCHAR(20)        │◄── Ngày giỗ âm lịch
│    │ is_living       BOOLEAN            │
│    │ is_patrilineal  BOOLEAN            │◄── Chính tộc
│    │ phone           VARCHAR(20)        │
│    │ email           VARCHAR(255)       │
│    │ zalo            VARCHAR(50)        │
│    │ facebook        VARCHAR(255)       │
│    │ address         TEXT               │
│    │ hometown        VARCHAR(255)       │
│    │ occupation      VARCHAR(255)       │
│    │ biography       TEXT               │
│    │ notes           TEXT               │
│    │ avatar_url      TEXT               │
│    │ privacy_level   SMALLINT           │
│    │ created_at      TIMESTAMPTZ        │
│    │ updated_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────┐
│               families                    │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│    │ handle          VARCHAR(50) UNIQUE │
│ FK │ father_id       UUID → people      │
│ FK │ mother_id       UUID → people      │
│    │ marriage_date   DATE               │
│    │ marriage_place  VARCHAR(255)       │
│    │ divorce_date    DATE               │
│    │ notes           TEXT               │
│    │ sort_order      INTEGER            │
│    │ created_at      TIMESTAMPTZ        │
│    │ updated_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────┐
│              children                     │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│ FK │ family_id       UUID → families    │
│ FK │ person_id       UUID → people      │
│    │ sort_order      INTEGER            │◄── Thứ tự con
│    │ created_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│               profiles                    │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│ FK │ user_id         UUID → auth.users  │
│    │ email           VARCHAR(255)       │
│    │ full_name       VARCHAR(255)       │
│    │ role            VARCHAR(20)        │◄── 'admin' | 'editor' | 'viewer'
│ FK │ linked_person   UUID → people      │◄── Link to family member
│    │ avatar_url      TEXT               │
│    │ created_at      TIMESTAMPTZ        │
│    │ updated_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            contributions                  │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│ FK │ author_id       UUID → profiles    │
│ FK │ target_person   UUID → people      │
│    │ change_type     VARCHAR(20)        │◄── 'create'|'update'|'delete'
│    │ changes         JSONB              │◄── Diff of changes
│    │ reason          TEXT               │
│    │ status          VARCHAR(20)        │◄── 'pending'|'approved'|'rejected'
│ FK │ reviewed_by     UUID → profiles    │
│    │ reviewed_at     TIMESTAMPTZ        │
│    │ review_notes    TEXT               │
│    │ created_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│              media                        │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│ FK │ person_id       UUID → people      │
│    │ type            VARCHAR(20)        │◄── 'photo'|'document'|'video'
│    │ url             TEXT               │
│    │ caption         TEXT               │
│    │ is_primary      BOOLEAN            │
│    │ sort_order      INTEGER            │
│    │ created_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│              events                       │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│    │ title           VARCHAR(255)       │
│    │ description     TEXT               │
│    │ event_date      DATE               │
│    │ event_lunar     VARCHAR(20)        │◄── Ngày âm lịch
│    │ event_type      VARCHAR(50)        │◄── 'gio'|'hop_ho'|'le_tet'
│ FK │ person_id       UUID → people      │◄── For giỗ
│    │ location        VARCHAR(255)       │
│    │ recurring       BOOLEAN            │◄── Yearly recurring
│    │ created_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            achievements                  │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│ FK │ person_id       UUID → people      │◄── Người được vinh danh
│    │ title           VARCHAR(255)       │◄── Tên thành tích
│    │ category        VARCHAR(50)        │◄── 'hoc_tap'|'su_nghiep'|'cong_hien'|'other'
│    │ description     TEXT               │
│    │ year            INTEGER            │◄── Năm đạt thành tích
│    │ awarded_by      VARCHAR(255)       │◄── Đơn vị trao tặng
│    │ is_featured     BOOLEAN            │◄── Hiển thị nổi bật
│    │ created_at      TIMESTAMPTZ        │
│    │ updated_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│          fund_transactions               │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│    │ type            VARCHAR(20)        │◄── 'income'|'expense'
│    │ category        VARCHAR(50)        │◄── 'dong_gop'|'hoc_bong'|'khen_thuong'|'other'
│    │ amount          DECIMAL(12,0)      │◄── Số tiền (VND)
│    │ donor_name      VARCHAR(255)       │◄── Tên người đóng góp (income)
│ FK │ donor_person_id UUID → people      │◄── Link tới thành viên (optional)
│ FK │ recipient_id    UUID → people      │◄── Người nhận (expense)
│    │ description     TEXT               │
│    │ transaction_date DATE              │
│    │ academic_year   VARCHAR(20)        │◄── Năm học: "2025-2026"
│    │ created_by      UUID → profiles   │◄── Admin tạo
│    │ created_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            scholarships                  │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│ FK │ person_id       UUID → people      │◄── Người được cấp
│    │ type            VARCHAR(20)        │◄── 'hoc_bong'|'khen_thuong'
│    │ amount          DECIMAL(12,0)      │◄── Số tiền
│    │ reason          TEXT               │◄── Lý do cấp
│    │ academic_year   VARCHAR(20)        │◄── Năm học
│    │ school          VARCHAR(255)       │◄── Trường đang học
│    │ grade_level     VARCHAR(50)        │◄── Lớp/bậc học
│    │ status          VARCHAR(20)        │◄── 'pending'|'approved'|'paid'
│    │ approved_by     UUID → profiles   │
│    │ approved_at     TIMESTAMPTZ        │
│    │ created_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│          clan_articles                   │
├──────────────────────────────────────────┤
│ PK │ id              UUID               │
│    │ title           VARCHAR(255)       │◄── Tiêu đề bài viết
│    │ content         TEXT               │◄── Nội dung (markdown)
│    │ category        VARCHAR(50)        │◄── 'gia_huan'|'quy_uoc'|'loi_dan'
│    │ sort_order      INTEGER            │◄── Thứ tự hiển thị
│    │ is_featured     BOOLEAN            │◄── Hiển thị trên trang chủ
│    │ author_id       UUID → profiles   │◄── Người viết
│    │ created_at      TIMESTAMPTZ        │
│    │ updated_at      TIMESTAMPTZ        │
└──────────────────────────────────────────┘
```

### 3.2 Table Details

#### 3.2.1 `people` Table

```sql
CREATE TABLE people (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle          VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    middle_name     VARCHAR(100),
    surname         VARCHAR(100),
    gender          SMALLINT CHECK (gender IN (1, 2)), -- 1=Male, 2=Female
    generation      INTEGER NOT NULL DEFAULT 1,
    chi             INTEGER, -- Chi/nhánh number
    
    -- Birth
    birth_date      DATE,
    birth_year      INTEGER,
    birth_place     VARCHAR(255),
    
    -- Death
    death_date      DATE,
    death_year      INTEGER,
    death_place     VARCHAR(255),
    death_lunar     VARCHAR(20), -- Lunar date string: "15/7" (15 tháng 7 âm)
    
    -- Status
    is_living       BOOLEAN DEFAULT true,
    is_patrilineal  BOOLEAN DEFAULT true, -- Chính tộc
    
    -- Contact
    phone           VARCHAR(20),
    email           VARCHAR(255),
    zalo            VARCHAR(50),
    facebook        VARCHAR(255),
    address         TEXT,
    hometown        VARCHAR(255),
    
    -- Bio
    occupation      VARCHAR(255),
    biography       TEXT,
    notes           TEXT,
    avatar_url      TEXT,
    
    -- Privacy: 0=public, 1=members only, 2=private
    privacy_level   SMALLINT DEFAULT 0,
    
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_people_surname ON people(surname);
CREATE INDEX idx_people_generation ON people(generation);
CREATE INDEX idx_people_chi ON people(chi);
CREATE INDEX idx_people_display_name ON people USING GIN(to_tsvector('simple', display_name));
```

#### 3.2.2 `families` Table

```sql
CREATE TABLE families (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle          VARCHAR(50) UNIQUE NOT NULL,
    father_id       UUID REFERENCES people(id) ON DELETE SET NULL,
    mother_id       UUID REFERENCES people(id) ON DELETE SET NULL,
    marriage_date   DATE,
    marriage_place  VARCHAR(255),
    divorce_date    DATE,
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_families_father ON families(father_id);
CREATE INDEX idx_families_mother ON families(mother_id);
```

#### 3.2.3 `children` Table (Junction)

```sql
CREATE TABLE children (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    sort_order      INTEGER DEFAULT 0, -- Birth order
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(family_id, person_id)
);

-- Indexes
CREATE INDEX idx_children_family ON children(family_id);
CREATE INDEX idx_children_person ON children(person_id);
```

#### 3.2.4 `achievements` Table (v1.1)

```sql
CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL CHECK (category IN ('hoc_tap', 'su_nghiep', 'cong_hien', 'other')),
    description     TEXT,
    year            INTEGER,
    awarded_by      VARCHAR(255),
    is_featured     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_achievements_person ON achievements(person_id);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_year ON achievements(year);
```

#### 3.2.5 `fund_transactions` Table (v1.1)

```sql
CREATE TABLE fund_transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type              VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category          VARCHAR(50) NOT NULL CHECK (category IN ('dong_gop', 'hoc_bong', 'khen_thuong', 'other')),
    amount            DECIMAL(12, 0) NOT NULL CHECK (amount > 0),
    donor_name        VARCHAR(255),          -- For income: donor display name
    donor_person_id   UUID REFERENCES people(id) ON DELETE SET NULL,
    recipient_id      UUID REFERENCES people(id) ON DELETE SET NULL,
    description       TEXT,
    transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    academic_year     VARCHAR(20),           -- e.g. "2025-2026"
    created_by        UUID REFERENCES profiles(id),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fund_tx_type ON fund_transactions(type);
CREATE INDEX idx_fund_tx_category ON fund_transactions(category);
CREATE INDEX idx_fund_tx_date ON fund_transactions(transaction_date);
CREATE INDEX idx_fund_tx_academic_year ON fund_transactions(academic_year);
```

#### 3.2.6 `scholarships` Table (v1.1)

```sql
CREATE TABLE scholarships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('hoc_bong', 'khen_thuong')),
    amount          DECIMAL(12, 0) NOT NULL CHECK (amount > 0),
    reason          TEXT,
    academic_year   VARCHAR(20) NOT NULL,    -- e.g. "2025-2026"
    school          VARCHAR(255),
    grade_level     VARCHAR(50),             -- e.g. "Lớp 10", "Đại học năm 3"
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_by     UUID REFERENCES profiles(id),
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scholarships_person ON scholarships(person_id);
CREATE INDEX idx_scholarships_type ON scholarships(type);
CREATE INDEX idx_scholarships_status ON scholarships(status);
CREATE INDEX idx_scholarships_year ON scholarships(academic_year);
```

#### 3.2.7 `clan_articles` Table (v1.1)

```sql
CREATE TABLE clan_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,            -- Markdown content
    category        VARCHAR(50) NOT NULL CHECK (category IN ('gia_huan', 'quy_uoc', 'loi_dan')),
    sort_order      INTEGER DEFAULT 0,
    is_featured     BOOLEAN DEFAULT false,    -- Show on homepage
    author_id       UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clan_articles_category ON clan_articles(category);
CREATE INDEX idx_clan_articles_sort ON clan_articles(sort_order);
```

#### 3.2.8 `cau_duong_pools` Table (v1.2)

Configuration for a ceremony rotation group. Each pool is anchored to a root ancestor and defines eligibility criteria.

```sql
CREATE TABLE cau_duong_pools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,    -- VD: "Nhánh ông Đặng Đình Nhân"
    ancestor_id     UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
    min_generation  INTEGER NOT NULL DEFAULT 1,  -- Đời tối thiểu (VD: 12)
    max_age_lunar   INTEGER NOT NULL DEFAULT 70, -- Tuổi âm tối đa (mặc định: dưới 70)
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cau_duong_pools_ancestor ON cau_duong_pools(ancestor_id);
```

#### 3.2.9 `cau_duong_assignments` Table (v1.2)

One row per ceremony per year. Tracks rotation position, delegation, and completion status.

```sql
CREATE TABLE cau_duong_assignments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id                 UUID NOT NULL REFERENCES cau_duong_pools(id) ON DELETE CASCADE,
    year                    INTEGER NOT NULL,
    ceremony_type           VARCHAR(30) NOT NULL CHECK (
                                ceremony_type IN ('tet', 'ram_thang_gieng', 'gio_to', 'ram_thang_bay')
                            ),
    host_person_id          UUID REFERENCES people(id) ON DELETE SET NULL,
    actual_host_person_id   UUID REFERENCES people(id) ON DELETE SET NULL,
    status                  VARCHAR(20) DEFAULT 'scheduled' CHECK (
                                status IN ('scheduled', 'completed', 'delegated', 'rescheduled', 'cancelled')
                            ),
    scheduled_date          DATE,
    actual_date             DATE,
    reason                  TEXT,      -- Lý do ủy quyền / đổi ngày
    notes                   TEXT,
    rotation_index          INTEGER,   -- Vị trí trong DFS list khi phân công
    created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(pool_id, year, ceremony_type)
);

CREATE INDEX idx_cau_duong_assignments_pool   ON cau_duong_assignments(pool_id);
CREATE INDEX idx_cau_duong_assignments_year   ON cau_duong_assignments(year);
CREATE INDEX idx_cau_duong_assignments_host   ON cau_duong_assignments(host_person_id);
CREATE INDEX idx_cau_duong_assignments_status ON cau_duong_assignments(status);
```

**Ceremony types and Vietnamese calendar dates:**

| ceremony_type | Vietnamese Name | Âm lịch | Approx. Solar |
|---------------|----------------|---------|---------------|
| `tet` | Tết Nguyên Đán | 1/1 AL | Jan-Feb |
| `ram_thang_gieng` | Rằm tháng Giêng | 15/1 AL | Feb |
| `gio_to` | Giỗ tổ Can Thăng | 15/3 AL | Apr |
| `ram_thang_bay` | Rằm tháng Bảy | 15/7 AL | Aug |

**Status lifecycle:**

```
scheduled → completed   (thực hiện thành công)
scheduled → delegated   (ủy quyền cho người khác)
scheduled → rescheduled (đổi ngày)
scheduled → cancelled   (hủy)
```

#### 3.2.10 Cầu đương DFS Rotation Algorithm

The rotation order is determined by a Depth-First Search (DFS preorder) traversal of the family tree starting from the pool's `ancestor_id`. This mirrors the Vietnamese tradition of respecting generational seniority.

```typescript
// Pseudocode for buildDFSOrder()
function buildDFSOrder(ancestorId, familiesByFatherId, childrenByFamilyId): string[] {
  const result: string[] = [];
  const stack: string[] = [ancestorId];

  while (stack.length > 0) {
    const personId = stack.pop()!;
    result.push(personId);

    // Get this person's families as father, sorted by sort_order (ascending)
    const families = familiesByFatherId[personId] ?? [];

    // Push children in reverse order so stack processes left-to-right
    for (const family of [...families].reverse()) {
      const children = childrenByFamilyId[family.id] ?? [];
      for (const child of [...children].reverse()) {
        stack.push(child.person_id);
      }
    }
  }

  return result; // DFS preorder: root first, then children L-to-R
}

// Eligibility filter applied after DFS order:
function isEligible(person, pool, currentYear): boolean {
  const ageLunar = currentYear - person.birth_year + 1; // tuổi âm
  return (
    person.gender === 1 &&        // nam giới
    person.is_living &&           // còn sống
    person.generation >= pool.min_generation &&
    ageLunar < pool.max_age_lunar &&
    isMarried(person.id)          // đã lập gia đình (có record trong families)
  );
}

// Next host selection:
function getNextHost(pool, lastAssignment, eligibleList): Person {
  const nextIndex = (lastAssignment.rotation_index + 1) % eligibleList.length;
  return eligibleList[nextIndex];
}
```

**Implementation:** `frontend/src/lib/supabase-data-cau-duong.ts`

### 3.3 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for people
CREATE POLICY "Public read for people" ON people
    FOR SELECT USING (privacy_level = 0);

CREATE POLICY "Members read all" ON people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin full access" ON people
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Similar policies for other tables...
```

---

## 4. API Design

### 4.1 Data Layer (`lib/supabase-data.ts`)

```typescript
// Types
export interface Person {
  id: string;
  handle: string;
  displayName: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  gender: 1 | 2;
  generation: number;
  chi?: number;
  birthDate?: string;
  birthYear?: number;
  deathDate?: string;
  deathYear?: number;
  deathLunar?: string; // "15/7" format
  isLiving: boolean;
  isPatrilineal: boolean;
  // ... contact, bio fields
}

export interface Family {
  id: string;
  handle: string;
  fatherId?: string;
  motherId?: string;
  children: string[]; // person IDs
}

// CRUD Operations
export async function getPeople(): Promise<Person[]>
export async function getPerson(id: string): Promise<Person | null>
export async function createPerson(data: CreatePersonInput): Promise<Person>
export async function updatePerson(id: string, data: UpdatePersonInput): Promise<Person>
export async function deletePerson(id: string): Promise<void>

export async function getFamilies(): Promise<Family[]>
export async function getFamily(id: string): Promise<Family | null>
export async function createFamily(data: CreateFamilyInput): Promise<Family>
export async function updateFamily(id: string, data: UpdateFamilyInput): Promise<Family>

// Specialized queries
export async function getAncestors(personId: string): Promise<Person[]>
export async function getDescendants(personId: string): Promise<Person[]>
export async function searchPeople(query: string): Promise<Person[]>
export async function getPeopleByGeneration(gen: number): Promise<Person[]>
export async function getMemorialDates(): Promise<Event[]>

// Achievements (v1.1)
export async function getAchievements(personId?: string): Promise<Achievement[]>
export async function createAchievement(data: CreateAchievementInput): Promise<Achievement>
export async function updateAchievement(id: string, data: UpdateAchievementInput): Promise<Achievement>
export async function deleteAchievement(id: string): Promise<void>

// Education Fund (v1.1)
export async function getFundTransactions(filters?: FundFilters): Promise<FundTransaction[]>
export async function createFundTransaction(data: CreateFundTxInput): Promise<FundTransaction>
export async function getFundBalance(): Promise<{ income: number; expense: number; balance: number }>
export async function getScholarships(filters?: ScholarshipFilters): Promise<Scholarship[]>
export async function createScholarship(data: CreateScholarshipInput): Promise<Scholarship>
export async function updateScholarshipStatus(id: string, status: string, reviewerId: string): Promise<Scholarship>

// Clan Articles - Hương ước (v1.1)
export async function getClanArticles(category?: string): Promise<ClanArticle[]>
export async function getClanArticle(id: string): Promise<ClanArticle | null>
export async function createClanArticle(data: CreateArticleInput): Promise<ClanArticle>
export async function updateClanArticle(id: string, data: UpdateArticleInput): Promise<ClanArticle>
export async function deleteClanArticle(id: string): Promise<void>
```

### 4.2 React Query Hooks

```typescript
// hooks/usePeople.ts
export function usePeople() {
  return useQuery({
    queryKey: ['people'],
    queryFn: getPeople,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['people', id],
    queryFn: () => getPerson(id),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

// hooks/useTree.ts
export function useTreeData() {
  const { data: people } = usePeople();
  const { data: families } = useFamilies();
  
  return useMemo(() => {
    if (!people || !families) return null;
    return computeLayout(people, families);
  }, [people, families]);
}
```

---

## 5. Component Architecture

### 5.1 Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (SEO metadata)
│   ├── globals.css                   # Global styles + print styles
│   ├── (auth)/                       # Auth pages (no sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (landing)/                    # Public landing page (no auth, no sidebar)
│   │   ├── layout.tsx                # Minimal layout — no AuthProvider/sidebar
│   │   └── welcome/page.tsx          # Landing page (7 sections, SSR static)
│   ├── (main)/                       # Main app (with sidebar)
│   │   ├── layout.tsx                # Sidebar + Header layout
│   │   ├── page.tsx                  # Dashboard/Home with stats
│   │   ├── tree/page.tsx             # Interactive family tree
│   │   ├── people/
│   │   │   ├── page.tsx              # People list with search/filter
│   │   │   ├── new/page.tsx          # Create new person
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Person detail + gallery
│   │   │       └── edit/page.tsx     # Edit person form
│   │   ├── directory/page.tsx        # Contact directory
│   │   ├── events/page.tsx           # Memorial calendar
│   │   ├── contributions/page.tsx    # Contribution submissions
│   │   ├── documents/
│   │   │   ├── page.tsx              # GEDCOM export + book link
│   │   │   └── book/page.tsx         # Genealogy book view
│   │   ├── achievements/page.tsx     # Achievement honors (v1.1)
│   │   ├── fund/page.tsx             # Education fund dashboard (v1.1)
│   │   ├── charter/page.tsx          # Hương ước / Clan rules (v1.1)
│   │   ├── help/page.tsx             # In-app help guide (v2.2)
│   │   └── admin/
│   │       ├── page.tsx              # Admin dashboard
│   │       ├── users/page.tsx        # User management
│   │       ├── contributions/page.tsx # Review contributions
│   │       ├── achievements/page.tsx  # Manage achievements (v1.1)
│   │       ├── fund/page.tsx          # Manage fund & scholarships (v1.1)
│   │       └── charter/page.tsx       # Manage clan articles (v1.1)
│   │   # Each route also has error.tsx and loading.tsx files
│   └── middleware.ts                 # Auth + role-based route protection
│
├── components/
│   ├── ui/                           # shadcn/ui components (23 files)
│   │   ├── button.tsx, card.tsx, dialog.tsx, input.tsx, ...
│   │   ├── sidebar.tsx, sheet.tsx, tabs.tsx, table.tsx
│   │   ├── select.tsx, checkbox.tsx, switch.tsx
│   │   └── skeleton.tsx, badge.tsx, avatar.tsx, tooltip.tsx
│   ├── layout/
│   │   └── app-sidebar.tsx           # Sidebar + header + mobile nav
│   ├── tree/
│   │   └── family-tree.tsx           # All-in-one tree component
│   ├── people/
│   │   ├── person-card.tsx           # Person display card
│   │   ├── person-form.tsx           # Create/edit form
│   │   ├── photo-gallery.tsx         # Photo grid + upload
│   │   └── avatar-upload.tsx         # Avatar upload overlay
│   ├── home/
│   │   └── stats-card.tsx            # Dashboard stats card
│   ├── events/
│   │   ├── calendar-grid.tsx         # Calendar view component
│   │   ├── add-event-dialog.tsx      # Event creation dialog
│   │   └── event-constants.ts        # Event type constants
│   ├── auth/
│   │   └── auth-provider.tsx         # Auth context + useAuth hook
│   ├── providers/
│   │   └── query-provider.tsx        # React Query provider
│   └── shared/
│       ├── error-boundary.tsx        # Client error boundary
│       └── route-error.tsx           # Reusable route error UI
│
├── lib/
│   ├── supabase.ts                   # Supabase browser client
│   ├── supabase-data.ts              # Core data operations (people, families, etc.)
│   ├── supabase-data-achievements.ts # Achievement CRUD (v1.1)
│   ├── supabase-data-fund.ts         # Fund + scholarship CRUD (v1.1)
│   ├── supabase-data-charter.ts      # Clan article CRUD (v1.1)
│   ├── supabase-storage.ts           # File upload to Supabase Storage
│   ├── lunar-calendar.ts             # Lunar calendar conversion
│   ├── gedcom-export.ts              # GEDCOM 5.5.1 export
│   ├── book-generator.ts             # Book chapter generator
│   ├── format.ts                     # Shared formatters (formatVND)
│   ├── utils.ts                      # cn() helper
│   └── validations/
│       └── person.ts                 # Zod person schema
│
├── hooks/
│   ├── use-people.ts                 # People queries + mutations
│   ├── use-families.ts               # Family queries + mutations
│   ├── use-profiles.ts               # Profile queries
│   ├── use-contributions.ts          # Contribution queries
│   ├── use-events.ts                 # Event queries + mutations
│   ├── use-media.ts                  # Media queries + mutations
│   ├── use-achievements.ts           # Achievement queries (v1.1)
│   ├── use-fund.ts                   # Fund + scholarship queries (v1.1)
│   ├── use-clan-articles.ts          # Clan article queries (v1.1)
│   └── use-mobile.ts                 # Mobile detection hook
│
└── types/
    └── index.ts                      # All TypeScript interfaces + enums
```

> **Note:** Zustand is installed but not actively used. All state management is via
> React Context (AuthProvider) and React Query cache. Tree UI state (zoom, pan) is
> managed locally within the family-tree.tsx component.

### 5.2 Key Components

#### Tree View Component

```typescript
// components/tree/tree-view.tsx
interface TreeViewProps {
  people: Person[];
  families: Family[];
  selectedId?: string;
  onSelect: (id: string) => void;
  viewMode: 'all' | 'ancestors' | 'descendants';
}

export function TreeView({ 
  people, 
  families, 
  selectedId, 
  onSelect,
  viewMode 
}: TreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  
  const layout = useMemo(() => {
    const filtered = filterByViewMode(people, families, selectedId, viewMode);
    return computeLayout(filtered.people, filtered.families);
  }, [people, families, selectedId, viewMode]);
  
  // Pan & zoom handlers
  // ...
  
  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <TreeControls 
        onZoomIn={() => ...} 
        onZoomOut={() => ...}
        onReset={() => ...}
      />
      <svg 
        className="w-full h-full"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        {/* Connections */}
        {layout.connections.map(conn => (
          <TreeConnection key={conn.id} {...conn} />
        ))}
        
        {/* Nodes */}
        {layout.nodes.map(node => (
          <TreeNode 
            key={node.id}
            node={node}
            isSelected={node.id === selectedId}
            onClick={() => onSelect(node.id)}
          />
        ))}
      </svg>
    </div>
  );
}
```

---

## 6. Tree Layout Algorithm

### 6.1 Algorithm Overview

Based on market research (Topola, dTree patterns):

```typescript
// lib/tree-layout.ts

export interface LayoutConfig {
  cardWidth: number;    // 180px
  cardHeight: number;   // 80px
  hSpacing: number;     // 24px horizontal gap
  vSpacing: number;     // 80px vertical gap
  coupleGap: number;    // 8px between spouses
}

export interface PositionedNode {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export interface Connection {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'parent-child' | 'couple';
}

export function computeLayout(
  people: Person[],
  families: Family[],
  config?: Partial<LayoutConfig>
): LayoutResult {
  // 1. Build adjacency maps
  // 2. Find root families (no parents)
  // 3. Build subtrees recursively (bottom-up width calculation)
  // 4. Assign positions (top-down)
  // 5. Generate orthogonal connections
  // 6. Return positioned nodes + connections
}
```

### 6.2 Layout Rules

1. **Single child** → directly below parent (same X)
2. **Multiple children** → evenly distributed, parent centered
3. **Spouse** → right of patrilineal person with gap
4. **Connections** → strictly orthogonal (no diagonals)

---

## 7. Vietnamese Features Implementation

### 7.1 Lunar Calendar (`lib/lunar-calendar.ts`)

```typescript
// Using existing Vietnamese lunar calendar library
import { solarToLunar, lunarToSolar } from 'vietnamese-lunar-calendar';

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean; // Tháng nhuận
  canChi: string; // "Giáp Tý", "Ất Sửu", etc.
}

export function formatLunarDate(lunar: LunarDate): string {
  const leap = lunar.leap ? ' (nhuận)' : '';
  return `${lunar.day}/${lunar.month}${leap}`;
}

export function getZodiacYear(year: number): string {
  const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
  const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];
  return `${CAN[year % 10]} ${CHI[year % 12]}`;
}

export function getUpcomingMemorials(people: Person[], daysAhead: number = 30): MemorialEvent[] {
  // Calculate upcoming giỗ dates based on lunar calendar
}
```

### 7.2 Generation & Chi Tracking

```typescript
// Auto-calculate generation from parents
export function calculateGeneration(person: Person, families: Family[]): number {
  const parentFamily = families.find(f => 
    f.children.includes(person.id)
  );
  
  if (!parentFamily) return 1; // Root generation
  
  const father = parentFamily.fatherId 
    ? getPerson(parentFamily.fatherId) 
    : null;
    
  return father ? father.generation + 1 : 1;
}

// Chi assignment (manual by admin)
export interface ChiConfig {
  chiNumber: number;
  chiName: string;
  founderId: string; // Person who started this chi
}
```

---

## 8. Security Design

### 8.1 Authentication Flow

```
┌─────────┐    ┌─────────────┐    ┌──────────────┐
│  User   │───▶│   Next.js   │───▶│   Supabase   │
│         │    │  Frontend   │    │     Auth     │
└─────────┘    └─────────────┘    └──────────────┘
                     │                    │
                     │    JWT Token       │
                     │◀───────────────────│
                     │                    │
                     ▼                    │
              ┌─────────────┐            │
              │   React     │            │
              │ AuthContext  │            │
              └─────────────┘            │
                     │                    │
                     │    API Calls       │
                     │    (with JWT)      │
                     │───────────────────▶│
                     │                    │
                     │    RLS enforced    │
                     │◀───────────────────│
```

### 8.2 Role-Based Access

| Role | Read Public | Read Private | Create | Update | Delete | Admin |
|------|:-----------:|:------------:|:------:|:------:|:------:|:-----:|
| **Guest** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Viewer** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 9. Performance Considerations

### 9.1 Optimization Strategies

| Area | Strategy |
|------|----------|
| **Tree rendering** | Virtual rendering for large trees (>500 nodes) |
| **Data fetching** | React Query caching, stale-while-revalidate |
| **Images** | Next.js Image optimization, lazy loading |
| **Bundle size** | Dynamic imports, tree shaking |
| **Database** | Indexes on frequently queried columns |

### 9.2 Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | >90 |
| Accessibility | >90 |
| Best Practices | >90 |
| SEO | >90 |

---

## 10. Deployment Architecture

### 10.1 Cloud Mode (Production)

```text
┌─────────────────────────────────────────────────────────────┐
│                         GITHUB                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              main branch                             │    │
│  └────────────────────────┬────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────┘
                            │ push
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Auto Build & Deploy                     │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │    │
│  │  │ Preview │  │  Prod   │  │    Edge Network     │  │    │
│  │  │  (PR)   │  │ (main)  │  │                     │  │    │
│  │  └─────────┘  └─────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │   DB    │  │ Storage │  │Realtime │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Local Mode (Development / Community) (v1.5)

```text
┌──────────────────────────────────────────────────────────────┐
│                    LOCAL MACHINE                              │
│                                                              │
│  ┌──────────────────────────────────┐                        │
│  │  Next.js Dev Server              │                        │
│  │  http://localhost:4000           │                        │
│  └────────────────┬─────────────────┘                        │
│                   │ API calls (env vars)                     │
│                   ▼                                          │
│  ┌──────────────────────────────────┐  Docker Containers     │
│  │  SUPABASE CLI (supabase start)  │                        │
│  │  ┌────────┐ ┌────────┐          │                        │
│  │  │  Auth  │ │   DB   │ :54322   │                        │
│  │  │ GoTrue │ │ Postgres│          │                        │
│  │  └────────┘ └────────┘          │                        │
│  │  ┌────────┐ ┌────────┐          │                        │
│  │  │Storage │ │ Studio │ :54323   │                        │
│  │  └────────┘ └────────┘          │                        │
│  │  PostgREST API    :54321        │                        │
│  └──────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

**Key design:** Zero code change giữa 2 mode. Chỉ thay env vars:

- Cloud: `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
- Local: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`

**Prerequisites:** Docker Desktop (2GB+ RAM), Node.js 18+, pnpm.
**Setup:** `pnpm local:setup` → auto chạy migrations + seed data.
**Chi tiết:** Xem [LOCAL-DEVELOPMENT.md](../04-build/LOCAL-DEVELOPMENT.md).

### 10.3 Desktop Mode (Standalone App) (v2.0)

```text
┌──────────────────────────────────────────────────────────────┐
│                    ELECTRON APP                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  BrowserWindow (Renderer)                             │    │
│  │                                                       │    │
│  │  sqlite-supabase-shim.ts (client-side)               │    │
│  │    .from('people').select('*').eq('id', x)            │    │
│  │    → serialize to JSON → fetch('/api/desktop-db')     │    │
│  └────────────────────────┬──────────────────────────────┘    │
│                           │ HTTP (localhost)                   │
│  ┌────────────────────────▼──────────────────────────────┐    │
│  │  Next.js Standalone Server (Node.js)                   │    │
│  │                                                        │    │
│  │  /api/desktop-db/route.ts                             │    │
│  │    → getDatabase() singleton → build SQL → sql.js     │    │
│  │    → boolean/JSONB conversion → flushToDisk()         │    │
│  │    → return {data, error} as JSON                     │    │
│  │                                                        │    │
│  │  /api/media/[...path]/route.ts                        │    │
│  │    → serve local files from ~/AncestorTree/media/     │    │
│  └────────────────────────┬──────────────────────────────┘    │
│                           │                                   │
│                   ┌───────▼───────┐                           │
│                   │   SQLite DB   │                           │
│                   │ ancestortree  │                           │
│                   │   .db (file)  │                           │
│                   └───────────────┘                           │
│                                                              │
│  Data: ~/AncestorTree/data/ancestortree.db                   │
│  Media: ~/AncestorTree/media/                                │
└──────────────────────────────────────────────────────────────┘
```

**Key design:** Supabase Client Shim — giả lập Supabase JS API trên SQLite (sql.js WASM):

- **Data layer (5 files, 79 functions): KHÔNG ĐỔI**
- **Hooks (7 files): KHÔNG ĐỔI**
- **Pages/Components (~40 files): KHÔNG ĐỔI**
- **Chỉ modify 3 existing files + thêm ~18 files mới**

**Desktop-specific:**

- `NEXT_PUBLIC_DESKTOP_MODE=true` → middleware bypasses auth, supabase.ts returns shim client
- `ELECTRON_BUILD=true` → `next.config.ts` sets `output: 'standalone'` (ADR-004)
- sql.js persistence: singleton `getDatabase()` + `flushToDisk()` atomic write after every mutation
- Single-user admin mode — no RLS, no auth, no role checks
- ADRs: [ADR-001](ADR/ADR-001-sqlite-adapter.md), [ADR-002](ADR/ADR-002-desktop-db-decomposition.md), [ADR-003](ADR/ADR-003-media-export-format.md), [ADR-004](ADR/ADR-004-standalone-output-conditional.md)

### 10.4 Landing Page — Public Route Group (v2.1)

```text
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Root Layout (layout.tsx)                                  │  │
│  │  → Inter font, QueryProvider, AuthProvider, Toaster        │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │  (auth)/    │  │  (landing)/ │  │     (main)/      │  │  │
│  │  │  login      │  │  welcome    │  │  sidebar + auth  │  │  │
│  │  │  register   │  │  (public)   │  │  tree, people…   │  │  │
│  │  │  forgot-pw  │  │             │  │  admin panel     │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Middleware: /welcome in publicPaths → no auth required          │
│  URL: https://ancestortree.info/welcome                   │
└─────────────────────────────────────────────────────────────────┘
```

**Route Group: `(landing)/`**

- `layout.tsx` — Minimal wrapper: `<div className="min-h-screen bg-background">{children}</div>`. No sidebar, no navigation chrome. Inherits root layout providers (known limitation — AuthProvider/QueryProvider loaded but unused; acceptable overhead, no functional impact).
- `welcome/page.tsx` — Server Component (static content, no client-side data fetching). 7 sections: Hero, Features (8 cards), Screenshots, Download, Community, For Developers, Footer.
- Middleware: `/welcome` added to `publicPaths` array. Authenticated users are NOT redirected away from `/welcome` (unlike `/login`, `/register`).

**SEO & Meta:**

| Item | Implementation |
|------|----------------|
| Canonical URL | `<link rel="canonical" href="https://ancestortree.info/welcome" />` via Next.js `metadata.alternates.canonical` |
| Open Graph | `og:title`, `og:description`, `og:image` → `/og-landing.png` (1200×630) |
| robots.txt | `public/robots.txt` — Allow all crawlers on `/welcome`, Disallow authenticated routes (`/people`, `/tree`, `/admin`, etc.) |
| Sitemap | Single-page: only `/welcome` in `sitemap.xml` (optional, low priority) |

**Download Links — State B (Pending):**

Desktop build artifacts (.dmg, .exe) chưa có trên GitHub Releases tại thời điểm launch. Landing page hiển thị:

- "Sắp có — theo dõi GitHub Releases" với link đến Releases page
- Badge "Coming Soon" thay vì file size / version cụ thể
- Khi artifacts có: cập nhật thành State A (direct download links)

**Vercel Domain:**

- Custom domain `ancestortree.info` → same Vercel deployment
- Domain `ancestortree.info` purchased & configured on Vercel
- Single `pnpm build`, single deployment — landing page + main app cùng origin

---

## 11. Testing Strategy

### 11.1 Test Pyramid

```
        ┌───────────┐
        │    E2E    │  ← Playwright (critical paths)
        │   Tests   │
       ─┼───────────┼─
       │ Integration │  ← Testing Library (component + API)
       │    Tests    │
      ─┼─────────────┼─
      │    Unit      │  ← Vitest (utils, hooks, logic)
      │    Tests     │
     ─┴──────────────┴─
```

### 11.2 Coverage Targets

| Type | Coverage | Focus |
|------|----------|-------|
| Unit | >80% | Tree layout, utils, hooks |
| Integration | >60% | Components, data layer |
| E2E | Critical paths | Auth, CRUD, tree view |

---

## 12. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | @dev-team | 2026-02-24 | ✅ Approved |
| Architect | @architect | 2026-02-25 | ✅ Approved (v1.2.0 update) |
| PM | @pm | 2026-02-25 | ✅ Approved |
| Sponsor | Chủ tịch HĐGT | | ⏳ Pending |

---

**Previous:** [01-planning/roadmap.md](../01-planning/roadmap.md)
**Next:** [02-design/ui-design.md](./ui-design.md)

*SDLC Framework 6.1.1 - Stage 02 Design*
