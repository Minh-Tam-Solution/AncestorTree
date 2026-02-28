---
project: AncestorTree
path: docs/04-build/SPRINT-12-SPEC.md
type: build
version: 1.0.0
updated: 2026-02-28
owner: "@pm"
status: approved
---

# Sprint 12: Bảo mật quyền riêng tư, Xác nhận thành viên & Sub-admin

**Version:** v2.3.0
**Estimated:** 2-3 ngày
**PJM Review:** APPROVED WITH CHANGES (7 issues addressed below)

---

## 1. Context & Motivation

Phản hồi cộng đồng: cần tăng cường bảo mật thông tin cá nhân thành viên dòng họ.

**Hiện trạng:**
- Viewer xem được gần hết thông tin (kể cả liên lạc cá nhân)
- Chưa có email verification khi đăng ký
- Chưa có quy trình xác nhận thành viên (admin duyệt)
- Tài liệu không phân biệt public/private

**Sprint này bổ sung:**
1. **Hạn chế viewer** — chỉ thấy thông tin công khai, không xem chi tiết liên lạc
2. **Privacy tài liệu** — set public/members/private khi upload tài liệu
3. **Xác nhận email** — đăng ký cần verify email (Supabase native)
4. **Xác nhận thành viên** — admin/sub-admin duyệt tài khoản mới
5. **Sub-admin** — editor có `can_verify_members` xác nhận thành viên trong nhánh

---

## 2. Quyết định kiến trúc

**Không thêm role mới** — reuse `editor` + `edit_root_person_id` (Sprint 7.5) + thêm `can_verify_members` boolean.

> Lý do: Thêm role mới ảnh hưởng RLS policies, middleware, sidebar, types, desktop shim — blast radius quá rộng cho tính năng chỉ cần 1 boolean flag.

**Two-step verification flow** (ISS-03):
```
Đăng ký → Email xác nhận (Supabase native) → Login
→ Profile is_verified = false → Redirect /pending-verification
→ Admin approve (is_verified = true) → Full access
```

---

## 3. Tasks (16 tasks)

### Task 1: Migration SQL (M)

**New:** `frontend/supabase/migrations/20260228000008_sprint12_privacy_verification.sql`

```sql
-- ══════════════════════════════════════════════════════════════
-- Sprint 12: Privacy, Verification & Sub-admin
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles: verification + sub-admin fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_verify_members BOOLEAN DEFAULT false;

-- Existing users auto-verified (don't break current logins)
UPDATE profiles SET is_verified = true WHERE created_at < NOW();

-- 2. Documents: privacy_level (0=public, 1=members, 2=private)
ALTER TABLE clan_documents ADD COLUMN IF NOT EXISTS privacy_level SMALLINT DEFAULT 1;

-- 3. Documents RLS: privacy-aware SELECT policies
-- ISS-06 fix: ALL document SELECT requires auth (no anonymous access)
DROP POLICY IF EXISTS "Authenticated users can view documents" ON clan_documents;

CREATE POLICY "Auth view public documents" ON clan_documents
  FOR SELECT USING (auth.uid() IS NOT NULL AND privacy_level = 0);

CREATE POLICY "Auth view members-only documents" ON clan_documents
  FOR SELECT USING (auth.uid() IS NOT NULL AND privacy_level = 1);

CREATE POLICY "Admins view all documents" ON clan_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. Sub-admin: verify members in subtree
CREATE POLICY "Sub-admins verify members in subtree" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'editor') AND p.can_verify_members = true
      AND (p.edit_root_person_id IS NULL
           OR (profiles.linked_person IS NOT NULL
               AND is_person_in_subtree(p.edit_root_person_id, profiles.linked_person)))
    )
  );
```

**Desktop:** `desktop/migrations/004-sprint12-verification.sql`

```sql
-- Sprint 12: Desktop mode (single-user admin, auto-verified)
ALTER TABLE profiles ADD COLUMN is_verified INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN can_verify_members INTEGER DEFAULT 0;
ALTER TABLE clan_documents ADD COLUMN privacy_level INTEGER DEFAULT 1;

-- Desktop: admin auto-verified + can verify
UPDATE profiles SET is_verified = 1, can_verify_members = 1 WHERE role = 'admin';
```

---

### Task 2: Supabase Config

**File:** `frontend/supabase/config.toml`

**Change:** `enable_confirmations = false` → `enable_confirmations = true`

> Production: bật trên Supabase Dashboard > Auth > Settings > Email Confirmations

