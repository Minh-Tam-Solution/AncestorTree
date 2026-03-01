---
project: AncestorTree
path: docs/backend/API-ENDPOINTS.md
type: api-reference
version: 1.2.0
updated: 2026-03-01
owner: team
status: approved
---

# API Endpoints — AncestorTree v2.3.0

> **Kiến trúc:** Next.js App Router + Supabase PostgREST
> **Auth:** Supabase JWT (cookie-based via `@supabase/ssr`)
> **Desktop mode:** SQLite shim qua `/api/desktop-db`

---

## 0. Rate Limiting

> **Ưu tiên:** Vận hành (không siết chặt). Cho phép người dùng hợp lệ hoạt động bình thường, chặn bot/brute force cơ bản.

### 0.1 Kiến trúc 3 lớp

| Lớp | Nơi thực thi | Phạm vi |
|-----|-------------|---------|
| **GoTrue** | Supabase Auth server | Chặn brute force trực tiếp vào `/auth/v1/*` |
| **proxy.ts** | Next.js Middleware | Giới hạn tải trang auth theo IP |
| **Client-side** | `login/page.tsx` | Backoff UX sau N lần thất bại liên tiếp |

### 0.2 GoTrue Rate Limits (`supabase/config.toml`)

| Endpoint | Giới hạn | Cửa sổ |
|----------|----------|--------|
| Sign-in / Sign-up | 30 lần | 5 phút / IP |
| OTP / Token verification | 30 lần | 5 phút / IP |
| Token refresh | 150 lần | 5 phút / IP |
| Email gửi (reset, confirm) | 5 lần | 1 giờ / IP |
| Email cooldown | 1 lần | 1 phút / địa chỉ |

### 0.3 Middleware Rate Limits (`proxy.ts`)

Áp dụng cho tất cả request (GET + POST) đến trang auth theo IP (`X-Forwarded-For`).

| Path | Max | Cửa sổ | Mục đích |
|------|-----|--------|---------|
| `/login` | 20 | 60s | Ngăn page enumeration |
| `/register` | 10 | 60s | Ngăn spam đăng ký |
| `/forgot-password` | 6 | 5 phút | Ngăn email spam |
| `/reset-password` | 10 | 60s | Ngăn brute force token |

**Response khi vượt giới hạn:**
```
HTTP 429 Too Many Requests
Retry-After: <seconds>
X-RateLimit-Limit: <max>
X-RateLimit-Remaining: 0
Content-Type: application/json

{ "error": "Quá nhiều yêu cầu. Vui lòng thử lại sau.", "retryAfter": <seconds> }
```

### 0.4 Client-side Backoff (`login/page.tsx`)

Bảo vệ luồng `signInWithPassword` (gọi trực tiếp GoTrue, bypass proxy).

| Lần thất bại | Khóa |
|-------------|------|
| ≥ 5 lần | 30 giây |
| ≥ 8 lần | 120 giây |
| ≥ 12 lần | 300 giây |

Nút "Đăng nhập" hiển thị countdown `Thử lại sau Xs` khi đang bị khóa. Bộ đếm reset về 0 khi đăng nhập thành công.

---

## 1. Next.js Internal API Routes

> Route nội bộ. Phần lớn chỉ ở **Desktop Mode** (`NEXT_PUBLIC_DESKTOP_MODE=true`).
> `/api/backup` và `/api/backup/restore` hoạt động **cả Web và Desktop**.

