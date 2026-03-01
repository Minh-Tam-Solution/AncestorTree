---
project: AncestorTree
path: docs/04-build/SPRINT-13-SPEC.md
type: build
version: 1.0.0
updated: 2026-03-01
owner: "@pm"
status: draft
---

# Sprint 13 — Góc giao lưu (v2.5.0)

## 1. Context & Motivation

### Business Need

> "Người trẻ cũng nhiều, đi khắp trong nước, có cả nước ngoài.
> Có box giao lưu thi thoảng gửi cái ảnh ở quê cho người xa nhà."

Con cháu họ Đặng sống rải rác khắp nơi — Hà Tĩnh, Sài Gòn, Hà Nội, nước ngoài.
Ngoài việc tra cứu gia phả, họ cần một **không gian giao lưu** để:

1. **Chia sẻ ảnh quê hương** — nhà thờ họ, làng xóm, phong cảnh Thạch Lâm
2. **Kể chuyện gia đình** — kỷ niệm, hồi ức, lời dặn dò
3. **Thông báo tin vui** — tốt nghiệp, cưới hỏi, sinh con, thăng chức
4. **Giao lưu thế hệ** — người già kể chuyện xưa, người trẻ chia sẻ cuộc sống mới
5. **Chia buồn & tưởng nhớ** — chia sẻ khi có tang, kỷ niệm ngày giỗ

### Scope

- **In scope:** Feed bài viết + ảnh, bình luận, reactions (thả tim/like), moderation
- **Out of scope:** Real-time chat, video call, notifications (Sprint 14), private messaging

### Dependencies

- Sprint 12 complete (profiles.is_verified, profiles.is_suspended)
- Supabase Storage bucket `media` exists (Sprint 5)
- Desktop SQLite shim supports JSONB-as-TEXT pattern (Sprint 9)

---

## 2. Architecture Decisions

### AD-01: Bài viết = posts table (không phải CMS)

Sử dụng bảng `posts` đơn giản thay vì hệ thống CMS phức tạp.
Mỗi bài viết là 1 row với content (text) + images (JSONB array of URLs).
Không cần rich text editor — chỉ plain text + ảnh.

**Rationale:** Đơn giản, phù hợp với đối tượng người dùng (không rành công nghệ).

### AD-02: Images = JSONB array, không phải bảng riêng

Lưu danh sách URL ảnh trong cột `images JSONB DEFAULT '[]'` thay vì bảng `post_images`.
Giới hạn tối đa 5 ảnh/bài viết.

**Rationale:** Giảm complexity, tránh JOIN. Số ảnh/bài viết nhỏ (≤5) nên JSONB array đủ tốt.

### AD-03: Reactions = đếm số, không lưu từng reaction

Lưu `likes_count INTEGER DEFAULT 0` + bảng `post_likes` (user_id, post_id) để tránh duplicate.
Không cần nhiều loại reaction (chỉ "Thích" / heart).

**Rationale:** Đơn giản, đủ dùng. Facebook-style reactions quá phức tạp cho ~30-50 users.

### AD-04: Comments = bảng riêng, flat (không nested)

Bảng `post_comments` chỉ có 1 level — không nested/threaded.
Mỗi comment là plain text (không ảnh, không rich text).

**Rationale:** Nested comments phức tạp UI + query. Với quy mô nhỏ, flat comments đủ rõ ràng.

### AD-05: Quyền đăng bài

- **Viewer (đã xác nhận):** Được đăng bài, bình luận, thả tim
- **Editor / Admin:** Đăng bài + moderation (ẩn/xóa bài vi phạm)
- **Chưa xác nhận:** Không thấy feed (bị chặn ở middleware)

**Rationale:** Feed là không gian nội bộ — chỉ thành viên đã xác nhận mới tham gia.
Cho phép viewer đăng bài (không chỉ admin/editor) để khuyến khích giao lưu.

### AD-06: Moderation = soft-delete + hide

Admin/editor có thể:
- **Ẩn bài** (`status = 'hidden'`) — bài vẫn tồn tại, chỉ ẩn khỏi feed
- **Xóa bài** — hard delete (admin only)

Không cần hệ thống report/flag phức tạp với ~30-50 users.

---

## 3. Database Design

### 3.1 Migration: `20260305000013_sprint13_feed.sql`