---

### Task 3: Fix person form privacy default

**File:** `frontend/src/lib/validations/person.ts` (line 99)

**Change:** `privacy_level: 0` → `privacy_level: 1`

> Align with DB default (`privacy_level SMALLINT DEFAULT 1` from Sprint 8 security migration)

---

### Task 4: Types

**File:** `frontend/src/types/index.ts`

**Profile** (line 96) — thêm 2 fields:

```typescript
export interface Profile {
  // ... existing fields ...
  is_verified: boolean;
  can_verify_members: boolean;
}
```

**ClanDocument** (line 301) — thêm 1 field:

```typescript
export interface ClanDocument {
  // ... existing fields ...
  privacy_level: number;
}
```

---

### Task 5: Data Layer

**File:** `frontend/src/lib/supabase-data.ts`

Thêm 3 functions:

```typescript
// Verify/unverify a user account
export async function verifyUser(userId: string, verified: boolean) { ... }

// Toggle can_verify_members for sub-admin
export async function updateCanVerifyMembers(userId: string, canVerify: boolean) { ... }

// Get all unverified profiles (for admin panel)
export async function getUnverifiedProfiles(): Promise<Profile[]> { ... }
```

---

### Task 6: Auth Provider

**File:** `frontend/src/components/auth/auth-provider.tsx`

**Changes:**
- Thêm `isVerified: boolean` vào `AuthContextValue`
- Compute: `const isVerified = profile?.is_verified ?? false`
- Export trong context value

---

### Task 7: Hooks

**File:** `frontend/src/hooks/use-profiles.ts`

Thêm 3 hooks:
- `useVerifyUser()` — mutation gọi `verifyUser()`
- `useUpdateCanVerifyMembers()` — mutation gọi `updateCanVerifyMembers()`
- `useUnverifiedProfiles()` — query gọi `getUnverifiedProfiles()`

---

### Task 8: Middleware — is_verified check (ISS-02, ISS-03)

**File:** `frontend/src/middleware.ts`

**Changes:**
- After authentication check, query `is_verified` alongside `role` from profiles
- If `is_verified === false` and path is NOT `/pending-verification`: redirect to `/pending-verification`
- Add `/pending-verification` to public-ish paths (accessible when authenticated but unverified)

**New File:** `frontend/src/app/(auth)/pending-verification/page.tsx`

```
Card layout:
- Icon: Clock/ShieldCheck
- Title: "Chờ xác nhận tài khoản"
- Message: "Tài khoản của bạn đã được đăng ký thành công.
           Vui lòng chờ quản trị viên xác nhận để truy cập đầy đủ."
- Button: "Đăng xuất" (signOut → redirect /login)
- Note: "Nếu bạn cho rằng đây là lỗi, hãy liên hệ quản trị viên."
```

---

### Task 9: Sidebar — Viewer restrictions

**File:** `frontend/src/components/layout/app-sidebar.tsx`

**Changes:**
- Thêm `viewerHidden?: boolean` flag per nav item
- Mark `directory` as `viewerHidden: true`
- Filter `mainNavItems`: if `profile?.role === 'viewer'`, hide items with `viewerHidden`

> Note: Unverified users can't reach sidebar at all (blocked by middleware Task 8)

---

### Task 10: People list — Hide "Thêm mới" for viewer

**File:** `frontend/src/app/(main)/people/page.tsx`

**Change:** Chỉ hiện nút "Thêm mới" khi `isEditor` (từ `useAuth()`)

---

### Task 11: Person detail — Hide contacts for viewer (ISS-04)

**File:** `frontend/src/app/(main)/people/[id]/page.tsx`

**Changes:**
- **ISS-04 fix:** Use existing `useCanEditPerson` hook from `src/hooks/use-can-edit.ts` instead of simple `isAdmin || profile?.role === 'editor'`
  - Current code (line 60): `const canEdit = isAdmin || profile?.role === 'editor';`
  - New code: `const { data: canEdit = false } = useCanEditPerson(id);`
- **Contact card:** Hide entirely for viewer (except self via `linked_person`)
  - Condition: `if (profile?.role === 'viewer' && profile?.linked_person !== person.id)` → hide contact card
- **Edit/Delete buttons:** Already guarded by `canEdit`, no extra change needed

---

### Task 12: Directory — Mask contacts for viewer (ISS-05)

**File:** `frontend/src/app/(main)/directory/page.tsx`