### 1.1 Desktop DB (SQLite Gateway)

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/desktop-db` | Thực thi truy vấn SQLite (CRUD + RPC) |

**Request Headers:**
```
Content-Type: application/json
```

**Request Body — CRUD Query:**
```json
{
  "table": "people",
  "method": "select | insert | update | delete",
  "columns": "* | col1, col2",
  "body": { "field": "value" },
  "filters": [
    { "type": "eq", "column": "id", "value": "uuid" },
    { "type": "in", "column": "id", "value": ["uuid1", "uuid2"] },
    { "type": "is", "column": "field", "value": null },
    { "type": "ilike", "column": "display_name", "value": "%search%" },
    { "type": "not", "column": "field", "operator": "is", "value": null },
    { "type": "or", "condition": "father_id.eq.uuid,mother_id.eq.uuid" }
  ],
  "order": [{ "column": "created_at", "ascending": false }],
  "limit": 20,
  "single": false,
  "maybeSingle": false
}
```

**Request Body — RPC Call:**
```json
{
  "method": "rpc",
  "functionName": "is_person_in_subtree",
  "params": {
    "root_id": "uuid",
    "target_id": "uuid"
  }
}
```

**Response:**
```json
{ "data": [...], "error": null }
{ "data": null, "error": { "message": "...", "code": "..." } }
```

---

### 1.2 Media File Server

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/media/[...path]` | Lấy file media từ `~/AncestorTree/media/` |
| POST | `/api/media/[...path]` | Upload file lên thư mục media |
| DELETE | `/api/media/[...path]` | Xóa file media |

**Path examples:**
- `/api/media/avatars/person-123.jpg`
- `/api/media/documents/lich-su-dong-ho.pdf`

**POST Request:**
```
Content-Type: multipart/form-data

Form fields:
  file: <binary file data>
```

**POST Response:**
```json
{ "ok": true, "path": "documents/filename.pdf" }
```

**GET Response:** Binary file with appropriate `Content-Type` header
**DELETE Response:** `{ "ok": true }`

**Supported MIME types (GET):**
- `.jpg/.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.webp` → `image/webp`
- `.svg` → `image/svg+xml`
- `.pdf` → `application/pdf`

---

### 1.3 Desktop Export

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/desktop-export` | Xuất toàn bộ CSDL ra file ZIP |

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "include_media": "skip | reference | inline"
}
```

| Tùy chọn | Mô tả |
|-----------|--------|
| `skip` | Không đưa media vào ZIP |
| `reference` | Chỉ lưu URL tham chiếu (mặc định) |
| `inline` | Nhúng toàn bộ file media vào ZIP |

**Response:** `application/zip` binary với `Content-Disposition: attachment; filename="giapha-YYYY-MM-DD.zip"`

**ZIP Structure:**
```
giapha-2026-02-27.zip
├── manifest.json          # Schema + data + metadata
└── media/                 # (chỉ khi include_media=inline)
    ├── avatars/
    └── documents/
```

**manifest.json schema:**
```json
{
  "version": "1.0",
  "app_version": "2.2.0",
  "exported_at": "2026-02-27T10:00:00.000Z",
  "include_media": "reference",
  "row_counts": { "people": 18, "families": 8 },
  "tables": {
    "people": [...],
    "families": [...],
    "children": [...],
    "contributions": [...],
    "events": [...],
    "media": [...],
    "achievements": [...],
    "fund_transactions": [...],
    "scholarships": [...],
    "clan_articles": [...],
    "cau_duong_pools": [...],
    "cau_duong_assignments": [...]
  }
}
```

---

### 1.4 Desktop Import

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/desktop-import` | Import dữ liệu từ file ZIP |

**Request:**
```
Content-Type: multipart/form-data

Form fields:
  file: <ZIP binary>
```

**Response:**
```json
{
  "ok": true,
  "tables": { "people": 18, "families": 8 },
  "total_inserted": 142,
  "media_restored": 25,
  "errors": ["table: error message"]
}
```

**⚠️ CẢNH BÁO:** Import xóa toàn bộ dữ liệu hiện tại trước khi restore.

---

### 1.5 Backup (Unified — Web + Desktop)

> **Hoạt động ở cả hai chế độ.** Desktop: query SQLite trực tiếp. Web: dùng Supabase service-role.

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/backup` | Xuất toàn bộ 13 bảng ra file ZIP |
| POST | `/api/backup/restore` | Khôi phục từ file ZIP (xóa dữ liệu cũ trước) |

**POST `/api/backup`**
```
Content-Type: application/json

{ "include_media": "skip | reference | inline" }
```