```sql
-- ============================================================================
-- Sprint 13: Góc giao lưu — Feed + Comments + Likes
-- AncestorTree v2.5.0
-- ============================================================================

-- ─── Posts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL CHECK (char_length(content) <= 5000),
    images          JSONB DEFAULT '[]'::jsonb,          -- URL array, max 5 items
    post_type       VARCHAR(20) NOT NULL DEFAULT 'general'
                    CHECK (post_type IN ('general', 'photo', 'milestone', 'memory', 'announcement')),
    status          VARCHAR(20) NOT NULL DEFAULT 'published'
                    CHECK (status IN ('published', 'hidden')),
    likes_count     INTEGER NOT NULL DEFAULT 0,
    comments_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX idx_posts_type ON posts(post_type);

COMMENT ON TABLE posts IS 'Sprint 13: Feed posts — bài viết giao lưu dòng họ';
COMMENT ON COLUMN posts.images IS 'JSONB array of image URLs, max 5 per post';
COMMENT ON COLUMN posts.post_type IS 'general|photo|milestone|memory|announcement';

-- ─── Post Likes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

-- ─── Post Comments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL CHECK (char_length(content) <= 2000),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_author ON post_comments(author_id);

-- ─── Trigger: update likes_count ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- ─── Trigger: update comments_count ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ─── RLS: posts ─────────────────────────────────────────────────────────────

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view published posts
CREATE POLICY "Authenticated users can view published posts"
ON posts FOR SELECT TO authenticated
USING (status = 'published');

-- Admin/editor can view ALL posts (including hidden — for moderation)
CREATE POLICY "Admin/editor can view all posts"
ON posts FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'editor')
    )
);

-- Verified users can create posts
CREATE POLICY "Verified users can create posts"
ON posts FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_verified = true
    )
);

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Admin/editor can update any post (moderation: hide/unhide)
CREATE POLICY "Admin/editor can update any post"
ON posts FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'editor')
    )
);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- Admin can delete any post
CREATE POLICY "Admin can delete any post"
ON posts FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ─── RLS: post_likes ────────────────────────────────────────────────────────

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view likes"
ON post_likes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Verified users can like posts"
ON post_likes FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_verified = true
    )
);

CREATE POLICY "Users can unlike (delete own like)"
ON post_likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ─── RLS: post_comments ─────────────────────────────────────────────────────

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
ON post_comments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Verified users can comment"
ON post_comments FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_verified = true
    )
);

CREATE POLICY "Authors can update own comments"
ON post_comments FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments"
ON post_comments FOR DELETE TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Admin can delete any comment"
ON post_comments FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);
```

### 3.2 Desktop SQLite: `desktop/migrations/005-sprint13-feed.sql`

```sql
-- Sprint 13: Góc giao lưu (SQLite version)

CREATE TABLE IF NOT EXISTS posts (
    id              TEXT PRIMARY KEY,
    author_id       TEXT NOT NULL,
    content         TEXT NOT NULL,
    images          TEXT DEFAULT '[]',          -- JSON array stored as TEXT
    post_type       TEXT NOT NULL DEFAULT 'general',
    status          TEXT NOT NULL DEFAULT 'published',
    likes_count     INTEGER NOT NULL DEFAULT 0,
    comments_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_likes (
    id              TEXT PRIMARY KEY,
    post_id         TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id              TEXT PRIMARY KEY,
    post_id         TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id       TEXT NOT NULL,
    content         TEXT NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
```

> **Desktop note:** SQLite không có triggers giống PostgreSQL.
> `likes_count` và `comments_count` sẽ được cập nhật bởi application layer
> (trong `query-builder.ts`) thay vì DB triggers.

---

## 4. TypeScript Types

Add to `frontend/src/types/index.ts`:

```typescript
// ─── Sprint 13: Feed ──────────────────────────────────────────────────────────

export type PostType = 'general' | 'photo' | 'milestone' | 'memory' | 'announcement';
export type PostStatus = 'published' | 'hidden';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  general: 'Chung',
  photo: 'Ảnh',
  milestone: 'Tin vui',
  memory: 'Kỷ niệm',
  announcement: 'Thông báo',
};

export interface Post {
  id: string;
  author_id: string;
  content: string;
  images: string[];                    // URL array (max 5)
  post_type: PostType;
  status: PostStatus;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export type CreatePostInput = Pick<Post, 'content' | 'post_type'> & {
  images?: string[];
};

export type UpdatePostInput = Partial<Pick<Post, 'content' | 'post_type' | 'images' | 'status'>>;

export type CreateCommentInput = Pick<PostComment, 'post_id' | 'content'>;
```