**Changes:**
- **ISS-05 fix:** Add `zalo` and `facebook` to `getContactDisplay()` return + masking
  - Current: only returns `{ phone, email, address, masked }`
  - New: add `zalo: string | null`, `facebook: string | null` to return type
  - When `masked = true`: zalo and facebook also null
- **Viewer restriction:** viewer sees names + generation only, all contacts masked
  - New condition: `if (profile?.role === 'viewer') return { phone: null, email: null, address: null, zalo: null, facebook: null, masked: true };`
- **Liên kết column:** Use `contact.zalo` / `contact.facebook` instead of raw `person.zalo` / `person.facebook`

---

### Task 13: Admin Users — Verification controls

**File:** `frontend/src/app/(main)/admin/users/page.tsx`

**Changes:**
- New table column: "Trạng thái" with verified/pending `Badge`
  - Verified: `<Badge className="bg-green-100 text-green-800">Đã xác nhận</Badge>`
  - Pending: `<Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>`
- Action button: "Xác nhận" per unverified user row (calls `useVerifyUser()`)
- Toggle: "Có thể xác nhận TV" checkbox/switch cho editors (calls `useUpdateCanVerifyMembers()`)
- Filter toggle: "Chỉ xem chưa xác nhận" to quickly find pending users
- **Sub-admin logic (editor with `can_verify_members`):**
  - Only see users whose `linked_person` is in their subtree (via `is_person_in_subtree` RPC)
  - Server-side: RLS policy handles filtering
  - Client-side: also filter for UX clarity

---

### Task 14: Admin Documents — Privacy selector

**File:** `frontend/src/app/(main)/admin/documents/page.tsx`

**Changes:**
- Add `Select` for `privacy_level` in document form dialog:
  - 0 = "Công khai" (Public)
  - 1 = "Thành viên" (Members only) — default
  - 2 = "Riêng tư" (Admin only)
- Pass `privacy_level` to `createDocument()` / `updateDocument()`

---

### Task 15: Document Library — Privacy badge

**File:** `frontend/src/app/(main)/documents/library/page.tsx`

**Changes:**
- Add privacy level badge next to category badge per document card
- RLS handles filtering automatically (viewer only sees level 0+1, admin sees all)
- Badge variants: "Công khai" (green), "Thành viên" (blue), "Riêng tư" (red)

---

### Task 16: Register — Verification message (ISS-03)

**File:** `frontend/src/app/(auth)/register/page.tsx`

**Changes:**
- After successful `signUp()`: show inline success card instead of toast + redirect
- Success card content:
  ```
  ✅ Đăng ký thành công!
  Vui lòng kiểm tra email để xác nhận tài khoản.
  Sau khi xác nhận email, quản trị viên sẽ duyệt tài khoản của bạn.
  [Về trang đăng nhập]
  ```
- Use `useState` for `registered: boolean` to toggle form ↔ success card

---

### Task 17: Desktop Auth Shim (ISS-07)

**File:** `frontend/src/lib/supabase-desktop-auth.ts`

**Changes:**
- Desktop mode = single-user admin, auto-verified
- No changes needed to the auth shim itself — it mocks auth, profile is fetched from DB
- Desktop migration (Task 1) already sets `is_verified = 1, can_verify_members = 1` for admin

> ISS-07 resolution: The desktop auth shim is at `supabase-desktop-auth.ts` (not `sqlite-auth-shim.ts`). It only mocks Supabase Auth API. Profile fields come from SQLite DB via desktop migration. No code change needed here — just ensure desktop migration covers new columns.

---

### Task 18: Build & Verify

```bash
cd frontend && pnpm build
```

**Expected:** 0 errors, all pages compile.

---

## 4. Execution Order

```
Phase 1 — Foundation (parallel):
  Task 1 (migration SQL)
  Task 2 (Supabase config)
  Task 3 (form default fix)

Phase 2 — Types:
  Task 4 (types)

Phase 3 — Data layer:
  Task 5 (data layer)

Phase 4 — Auth (parallel):
  Task 6 (auth provider)
  Task 7 (hooks)

Phase 5 — Infrastructure:
  Task 8 (middleware + pending-verification page)

Phase 6 — UI changes (can be parallel):
  Task 9  (sidebar)
  Task 10 (people list)
  Task 11 (person detail)
  Task 12 (directory)
  Task 13 (admin users)
  Task 14 (admin documents)
  Task 15 (document library)
  Task 16 (register page)

Phase 7 — Desktop:
  Task 17 (desktop shim verification)

Phase 8 — Build:
  Task 18 (pnpm build + verify)
```

