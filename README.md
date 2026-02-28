# AncestorTree

> **Gia Phả Điện Tử - Họ Đặng làng Kỷ Các, Thạch Lâm, Hà Tĩnh**

Phần mềm quản lý gia phả điện tử giúp gìn giữ và truyền thừa thông tin dòng họ qua các thế hệ.

*"Gìn giữ tinh hoa - Tiếp bước cha ông"*

## Tính năng

### Core (v1.0)
- **Cây gia phả trực quan** - Sơ đồ phả hệ tương tác, zoom, pan, collapse/expand, 10+ đời
- **Quản lý thành viên** - Hồ sơ cá nhân chi tiết (30+ trường thông tin)
- **Phân quyền 4 cấp** - Admin, Editor, Viewer, Guest (Supabase RLS)
- **Tìm kiếm** - Tra cứu nhanh theo tên, đời, chi nhánh
- **Admin Panel** - Quản lý người dùng, dữ liệu
- **Responsive** - Tương thích mobile/tablet/desktop

### Vietnamese Cultural (v1.1–v1.3)
- **Lịch âm dương** - Chuyển đổi chính xác, hiển thị ngày giỗ
- **Chi/nhánh** - Quản lý theo cấu trúc dòng họ Việt Nam
- **Đời (Generation)** - Tính tự động theo phả hệ
- **Can chi** - Giáp Tý, Ất Sửu, ...
- **Vinh danh thành tích** - Bảng vinh danh thành viên xuất sắc (học tập, sự nghiệp, cống hiến)
- **Quỹ khuyến học** - Quản lý quỹ, học bổng, khen thưởng, theo dõi thu chi
- **Hương ước gia tộc** - Gia huấn, quy ước, lời dặn con cháu
- **Thư mục thành viên** - Danh bạ liên lạc với quyền riêng tư
- **Lịch sự kiện** - Theo dõi ngày giỗ, lễ, tết

### Ceremony & Relations (v1.4–v1.5)
- **Cầu đương** - Phân công trách nhiệm cầu đương theo lịch âm (thuật toán DFS)
- **Quan hệ gia đình** - Hiển thị bố/mẹ/anh-chị-em/vợ-chồng/con theo giao diện trực quan
- **Thêm thành viên có quan hệ** - Chọn bố/mẹ khi tạo mới, thêm con vào gia đình
- **Cây lọc theo gốc** - Hiển thị cây gia phả bắt đầu từ bất kỳ thành viên nào

### Local Development (v1.6)
- **Chạy offline** - Supabase CLI + Docker, không cần tài khoản cloud
- **Dữ liệu demo** - 18 thành viên 5 đời sẵn sàng sau `pnpm local:setup`
- **Zero code change** - Cùng code base, chỉ khác env vars

### Security (v1.7)
- **Middleware bảo vệ toàn bộ** - Tất cả trang `(main)` yêu cầu đăng nhập, không chỉ `/admin`
- **RLS cật nhật** - Số điện thoại, email, Zalo, địa chỉ chỉ hiển thị với thành viên đăng nhập
- **Privacy mặc định an toàn** - Thành viên mới tạo mặc định chế độ `members only`
- **profiles bảo vệ** - Danh sách tài khoản không có thể bị thu thập nếu chưa đăng nhập

### Desktop App (v1.8)

- **Cài và chạy** - Tải installer, click cài, dùng ngay — không cần Node.js, Docker, hay tài khoản cloud
- **Hoạt động offline** - Dữ liệu lưu trên máy (SQLite), không cần internet
- **Đầy đủ chức năng** - 100% tính năng giống bản web
- **Cross-platform** - Hỗ trợ macOS và Windows
- **Dữ liệu demo** - 18 thành viên 5 đời sẵn sàng khi cài đặt
- **Tự động cập nhật** - Thông báo khi có phiên bản mới

### Landing Page (v2.1)

- **Trang giới thiệu** - Hero, tính năng, screenshots, download, cộng đồng
- **SEO** - Canonical URL, robots.txt, Open Graph
- **Download links** - Liên kết tải desktop app cho macOS/Windows

### Kho tài liệu & Hướng dẫn (v2.2)