---

## 5. Data Layer

### File: `frontend/src/lib/supabase-data-feed.ts`

```typescript
/**
 * @project AncestorTree
 * @file src/lib/supabase-data-feed.ts
 * @description Data layer for feed posts, comments, and likes
 * @version 1.0.0
 * @updated 2026-03-01
 */
```

| # | Function | Signature | Description |
|---|----------|-----------|-------------|
| 1 | `getPosts` | `(type?: PostType): Promise<Post[]>` | List posts (published only for viewer, all for admin) ordered by `created_at DESC` |
| 2 | `getPost` | `(id: string): Promise<Post \| null>` | Single post by ID |
| 3 | `createPost` | `(input: CreatePostInput): Promise<Post>` | Create post, set `author_id = currentUser.id` |
| 4 | `updatePost` | `(id: string, input: UpdatePostInput): Promise<Post>` | Update post (author or admin/editor) |
| 5 | `deletePost` | `(id: string): Promise<void>` | Delete post (author or admin) |
| 6 | `hidePost` | `(id: string): Promise<void>` | Set `status = 'hidden'` (admin/editor moderation) |
| 7 | `unhidePost` | `(id: string): Promise<void>` | Set `status = 'published'` (admin/editor) |
| 8 | `getPostComments` | `(postId: string): Promise<PostComment[]>` | Comments for a post, ordered by `created_at ASC` |
| 9 | `createComment` | `(input: CreateCommentInput): Promise<PostComment>` | Add comment, set `author_id = currentUser.id` |
| 10 | `deleteComment` | `(id: string): Promise<void>` | Delete comment (author or admin) |
| 11 | `toggleLike` | `(postId: string): Promise<boolean>` | Like if not liked, unlike if already liked. Returns `isLiked` |
| 12 | `getPostLikes` | `(postId: string): Promise<PostLike[]>` | Get all likes for a post |
| 13 | `getUserLikedPosts` | `(userId: string): Promise<string[]>` | Get post IDs liked by user (for UI state) |

### Security Controls

- **Mass Assignment:** Use `allowedFields` pattern for `createPost` and `updatePost`
- **Input Validation:** `content` max 5000 chars, `images` max 5 URLs, `post_type` from enum
- **LIKE escape:** Search queries use `query.replace(/[%_\\]/g, '\\$&')` for `.ilike()`
- **Image URLs:** Only accept URLs from Supabase Storage or `/api/media/` (desktop)

```typescript
// Example: allowedFields for createPost
const ALLOWED_POST_FIELDS = ['content', 'post_type', 'images'] as const;

// Example: image URL validation
function isValidImageUrl(url: string): boolean {
  const isSupabase = url.includes('/storage/v1/object/');
  const isDesktop = url.startsWith('/api/media/');
  return isSupabase || isDesktop;
}
```

---

## 6. React Query Hooks

### File: `frontend/src/hooks/use-feed.ts`

```typescript
/**
 * @project AncestorTree
 * @file src/hooks/use-feed.ts
 * @description React Query hooks for feed posts, comments, and likes
 * @version 1.0.0
 * @updated 2026-03-01
 */
```

| # | Hook | Type | Key |
|---|------|------|-----|
| 1 | `usePosts` | Query | `['posts', 'list', { type }]` |
| 2 | `usePost` | Query | `['posts', 'detail', id]` |
| 3 | `useCreatePost` | Mutation | Invalidates `postKeys.all` |
| 4 | `useUpdatePost` | Mutation | Invalidates `postKeys.all` |
| 5 | `useDeletePost` | Mutation | Invalidates `postKeys.all` |
| 6 | `useHidePost` | Mutation | Invalidates `postKeys.all` |
| 7 | `usePostComments` | Query | `['posts', 'comments', postId]` |
| 8 | `useCreateComment` | Mutation | Invalidates `postKeys.comments(postId)` + `postKeys.all` |
| 9 | `useDeleteComment` | Mutation | Invalidates `postKeys.comments(postId)` + `postKeys.all` |
| 10 | `useToggleLike` | Mutation | Invalidates `postKeys.all` + `postKeys.userLikes` |
| 11 | `useUserLikedPosts` | Query | `['posts', 'userLikes', userId]` |

### Query Key Structure