| Tùy chọn | Hỗ trợ | Mô tả |
|-----------|---------|--------|
| `skip` | Desktop + Web | Chỉ dữ liệu, không có ảnh |
| `reference` | Desktop + Web | Lưu URL tham chiếu (mặc định) |
| `inline` | Desktop only | Nhúng toàn bộ file media vào ZIP |

**Response:** `application/zip` binary — `giapha-YYYY-MM-DD.zip`

**manifest.json schema (v1.0):**
```json
{
  "version": "1.0",
  "app_version": "2.2.1",
  "exported_at": "2026-02-28T10:00:00.000Z",
  "mode": "web | desktop",
  "include_media": "reference",
  "row_counts": { "people": 18, "clan_documents": 5 },
  "tables": {
    "people": [...], "families": [...], "children": [...],
    "contributions": [...], "events": [...], "media": [...],
    "achievements": [...], "fund_transactions": [...], "scholarships": [...],
    "clan_articles": [...], "cau_duong_pools": [...],
    "cau_duong_assignments": [...], "clan_documents": [...]
  }
}
```

**POST `/api/backup/restore`**
```
Content-Type: multipart/form-data
Form fields: file: <ZIP binary>
```

**Response:**
```json
{
  "ok": true,
  "mode": "web | desktop",
  "tables": { "people": 18, "clan_documents": 5 },
  "total_inserted": 145,
  "media_restored": 0,
  "errors": ["optional error list"]
}
```

**Giới hạn bảo mật:**
- Max file size: 500 MB (SEC-WARN-04)
- Column allowlist per table (SEC-CRIT-03)
- Web mode: yêu cầu `SUPABASE_SERVICE_ROLE_KEY` server-side
- Upsert theo batch 500 rows để tránh quá tải payload

---

## 2. Supabase PostgREST API (Web Mode)

**Base URL:** `https://{PROJECT_REF}.supabase.co/rest/v1/`

**Headers chung:**
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Prefer: return=representation          (khi cần trả về row đã insert/update)
Prefer: return=minimal                 (khi không cần response body)
```

---

### 2.1 People (Thành viên)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/people` | `?order=generation.asc,display_name.asc` |
| Get by ID | GET | `/rest/v1/people` | `?id=eq.{uuid}&limit=1` |
| Get by handle | GET | `/rest/v1/people` | `?handle=eq.{handle}&limit=1` |
| Search | GET | `/rest/v1/people` | `?display_name=ilike.*{query}*&limit=20` |
| By generation | GET | `/rest/v1/people` | `?generation=eq.{n}&order=display_name.asc` |
| Create | POST | `/rest/v1/people` | JSON body (CreatePersonInput) |
| Update | PATCH | `/rest/v1/people` | `?id=eq.{uuid}` + JSON body |
| Delete | DELETE | `/rest/v1/people` | `?id=eq.{uuid}` |

**CreatePersonInput:**
```json
{
  "handle": "dang-dinh-a",          // required, unique slug
  "display_name": "Đặng Đình A",    // required
  "first_name": "A",
  "middle_name": "Đình",
  "surname": "Đặng",
  "pen_name": "Tên tự",
  "taboo_name": "Tên húy",
  "gender": 1,                       // 1=Nam, 2=Nữ
  "generation": 3,                   // required
  "chi": 1,
  "birth_date": "1950-01-15",
  "birth_year": 1950,
  "birth_place": "Hà Tĩnh",
  "death_date": null,
  "death_year": null,
  "death_place": null,
  "death_lunar": "15/7",
  "is_living": true,
  "is_patrilineal": true,
  "phone": "0901234567",
  "email": "user@example.com",
  "zalo": "0901234567",
  "facebook": "https://fb.com/user",
  "address": "Thạch Lâm, Hà Tĩnh",
  "hometown": "Hà Tĩnh",
  "occupation": "Nông dân",
  "biography": "...",
  "notes": "...",
  "avatar_url": "https://...",
  "privacy_level": 1                 // 0=public, 1=members, 2=private
}
```

---

### 2.2 Families (Gia đình)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/families` | `?order=sort_order.asc` |
| Get by ID | GET | `/rest/v1/families` | `?id=eq.{uuid}` |
| Get by parents | GET | `/rest/v1/families` | `?father_id=eq.{uuid}&mother_id=eq.{uuid}` |
| Create | POST | `/rest/v1/families` | JSON body |
| Update | PATCH | `/rest/v1/families` | `?id=eq.{uuid}` + JSON body |