- **Kho tài liệu** - Upload/lưu trữ ảnh lịch sử, gia phả giấy (PDF), bản đồ, video, bài viết
- **Phân loại** - 6 danh mục: Ảnh lịch sử, Giấy tờ, Bản đồ, Video, Bài viết, Khác
- **Tìm kiếm & lọc** - Gallery view với filter theo danh mục, tìm theo tiêu đề
- **Gắn thẻ thành viên** - Liên kết tài liệu với thành viên trong gia phả
- **Admin quản lý** - CRUD tài liệu, upload file, xác nhận xóa
- **Hướng dẫn sử dụng** - Trang `/help` trong app: 5 phần (điều hướng, workflow, phân quyền, mẹo, FAQ)
- **Desktop conditional** - Bản Desktop hiển thị thêm hướng dẫn sao lưu + bảng so sánh Desktop vs Web

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Database | Supabase (PostgreSQL, Auth, Storage, RLS) |
| State | React Query (TanStack Query) |
| Desktop | Electron 34, sql.js (WASM SQLite) |
| Deployment | Vercel + Supabase Cloud |
| Cost | **$0/tháng** (100% free tier) |

## Quick Start

### Option A: Desktop App (dành cho người dùng phổ thông)

> Không cần cài gì thêm — tải về, cài đặt, dùng ngay.