```typescript
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (type?: PostType) => [...postKeys.lists(), { type }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  comments: (postId: string) => [...postKeys.all, 'comments', postId] as const,
  userLikes: (userId: string) => [...postKeys.all, 'userLikes', userId] as const,
};
```

---

## 7. UI Pages & Components

### 7.1 Feed Page: `/feed`

**File:** `frontend/src/app/(main)/feed/page.tsx`

**Layout:**

```
┌──────────────────────────────────────────────┐
│  📝 Góc giao lưu                              │
│  Không gian chia sẻ của con cháu họ Đặng     │
├──────────────────────────────────────────────┤
│  [Tất cả] [Ảnh] [Tin vui] [Kỷ niệm] [TB]   │  ← PostType filter tabs
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐    │
│  │ 📝 Chia sẻ điều gì đó...            │    │  ← Compose box (click to expand)
│  │ [Chọn ảnh] [Chọn loại] [Đăng bài]   │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐    │
│  │ 👤 Đặng Văn A · 2 giờ trước         │    │  ← PostCard
│  │ "Chia sẻ ảnh nhà thờ họ mùa xuân"   │    │
│  │ [🖼️ ảnh 1] [🖼️ ảnh 2]               │    │
│  │ ❤️ 5 · 💬 3 bình luận                │    │
│  │ ──────────────────────────────────── │    │
│  │ 👤 Đặng Văn B: "Đẹp quá!"          │    │  ← Comments (collapsed by default)
│  │ 👤 Đặng Thị C: "Nhớ quê!"          │    │
│  │ [Viết bình luận...]                  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 👤 Đặng Thế Tài · 1 ngày trước      │    │  ← Another PostCard
│  │ 📢 "Thông báo: Lịch giỗ tổ 15/3 AL" │    │
│  │ ❤️ 12 · 💬 1 bình luận               │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [Xem thêm bài viết]                        │  ← Load more (optional, or infinite scroll)
└──────────────────────────────────────────────┘
```

**Features:**
- Post type filter tabs (badges with counts)
- Compose box: textarea + image upload (max 5) + post type selector
- Post list: newest first, with PostCard component
- Each PostCard: author name (from profiles), relative time, content, images grid, like/comment counts
- Inline comments: collapsed by default, expand on click
- Like button: toggle (heart icon), optimistic update
- Image lightbox: click to view full size

### 7.2 PostCard Component

**File:** `frontend/src/components/feed/post-card.tsx`

Props: `post: Post`, `authorProfile: Profile`, `currentUserId: string`, `isLiked: boolean`

- Author avatar (initials) + display name + relative time
- Post type badge (if not 'general')
- Content text (with line breaks preserved)
- Image grid (1 image = full width, 2-4 = 2-column grid, 5 = 2+3 grid)
- Action bar: Like (heart) + Comment (speech bubble) + share (optional)
- Author actions: Edit / Delete (own posts)
- Admin actions: Ẩn bài (if editor/admin)

### 7.3 Compose Box Component

**File:** `frontend/src/components/feed/compose-box.tsx`

- Textarea (auto-resize, max 5000 chars)
- Image upload button (max 5 images, preview thumbnails)
- Post type selector (Select dropdown)
- Submit button ("Đăng bài")
- Cancel button (clears form)
- Loading state during upload + submit

### 7.4 Comments Section Component

**File:** `frontend/src/components/feed/comments-section.tsx`

Props: `postId: string`, `commentsCount: number`

- Collapsed by default, show count "X bình luận"
- Click to expand: fetch + show all comments
- Each comment: author name + time + content + delete (own/admin)
- Add comment: input + submit button

### 7.5 Admin Moderation Page

**File:** `frontend/src/app/(main)/admin/feed/page.tsx`

- Role guard: editor+ required
- Tabs: "Tất cả" | "Đã ẩn" (filter by status)
- Post list with moderation actions: Ẩn/Hiện + Xóa
- Search by content/author
- Delete confirmation dialog (AlertDialog)

### 7.6 Error & Loading Boundaries

**Files:**
- `frontend/src/app/(main)/feed/error.tsx`
- `frontend/src/app/(main)/feed/loading.tsx`
- `frontend/src/app/(main)/admin/feed/error.tsx`
- `frontend/src/app/(main)/admin/feed/loading.tsx`

---

## 8. Sidebar Navigation

### Main Nav

Add to `mainNavItems` in `app-sidebar.tsx`:

```typescript
{ title: 'Góc giao lưu', url: '/feed', icon: MessageSquare },
```

Position: after "Kho tài liệu", before "Gia phả sách".

### Admin Nav

Add to admin nav items:

```typescript
{ title: 'QL Bài viết', url: '/admin/feed', icon: MessageSquare },
```

### Middleware

Add `/feed` to `authRequiredPaths` in `proxy.ts`.

---

## 9. Execution Order

```
Phase 1: Database (parallel)
├── S13-01: Supabase migration SQL (posts + likes + comments + RLS + triggers)
└── S13-07: Desktop SQLite migration

Phase 2: Types
└── S13-04a: TypeScript types (Post, PostComment, PostLike, PostType, enums)

Phase 3: Data Layer
└── S13-03a: supabase-data-feed.ts (13 functions)

Phase 4: Hooks
└── S13-03b: use-feed.ts (11 hooks)

Phase 5: Infrastructure (parallel)
├── S13-09: Add /feed to authRequiredPaths in proxy.ts
└── S13-10: Add sidebar nav items (main + admin)

Phase 6: UI (sequential — compose → card → feed page → admin)
├── S13-04b: ComposeBox component
├── S13-04c: PostCard component
├── S13-05a: CommentsSection component
├── S13-04d: Feed page (/feed)
└── S13-06: Admin moderation page (/admin/feed)

Phase 7: Error boundaries
└── S13-11: error.tsx + loading.tsx for /feed and /admin/feed

Phase 8: Build & verify
└── S13-08: pnpm build + manual QA
```

---

## 10. Tasks (Detailed)

| # | Task | Type | Est. | Owner |
|---|------|------|:----:|:-----:|
| S13-01 | Supabase migration: `posts` + `post_likes` + `post_comments` + RLS + triggers | DB | 30m | @dev |
| S13-02 | Types: `Post`, `PostComment`, `PostLike`, `PostType`, input types, labels | TS | 15m | @dev |
| S13-03 | Data layer: `supabase-data-feed.ts` — 13 functions with security controls | Data | 60m | @dev |
| S13-04 | Hooks: `use-feed.ts` — 11 React Query hooks | Hooks | 30m | @dev |
| S13-05 | Components: `PostCard`, `ComposeBox`, `CommentsSection` | UI | 90m | @dev |
| S13-06 | Feed page: `/feed` — timeline + compose + filter tabs + load more | Page | 60m | @dev |
| S13-07 | Admin moderation: `/admin/feed` — list + hide/unhide + delete | Page | 45m | @dev |
| S13-08 | Desktop: SQLite migration `005-sprint13-feed.sql` | DB | 15m | @dev |
| S13-09 | Sidebar: nav items (main + admin) + middleware update | Infra | 10m | @dev |
| S13-10 | Error/loading boundaries for /feed and /admin/feed | UI | 10m | @dev |
| S13-11 | Image upload: reuse Supabase Storage + desktop `/api/media/` | Upload | 20m | @dev |
| S13-12 | Build & verify | QA | 15m | @dev |
| **Total** | | | **~6h** | |

---

## 11. File Structure

```text
frontend/
├── supabase/migrations/
│   └── 20260305000013_sprint13_feed.sql         NEW (S13-01)
├── src/
│   ├── types/
│   │   └── index.ts                              MODIFIED (S13-02)
│   ├── lib/
│   │   └── supabase-data-feed.ts                 NEW (S13-03)
│   ├── hooks/
│   │   └── use-feed.ts                           NEW (S13-04)
│   ├── components/
│   │   └── feed/
│   │       ├── post-card.tsx                     NEW (S13-05)
│   │       ├── compose-box.tsx                   NEW (S13-05)
│   │       └── comments-section.tsx              NEW (S13-05)
│   ├── app/(main)/
│   │   ├── feed/
│   │   │   ├── page.tsx                          NEW (S13-06)
│   │   │   ├── error.tsx                         NEW (S13-10)
│   │   │   └── loading.tsx                       NEW (S13-10)
│   │   └── admin/
│   │       └── feed/
│   │           ├── page.tsx                      NEW (S13-07)
│   │           ├── error.tsx                     NEW (S13-10)
│   │           └── loading.tsx                   NEW (S13-10)
│   ├── components/layout/
│   │   └── app-sidebar.tsx                       MODIFIED (S13-09)
│   └── proxy.ts                                  MODIFIED (S13-09)
desktop/
└── migrations/
    └── 005-sprint13-feed.sql                     NEW (S13-08)
```