**Family body:**
```json
{
  "handle": "fam-1234-abcd",
  "father_id": "uuid",
  "mother_id": "uuid",
  "marriage_date": "1975-02-15",
  "marriage_place": "Hà Tĩnh",
  "divorce_date": null,
  "notes": null,
  "sort_order": 0
}
```

---

### 2.3 Children (Quan hệ cha mẹ-con)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| Get by family | GET | `/rest/v1/children` | `?family_id=eq.{uuid}&order=sort_order.asc` |
| Get by person | GET | `/rest/v1/children` | `?person_id=eq.{uuid}` |
| Add child | POST | `/rest/v1/children` | `{ family_id, person_id, sort_order }` |
| Remove child | DELETE | `/rest/v1/children` | `?family_id=eq.{uuid}&person_id=eq.{uuid}` |

---

### 2.4 Profiles (Tài khoản người dùng)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| Get by user_id | GET | `/rest/v1/profiles` | `?user_id=eq.{uuid}` |
| List all | GET | `/rest/v1/profiles` | `?order=created_at.desc` |
| Update profile | PATCH | `/rest/v1/profiles` | `?user_id=eq.{uuid}` + body |
| Update role | PATCH | `/rest/v1/profiles` | `?user_id=eq.{uuid}` + `{ role }` |
| Link person | PATCH | `/rest/v1/profiles` | `?user_id=eq.{uuid}` + `{ linked_person }` |

**Profile update body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "role": "admin | editor | viewer",
  "linked_person": "uuid | null",
  "edit_root_person_id": "uuid | null",
  "avatar_url": "https://..."
}
```

---

### 2.5 Contributions (Đề xuất chỉnh sửa)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/contributions` | `?order=created_at.desc` |
| Filter by status | GET | `/rest/v1/contributions` | `?status=eq.pending` |
| By person | GET | `/rest/v1/contributions` | `?target_person=eq.{uuid}` |
| Create | POST | `/rest/v1/contributions` | JSON body |
| Review (approve/reject) | PATCH | `/rest/v1/contributions` | `?id=eq.{uuid}` + body |

**Create body:**
```json
{
  "author_id": "uuid",
  "target_person": "uuid",
  "change_type": "create | update | delete",
  "changes": { "field": "new_value" },
  "reason": "Lý do đề xuất"
}
```

**Review body:**
```json
{
  "status": "approved | rejected",
  "reviewed_by": "uuid",
  "reviewed_at": "2026-02-27T10:00:00Z",
  "review_notes": "Đã kiểm tra và xác nhận"
}
```

---

### 2.6 Events (Lịch sự kiện / Ngày giỗ)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/events` | `?order=event_date.asc` |
| By type | GET | `/rest/v1/events` | `?event_type=eq.gio` |
| Create | POST | `/rest/v1/events` | JSON body |
| Update | PATCH | `/rest/v1/events` | `?id=eq.{uuid}` + body |
| Delete | DELETE | `/rest/v1/events` | `?id=eq.{uuid}` |

**Event body:**
```json
{
  "title": "Giỗ tổ Chi 1",
  "description": "...",
  "event_date": "2026-03-15",
  "event_lunar": "15/2",
  "event_type": "gio | hop_ho | le_tet | other",
  "person_id": "uuid",
  "location": "Nhà thờ họ",
  "recurring": true
}
```

---

### 2.7 Media (Ảnh & Tài liệu người)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| By person | GET | `/rest/v1/media` | `?person_id=eq.{uuid}&order=sort_order.asc` |
| Create | POST | `/rest/v1/media` | JSON body |
| Update | PATCH | `/rest/v1/media` | `?id=eq.{uuid}` + body |
| Delete | DELETE | `/rest/v1/media` | `?id=eq.{uuid}` |
| Set primary | PATCH | `/rest/v1/media` | Two-step: reset all → set one |