---

## 5. PJM Review Issues — Resolution

| Issue | Priority | Resolution |
|-------|----------|------------|
| **ISS-01** Task count header 18→16 | P1 | Fixed: 16 tasks (removed duplicate tree task + renumbered) |
| **ISS-02** Middleware `is_verified` check | P1 | Added Task 8: middleware queries `is_verified`, redirects to `/pending-verification` |
| **ISS-03** Two-step verification UX flow | P1 | Defined in Section 2 + Task 8 (pending page) + Task 16 (register success card) |
| **ISS-04** Use `useCanEditPerson` hook | P1 | Task 11: replace `isAdmin \|\| profile?.role === 'editor'` with `useCanEditPerson(id)` |
| **ISS-05** Mask zalo/facebook in directory | P2 | Task 12: extend `getContactDisplay()` return type + masking |
| **ISS-06** Public docs RLS require auth | P2 | Task 1: `USING (auth.uid() IS NOT NULL AND privacy_level = 0)` |
| **ISS-07** Desktop auth shim location | P2 | Confirmed at `supabase-desktop-auth.ts`. No code change needed — desktop migration handles fields |

---

## 6. Critical Files

| File | Change | Task |
|------|--------|------|
| `supabase/migrations/20260228000008_sprint12...sql` | NEW — Supabase migration | 1 |
| `desktop/migrations/004-sprint12-verification.sql` | NEW — SQLite migration | 1 |
| `supabase/config.toml` | enable_confirmations = true | 2 |
| `src/lib/validations/person.ts` | privacy default 0→1 | 3 |
| `src/types/index.ts` | Profile + ClanDocument fields | 4 |
| `src/lib/supabase-data.ts` | verify/unverified functions | 5 |
| `src/components/auth/auth-provider.tsx` | isVerified context | 6 |
| `src/hooks/use-profiles.ts` | verification hooks | 7 |
| `src/middleware.ts` | is_verified redirect | 8 |
| `src/app/(auth)/pending-verification/page.tsx` | NEW — waiting page | 8 |
| `src/components/layout/app-sidebar.tsx` | viewer nav filter | 9 |
| `src/app/(main)/people/page.tsx` | hide add button | 10 |
| `src/app/(main)/people/[id]/page.tsx` | useCanEditPerson + hide contacts | 11 |
| `src/app/(main)/directory/page.tsx` | mask zalo/facebook + viewer | 12 |
| `src/app/(main)/admin/users/page.tsx` | verification UI (largest) | 13 |
| `src/app/(main)/admin/documents/page.tsx` | privacy selector | 14 |
| `src/app/(main)/documents/library/page.tsx` | privacy badge | 15 |
| `src/app/(auth)/register/page.tsx` | success card | 16 |

---

## 7. Verification Checklist

1. `pnpm build` — 0 errors
2. Đăng ký mới → email xác nhận (Supabase native) → login
3. Login khi `is_verified = false` → redirect `/pending-verification` (chỉ thấy thông báo chờ duyệt)
4. Admin → `/admin/users` → thấy "Chờ duyệt" badge → click "Xác nhận" → user verified
5. Verified viewer login → sidebar: menu chính (không có "Danh bạ")
6. Viewer → `/people` → thấy danh sách tên, không thấy nút "Thêm mới"
7. Viewer → `/people/:id` → thấy thông tin cơ bản, **KHÔNG** thấy card liên hệ
8. Viewer → `/tree` → xem cây bình thường, click person → detail page đã restrict
9. Viewer → `/directory` → thấy tên + đời, contacts đều "Ẩn" (kể cả zalo/facebook)
10. Editor có `can_verify_members` + `edit_root_person_id` → admin users chỉ thấy users trong subtree
11. Upload tài liệu với privacy_level → viewer chỉ thấy public + members docs
12. Desktop mode → auto-verified, bypass auth, all features work

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Email verify breaks existing users | Migration auto-verifies all existing profiles |
| Sub-admin RLS update quá rộng | App layer chỉ send `{is_verified}` via controlled mutations |
| Supabase SMTP limit (free tier 4/hour) | Document SMTP setup; built-in email for dev |
| Desktop mode compatibility | Auto-verified in SQLite migration; desktop bypasses middleware |
| Middleware extra DB query (is_verified) | Combined into single `select('role, is_verified')` — no extra round-trip |
