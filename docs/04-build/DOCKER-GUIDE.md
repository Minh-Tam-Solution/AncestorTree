---
project: AncestorTree
path: docs/04-build/DOCKER-GUIDE.md
type: build-guide
version: 1.0.0
updated: 2026-02-28
owner: dev-team
status: approved
---

# Docker Deployment Guide

## Tổng quan

| Item | Value |
|------|-------|
| Mode | Web (Supabase Cloud) |
| Port | 4000 |
| Image | `ancestortree-web:latest` |
| Backup volume | `./docker-data/backups` → `/data/backups` |
| Build mode | Next.js standalone (`DOCKER_BUILD=true`) |

---

## Cấu trúc files Docker

```
AncestorTree/
├── docker-compose.yml          # Compose config + volume mapping
├── .env.docker.example         # Template env vars (copy → .env)
└── frontend/
    ├── Dockerfile              # Multi-stage build (deps → builder → runner)
    └── .dockerignore           # Exclude node_modules, .next, secrets
```

---

## Yêu cầu

- Docker Engine ≥ 24 + Docker Compose v2
- Tài khoản Supabase Cloud + project đã khởi tạo (có migration đã chạy)

---

## Quick Start

```bash
# 1. Copy và điền credentials
cp .env.docker.example .env
# Chỉnh sửa .env: điền NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY

# 2. Build và khởi động
docker compose up -d --build

# 3. Kiểm tra logs
docker compose logs -f app

# 4. Truy cập
open http://localhost:4000
```

---

## Volume Backup

Khi người dùng tạo backup từ `/admin/backup`, file ZIP được:
- **Tải về trình duyệt** (như bình thường)
- **Lưu vào host** tại `./docker-data/backups/giapha-YYYY-MM-DD.zip`

```
docker-data/
└── backups/
    ├── giapha-2026-02-28.zip
    └── giapha-2026-03-01.zip
```

> Thư mục `docker-data/backups` được tạo tự động khi container khởi động.
> Thay đổi đường dẫn host trong `docker-compose.yml` → mục `volumes`.

---

## Rebuild sau khi thay đổi code

```bash
# Rebuild image và restart container (không dùng cache)
docker compose build --no-cache app
docker compose up -d
```

---

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-only, dùng cho backup/restore) |
| `APP_PORT` | ❌ | Host port (default: 4000) |
| `NEXT_PUBLIC_CLAN_NAME` | ❌ | Tên dòng họ (default: Họ Đặng) |
| `NEXT_PUBLIC_CLAN_FULL_NAME` | ❌ | Tên đầy đủ dòng họ |
| `BACKUP_DIR` | auto | `/data/backups` — set tự động bởi docker-compose |

---

## Kiến trúc Dockerfile (3 stage)

```
┌─────────────────────────────────────────────┐
│ Stage 1: deps                               │
│   node:20-alpine                            │
│   pnpm install --frozen-lockfile            │
└────────────────────┬────────────────────────┘
                     │ node_modules
┌────────────────────▼────────────────────────┐
│ Stage 2: builder                            │
│   DOCKER_BUILD=true → standalone output     │
│   pnpm build → .next/standalone/            │
└────────────────────┬────────────────────────┘
                     │ .next/standalone + static
┌────────────────────▼────────────────────────┐
│ Stage 3: runner (final image)               │
│   node:20-alpine, user nextjs (uid 1001)    │
│   EXPOSE 4000                               │
│   CMD node server.js                        │
└─────────────────────────────────────────────┘
```

Image size cuối: ~200–300 MB (standalone không cần full node_modules).

---

## Lệnh hữu ích

```bash
# Xem container status
docker compose ps

# Shell vào container
docker compose exec app sh

# Dừng và xoá container (giữ volumes)
docker compose down

# Dừng, xoá container VÀ volumes
docker compose down -v

# Xem backup files trên host
ls -lh docker-data/backups/
```

---

## Bước tiếp theo

- [ ] Thêm Nginx reverse proxy + SSL (Let's Encrypt) trước container app
- [ ] CI/CD: GitHub Actions → build + push image → deploy VPS
- [ ] Thêm cron job host để tự động backup theo lịch (gọi `/api/backup` định kỳ)