**Media body:**
```json
{
  "person_id": "uuid",
  "type": "photo | document | video",
  "url": "https://...",
  "caption": "Ảnh chụp năm 1975",
  "is_primary": false,
  "sort_order": 0
}
```

**Supabase Storage upload:**
```
POST /storage/v1/object/media/avatars/{filename}
Content-Type: image/jpeg
Authorization: Bearer {JWT}

<binary>
```

---

### 2.8 Achievements (Vinh danh thành tích)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/achievements` | `?order=year.desc` |
| By category | GET | `/rest/v1/achievements` | `?category=eq.hoc_tap` |
| By person | GET | `/rest/v1/achievements` | `?person_id=eq.{uuid}&order=year.desc` |
| Featured | GET | `/rest/v1/achievements` | `?is_featured=eq.true&limit=6` |
| Create | POST | `/rest/v1/achievements` | JSON body |
| Update | PATCH | `/rest/v1/achievements` | `?id=eq.{uuid}` + body |
| Delete | DELETE | `/rest/v1/achievements` | `?id=eq.{uuid}` |

**Achievement body:**
```json
{
  "person_id": "uuid",
  "title": "Bằng khen cấp tỉnh",
  "category": "hoc_tap | su_nghiep | cong_hien | other",
  "description": "...",
  "year": 2025,
  "awarded_by": "UBND tỉnh Hà Tĩnh",
  "is_featured": false
}
```

---

### 2.9 Fund Transactions (Quỹ khuyến học)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/fund_transactions` | `?order=transaction_date.desc` |
| By academic year | GET | `/rest/v1/fund_transactions` | `?academic_year=eq.2025-2026` |
| Balance summary | GET | `/rest/v1/fund_transactions` | `?select=type,amount&limit=5000` |
| Create | POST | `/rest/v1/fund_transactions` | JSON body |
| Update | PATCH | `/rest/v1/fund_transactions` | `?id=eq.{uuid}` + body |
| Delete | DELETE | `/rest/v1/fund_transactions` | `?id=eq.{uuid}` |

**FundTransaction body:**
```json
{
  "type": "income | expense",
  "category": "dong_gop | hoc_bong | khen_thuong | other",
  "amount": 1000000,
  "donor_name": "Nguyễn Văn A",
  "donor_person_id": "uuid",
  "recipient_id": "uuid",
  "description": "Đóng góp quỹ 2026",
  "transaction_date": "2026-02-27",
  "academic_year": "2025-2026",
  "created_by": "uuid"
}
```

---

### 2.10 Scholarships (Học bổng & Khen thưởng)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/scholarships` | `?order=created_at.desc` |
| By academic year | GET | `/rest/v1/scholarships` | `?academic_year=eq.2025-2026` |
| Create | POST | `/rest/v1/scholarships` | JSON body |
| Update status | PATCH | `/rest/v1/scholarships` | `?id=eq.{uuid}` + `{ status, approved_by, approved_at }` |
| Delete | DELETE | `/rest/v1/scholarships` | `?id=eq.{uuid}` |

**Scholarship body:**
```json
{
  "person_id": "uuid",
  "type": "hoc_bong | khen_thuong",
  "amount": 500000,
  "reason": "Đạt học sinh giỏi",
  "academic_year": "2025-2026",
  "school": "THPT Lê Quý Đôn",
  "grade_level": "Lớp 12",
  "status": "pending | approved | paid"
}
```

---

### 2.11 Clan Articles (Hương ước)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/clan_articles` | `?order=sort_order.asc` |
| By category | GET | `/rest/v1/clan_articles` | `?category=eq.gia_huan` |
| Featured | GET | `/rest/v1/clan_articles` | `?is_featured=eq.true` |
| Create | POST | `/rest/v1/clan_articles` | JSON body |
| Update | PATCH | `/rest/v1/clan_articles` | `?id=eq.{uuid}` + body |
| Delete | DELETE | `/rest/v1/clan_articles` | `?id=eq.{uuid}` |