**New files:** ~12
**Modified files:** 3 (types/index.ts, app-sidebar.tsx, proxy.ts)
**Estimated LOC:** ~1,500-2,000

---

## 12. Verification Checklist

### Functional Tests

- [ ] **F-01:** Viewer đã xác nhận → `/feed` → thấy danh sách bài viết
- [ ] **F-02:** Compose box: nhập nội dung + chọn ảnh (tối đa 5) + chọn loại → Đăng bài → bài xuất hiện đầu feed
- [ ] **F-03:** PostCard: hiển thị đúng tên tác giả, nội dung, ảnh (grid layout), thời gian
- [ ] **F-04:** Like: click ❤️ → count +1, icon đổi màu. Click lại → unlike, count -1
- [ ] **F-05:** Comments: click "X bình luận" → expand → hiện danh sách + input
- [ ] **F-06:** Add comment: nhập text → submit → comment xuất hiện, count +1
- [ ] **F-07:** Delete own comment: tác giả thấy nút xóa → xóa → biến mất, count -1
- [ ] **F-08:** Delete own post: tác giả thấy nút xóa → confirm → bài biến mất
- [ ] **F-09:** Post type filter: click tab "Ảnh" → chỉ hiện bài type=photo
- [ ] **F-10:** Admin moderation: editor/admin → thấy nút "Ẩn" trên mọi bài → ẩn → bài biến mất khỏi feed công khai
- [ ] **F-11:** Admin unhide: tab "Đã ẩn" → thấy bài ẩn → nút "Hiện" → bài quay lại feed
- [ ] **F-12:** Admin delete: nút "Xóa" → confirm dialog → hard delete

### Security Tests

- [ ] **S-01:** Viewer chưa xác nhận → `/feed` → redirect `/pending-verification`
- [ ] **S-02:** Unauthenticated → `/feed` → redirect `/login`
- [ ] **S-03:** Content > 5000 chars → bị reject (DB CHECK constraint)
- [ ] **S-04:** Images > 5 items → bị reject (application validation)
- [ ] **S-05:** Viewer cố update bài người khác → RLS block
- [ ] **S-06:** Viewer cố delete bài người khác → RLS block
- [ ] **S-07:** Editor cố delete bài → RLS block (chỉ admin hoặc author)

### Desktop Tests

- [ ] **D-01:** Desktop mode → `/feed` → hiển thị bình thường
- [ ] **D-02:** Desktop → đăng bài + ảnh → ảnh lưu qua `/api/media/`
- [ ] **D-03:** Desktop → likes/comments hoạt động (counts cập nhật application-side)

### Build Tests

- [ ] **B-01:** `pnpm build` passes (0 errors)
- [ ] **B-02:** `pnpm lint` passes
- [ ] **B-03:** Tất cả existing routes vẫn hoạt động (regression)

---

## 13. Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R-01 | Image upload fails (Supabase Storage quota) | Medium | Show clear error message, limit 5 images × 5MB = 25MB/post |
| R-02 | Feed performance with many posts | Low | Index on `(status, created_at DESC)`, paginate (20/page) |
| R-03 | Spam posts from verified users | Low | Rate limit in application (max 10 posts/hour per user), admin can hide |
| R-04 | Desktop likes_count desync | Low | Application-level count update in query-builder.ts, acceptable for single-user |
| R-05 | XSS via post content | High | React auto-escapes JSX. Never use `dangerouslySetInnerHTML`. Sanitize image URLs |
| R-06 | Large image files slow down feed | Medium | Client-side resize before upload (max 1920px width), lazy loading images |

---

## 14. Future Considerations (Not in Sprint 13)

| Feature | Sprint | Notes |
|---------|--------|-------|
| Push notifications for new posts | Sprint 14 | Part of notification system |
| Post pinning (sticky top) | Sprint 13+ | Simple `is_pinned` boolean |
| Image gallery per post | Sprint 13+ | Lightbox with left/right navigation |
| Post editing history | Sprint 16+ | Low priority, audit trail |
| Private posts (family-only visibility) | Sprint 16+ | Need tenant/family group concept |
| Reactions (beyond like) | Sprint 16+ | Only if user demand justifies complexity |

---

*SDLC Framework 6.1.1 - Stage 04 Build*