1. Tải file cài đặt từ [GitHub Releases](https://github.com/Minh-Tam-Solution/AncestorTree/releases):
   - **macOS:** `AncestorTree-x.x.x.dmg` (Intel) hoặc `AncestorTree-x.x.x-arm64.dmg` (Apple Silicon)
   - **Windows:** `AncestorTree-Setup-x.x.x.exe`
2. Cài đặt và mở ứng dụng
3. Dữ liệu demo 18 thành viên sẵn sàng

See [docs/04-build/INSTALLATION-GUIDE.md](./docs/04-build/INSTALLATION-GUIDE.md) for detailed instructions.

### Option B: Local Development (no cloud account needed)

> Requires Docker Desktop + Supabase CLI

```bash
git clone https://github.com/Minh-Tam-Solution/AncestorTree.git
cd AncestorTree/frontend
pnpm install
pnpm local:setup   # starts Docker, runs migrations, writes .env.local
pnpm dev
```

Open [http://localhost:4000](http://localhost:4000)

Demo login: `admin@giapha.local` / `admin123`

See [docs/04-build/LOCAL-DEVELOPMENT.md](./docs/04-build/LOCAL-DEVELOPMENT.md) for full guide.

### Option C: Supabase Cloud

```bash
git clone https://github.com/Minh-Tam-Solution/AncestorTree.git
cd AncestorTree/frontend
pnpm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Then run migrations in Supabase SQL Editor (supabase/migrations/ in order)
pnpm dev
```

Open [http://localhost:4000](http://localhost:4000)

## Project Structure

```
AncestorTree/
├── docs/                           # SDLC Documentation (LITE tier)
│   ├── 00-foundation/              # Vision, requirements, community
│   │   └── 06-Community/           # Community launch posts
│   ├── 01-planning/                # BRD, roadmap
│   ├── 02-design/                  # Architecture, UI/UX
│   ├── 04-build/                   # Sprint plans
│   └── 05-test/                    # Test plans
├── frontend/                       # Next.js application
│   ├── src/
│   │   ├── app/                    # App router (route groups)
│   │   │   ├── (auth)/             # Login, register
│   │   │   └── (main)/             # Main app with sidebar
│   │   │       ├── achievements/   # Vinh danh thành tích
│   │   │       ├── charter/        # Hương ước
│   │   │       ├── contributions/  # Đóng góp
│   │   │       ├── directory/      # Thư mục thành viên
│   │   │       ├── events/         # Lịch sự kiện
│   │   │       ├── fund/           # Quỹ khuyến học
│   │   │       ├── documents/       # Kho tài liệu (v2.2)
│   │   │       ├── help/           # Hướng dẫn sử dụng (v2.2)
│   │   │       ├── people/         # Quản lý thành viên
│   │   │       ├── tree/           # Cây gia phả
│   │   │       └── admin/          # Admin panel
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # shadcn/ui
│   │   │   └── layout/            # Layout (sidebar, header)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Supabase client, data layer
│   │   └── types/                  # TypeScript types
│   └── supabase/                   # Supabase CLI
│       ├── config.toml             # Cấu hình local (ports, auth, storage)
│       ├── seed.sql                # Dữ liệu demo (18 thành viên)
│       └── migrations/             # Migration files (theo thứ tự timestamp)
│           ├── 20260224000000_database_setup.sql
│           ├── 20260224000001_sprint6_migration.sql
│           ├── 20260224000002_cau_duong_migration.sql
│           ├── 20260224000003_sprint75_migration.sql
│           ├── 20260224000004_storage_setup.sql
│           ├── 20260226000005_security_hardening.sql
│           ├── 20260227000006_sprint11_kho_tai_lieu.sql
│           └── 20260227000007_storage_update_mime_types.sql
├── desktop/                        # Electron desktop app (Sprint 9)
│   ├── electron/                   # Main process (main.ts, server.ts, preload.ts)
│   ├── build/                      # App icons (icns, ico, png)
│   ├── migrations/                 # SQLite versioned migrations + seed data
│   ├── electron-builder.yml        # Cross-platform build config
│   └── package.json                # Electron + sql.js deps
├── .sdlc-config.json               # SDLC configuration
├── CLAUDE.md                       # AI assistant guidelines
└── README.md
```

## Database

14 tables across 5 layers:

| Layer | Tables | Description |
|-------|--------|-------------|
| Core Genealogy | `people`, `families`, `children` | Phả hệ, quan hệ gia đình |
| Platform | `profiles`, `contributions`, `media`, `events` | Tài khoản, đóng góp, sự kiện |
| Culture (v1.3) | `achievements`, `fund_transactions`, `scholarships`, `clan_articles` | Vinh danh, quỹ, hương ước |
| Ceremony (v1.4) | `cau_duong_pools`, `cau_duong_assignments` | Phân công cầu đương lễ, tết |
| Documents (v2.2) | `clan_documents` | Kho tài liệu dòng họ |

All tables have Row Level Security (RLS) policies with 4 roles.

## Documentation

Full SDLC documentation (9 docs, 141KB):

| Stage | Documents |
|-------|-----------|
| 00-Foundation | Vision, Problem Statement, Market Research, Business Case |
| 01-Planning | BRD (77 FRs + 17 NFRs), Roadmap |
| 02-Design | Technical Design (14 tables), UI/UX Design |
| 04-Build | Sprint Plan, Installation Guide, User Guide |

See [docs/README.md](./docs/README.md) for full documentation index.

## Roadmap

```
v0.1.0 Alpha    [##########] Done - Infrastructure + Auth
v1.0.0 MVP      [##########] Done - Tree + CRUD + Admin + Deploy
v1.1.0 Enhanced [##########] Done - Directory + Calendar + Contributions
v1.2.0 Release  [##########] Done - GEDCOM + Book Generator + Photos
v1.3.0 Culture  [##########] Done - Vinh danh + Quỹ khuyến học + Hương ước
v1.4.0 Ceremony [##########] Done - Cầu đương rotation + DFS algorithm
v1.5.0 Relations[##########] Done - Family relations UX + tree filter by root
v1.6.0 LocalDev  [##########] Done - Supabase CLI + Docker local mode
v1.7.0 Security  [##########] Done - RLS hardening + middleware fix + privacy defaults
v1.8.0 Desktop   [##########] Done - Electron + sql.js standalone desktop app
v2.1.0 Landing   [##########] Done - Landing page + community docs + SEO
v2.2.1 Security  [##########] Done - Security patch + Clan name config + Settings page
v2.2.0 Documents [##########] Done - Kho tài liệu + In-App Help guide
v3.0.0 Community [----------] Future - Nhà thờ họ, Notifications, Cross-clan
```

## For Your Own Clan

AncestorTree is designed for **any Vietnamese family**:

### Cách nhanh nhất (Desktop App)

1. Tải file cài đặt từ [GitHub Releases](https://github.com/Minh-Tam-Solution/AncestorTree/releases)
2. Cài đặt → Mở ứng dụng → Bắt đầu nhập dữ liệu

Tổng thời gian: **5 phút**. Chi phí: **$0**.

### Cách nâng cao (Web App)

1. Fork this repo
2. Create a free Supabase project
3. Run the database setup SQL
4. Deploy to Vercel (free)
5. Start entering family data

Total setup time: ~30 minutes. Total cost: $0/month.

## Built With

This project was built using [TinySDLC](https://github.com/Minh-Tam-Solution/tinysdlc) agent orchestrator following [MTS-SDLC-Lite](https://github.com/Minh-Tam-Solution/MTS-SDLC-Lite) methodology.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.