**ClanArticle body:**
```json
{
  "title": "Gia huấn khai niên",
  "content": "Nội dung hương ước...",
  "category": "gia_huan | quy_uoc | loi_dan",
  "sort_order": 1,
  "is_featured": false,
  "author_id": "uuid"
}
```

---

### 2.12 Clan Documents (Kho tài liệu)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List all | GET | `/rest/v1/clan_documents` | `?order=created_at.desc` |
| By category | GET | `/rest/v1/clan_documents` | `?category=eq.anh_lich_su` |
| Search by title | GET | `/rest/v1/clan_documents` | `?title=ilike.*query*` |
| By person | GET | `/rest/v1/clan_documents` | `?person_id=eq.{uuid}` |
| Get by ID | GET | `/rest/v1/clan_documents` | `?id=eq.{uuid}` |
| Create | POST | `/rest/v1/clan_documents` | JSON body |
| Update | PATCH | `/rest/v1/clan_documents` | `?id=eq.{uuid}` + body |
| Delete | DELETE | `/rest/v1/clan_documents` | `?id=eq.{uuid}` |

**ClanDocument body:**
```json
{
  "title": "Ảnh làng Thạch Lâm 1975",
  "description": "Ảnh lịch sử của làng",
  "file_url": "https://...supabase.co/storage/v1/object/public/media/documents/...",
  "file_type": "image/jpeg",
  "file_size": 204800,
  "category": "anh_lich_su | giay_to | ban_do | video | bai_viet | khac",
  "tags": "lich-su,lang,1975",
  "person_id": "uuid",
  "uploaded_by": "uuid"
}
```

---

### 2.13 Cầu Đương Pools (Nhóm xoay vòng)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| List active | GET | `/rest/v1/cau_duong_pools` | `?is_active=eq.true&order=created_at.asc` |
| Get by ID | GET | `/rest/v1/cau_duong_pools` | `?id=eq.{uuid}` |
| Create | POST | `/rest/v1/cau_duong_pools` | JSON body |
| Update | PATCH | `/rest/v1/cau_duong_pools` | `?id=eq.{uuid}` + body |

**Pool body:**
```json
{
  "name": "Nhóm Cầu đương Chi 1",
  "ancestor_id": "uuid",
  "min_generation": 3,
  "max_age_lunar": 70,
  "description": "...",
  "is_active": true
}
```

---

### 2.14 Cầu Đương Assignments (Phân công lễ)

| Operation | Method | Path | Params / Body |
|-----------|--------|------|---------------|
| By pool | GET | `/rest/v1/cau_duong_assignments` | `?pool_id=eq.{uuid}&order=year.desc` |
| By pool + year | GET | `/rest/v1/cau_duong_assignments` | `?pool_id=eq.{uuid}&year=eq.2026` |
| Create | POST | `/rest/v1/cau_duong_assignments` | JSON body |
| Update | PATCH | `/rest/v1/cau_duong_assignments` | `?id=eq.{uuid}` + body |

**Assignment body:**
```json
{
  "pool_id": "uuid",
  "year": 2026,
  "ceremony_type": "tet | ram_thang_gieng | gio_to | ram_thang_bay",
  "host_person_id": "uuid",
  "actual_host_person_id": "uuid",
  "status": "scheduled | completed | delegated | rescheduled | cancelled",
  "scheduled_date": "2026-01-29",
  "actual_date": null,
  "reason": "...",
  "notes": "...",
  "rotation_index": 5,
  "created_by": "uuid"
}
```

---

### 2.15 RPC Functions

| Function | Method | Path | Params |
|----------|--------|------|--------|
| is_person_in_subtree | POST | `/rest/v1/rpc/is_person_in_subtree` | `{ root_id, target_id }` |

**Request:**
```json
{
  "root_id": "uuid",
  "target_id": "uuid"
}
```

**Response:** `true | false`

---

## 3. Supabase Auth API

**Base URL:** `https://{PROJECT_REF}.supabase.co/auth/v1/`

| Operation | Method | Path | Body |
|-----------|--------|------|------|
| Đăng ký | POST | `/auth/v1/signup` | `{ email, password }` |
| Đăng nhập | POST | `/auth/v1/token?grant_type=password` | `{ email, password }` |
| Đăng xuất | POST | `/auth/v1/logout` | (auth header) |
| Quên mật khẩu | POST | `/auth/v1/recover` | `{ email }` |
| Đổi mật khẩu | PUT | `/auth/v1/user` | `{ password }` + auth header |
| Lấy user hiện tại + factors | GET | `/auth/v1/user` | (auth header) |
| Đổi thông tin user | PUT | `/auth/v1/user` | `{ password, data }` + auth header |

### 3.1 MFA / TOTP (GoTrue v2.186.0)

> **Yêu cầu:** `[auth.mfa]` phải được bật trong `supabase/config.toml`.
> **Lưu ý GoTrue v2.186.0:** `GET /auth/v1/factors` không tồn tại (405). Danh sách factors lấy từ `GET /auth/v1/user → .factors[]`. Endpoint `/auth/v1/aal` không tồn tại (404); AAL đọc từ JWT payload claim `aal`.

| Operation | Method | Path | Body / Notes |
|-----------|--------|------|--------------|
| Enroll TOTP factor | POST | `/auth/v1/factors` | `{ factor_type: "totp", issuer, friendly_name }` |
| Unenroll factor | DELETE | `/auth/v1/factors/:id` | (auth header) |
| Create challenge | POST | `/auth/v1/factors/:id/challenge` | `{}` |
| Verify challenge | POST | `/auth/v1/factors/:id/verify` | `{ challenge_id, code }` |
| List factors | GET | `/auth/v1/user` | Response: `{ ..., factors: [{id, status, friendly_name, factor_type}] }` |
| Get AAL | (from JWT) | — | JWT payload field `aal`: `"aal1"` \| `"aal2"` |

**Response — enroll:**
```json
{
  "id": "uuid",
  "type": "totp",
  "totp": {
    "qr_code": "data:image/svg+xml;base64,...",
    "secret": "BASE32SECRET",
    "uri": "otpauth://totp/..."
  }
}
```

**E2E test:** `src/app/api/__tests__/mfa-account.test.ts` — 35 tests, GoTrue v2.186.0

### 3.2 User Management (Profiles)

> **Profiles table:** column `user_id` = auth UID (NOT `profiles.id` which is the profile's own UUID).

| Operation | Endpoint | Auth |
|-----------|----------|------|
| Fetch own profile | `GET /rest/v1/profiles?user_id=eq.{uid}` | anon_key + Bearer |
| Update own profile | `PATCH /rest/v1/profiles?user_id=eq.{uid}` | anon_key + Bearer |
| Suspend user | `PATCH /rest/v1/profiles?user_id=eq.{uid}` `{ is_suspended: true, suspension_reason: "..." }` | service_role |
| Unsuspend user | `PATCH /rest/v1/profiles?user_id=eq.{uid}` `{ is_suspended: false, suspension_reason: null }` | service_role |
| Delete user (Auth) | Server Action `deleteUserAccount(userId)` | service_role admin API |

**config.toml required (local dev):**
```toml
[auth.mfa]
max_enrolled_factors = 10

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
```

---

## 4. Supabase Storage API

**Base URL:** `https://{PROJECT_REF}.supabase.co/storage/v1/`

| Operation | Method | Path | Mô tả |
|-----------|--------|------|--------|
| Upload | POST | `/storage/v1/object/media/{path}` | Multipart form |
| Get public URL | GET | `/storage/v1/object/public/media/{path}` | Public access |
| Delete | DELETE | `/storage/v1/object/media` | Body: `{ prefixes: [path] }` |

**Bucket:** `media`
**Allowed types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `video/mp4`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## 5. RLS Roles Summary

| Role | people (R) | people (W) | families | profiles | admin routes |
|------|-----------|-----------|----------|----------|--------------|
| Anonymous | public, no-contact only | ✗ | ✗ | ✗ | ✗ |
| viewer | privacy_level < 2 | ✗ | ✓ | ✓ (own) | ✗ |
| editor | privacy_level < 2 | ✓ | ✓ | ✓ (own) | ✓ |
| admin | all | ✓ | ✓ | ✓ | ✓ |
