-- ═══════════════════════════════════════════════════════════════════════════
-- AncestorTree — Seed Data for Local Development
-- Chạy tự động sau migrations khi `supabase start` hoặc `supabase db reset`
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Auth Users ──────────────────────────────────────────────────────────
-- Tạo 2 demo accounts (chỉ hoạt động trên Supabase local)

-- Admin account: admin@giapha.local / admin123
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    aud, role, is_super_admin
) VALUES (
    'aaaaaaaa-0001-4000-a000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@giapha.local',
    crypt('admin123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name": "Quản trị viên"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '', '', '', '',
    'authenticated', 'authenticated', false
);

INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
) VALUES (
    'aaaaaaaa-0001-4000-a000-000000000001',
    'aaaaaaaa-0001-4000-a000-000000000001',
    '{"sub": "aaaaaaaa-0001-4000-a000-000000000001", "email": "admin@giapha.local"}'::jsonb,
    'email',
    'aaaaaaaa-0001-4000-a000-000000000001',
    NOW(), NOW(), NOW()
);

-- Viewer account: viewer@giapha.local / viewer123
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    aud, role, is_super_admin
) VALUES (
    'aaaaaaaa-0002-4000-a000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'viewer@giapha.local',
    crypt('viewer123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name": "Người xem"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '', '', '', '',
    'authenticated', 'authenticated', false
);

INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
) VALUES (
    'aaaaaaaa-0002-4000-a000-000000000002',
    'aaaaaaaa-0002-4000-a000-000000000002',
    '{"sub": "aaaaaaaa-0002-4000-a000-000000000002", "email": "viewer@giapha.local"}'::jsonb,
    'email',
    'aaaaaaaa-0002-4000-a000-000000000002',
    NOW(), NOW(), NOW()
);

-- Editor account: editor@giapha.local / editor123
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    aud, role, is_super_admin
) VALUES (
    'aaaaaaaa-0003-4000-a000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'editor@giapha.local',
    crypt('editor123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name": "Biên tập viên"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '', '', '', '',
    'authenticated', 'authenticated', false
);

INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
) VALUES (
    'aaaaaaaa-0003-4000-a000-000000000003',
    'aaaaaaaa-0003-4000-a000-000000000003',
    '{"sub": "aaaaaaaa-0003-4000-a000-000000000003", "email": "editor@giapha.local"}'::jsonb,
    'email',
    'aaaaaaaa-0003-4000-a000-000000000003',
    NOW(), NOW(), NOW()
);

-- handle_new_user trigger sẽ tự tạo profiles, sau đó promote admin + editor
UPDATE public.profiles SET role = 'admin' WHERE user_id = 'aaaaaaaa-0001-4000-a000-000000000001';
UPDATE public.profiles SET role = 'editor' WHERE user_id = 'aaaaaaaa-0003-4000-a000-000000000003';

-- ─── People (Đời 1–5, 18 thành viên) ─────────────────────────────────────

-- Đời 1: Thủy tổ
INSERT INTO public.people (id, handle, display_name, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level) VALUES
('bbbbbbbb-0001-4000-b000-000000000001', 'P001', 'Đặng Văn Thủy Tổ', 1, 1, false, 1850, 1920, '12/3', 'Thủy tổ dòng họ Đặng làng Kỷ Các.', 0),
('bbbbbbbb-0002-4000-b000-000000000002', 'P002', 'Nguyễn Thị Từ', 2, 1, false, 1855, 1935, '8/7', 'Vợ cụ Thủy Tổ.', 0);

-- Đời 2: 3 con
INSERT INTO public.people (id, handle, display_name, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level) VALUES
('bbbbbbbb-0011-4000-b000-000000000011', 'P011', 'Đặng Văn Nhất', 1, 2, false, 1880, 1950, '15/1', 'Con trưởng.', 0),
('bbbbbbbb-0012-4000-b000-000000000012', 'P012', 'Trần Thị Lan', 2, 2, false, 1885, 1960, '20/9', 'Vợ ông Nhất.', 0),
('bbbbbbbb-0013-4000-b000-000000000013', 'P013', 'Đặng Văn Nhị', 1, 2, false, 1883, 1955, '5/11', 'Con thứ.', 0),
('bbbbbbbb-0014-4000-b000-000000000014', 'P014', 'Lê Thị Mai', 2, 2, false, 1888, 1965, '22/4', 'Vợ ông Nhị.', 0),
('bbbbbbbb-0015-4000-b000-000000000015', 'P015', 'Đặng Thị Ba', 2, 2, false, 1886, 1970, '3/6', 'Con gái út.', 0);

-- Đời 3: 4 cháu
INSERT INTO public.people (id, handle, display_name, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level) VALUES
('bbbbbbbb-0021-4000-b000-000000000021', 'P021', 'Đặng Văn Tài', 1, 3, false, 1910, 1980, '18/2', 'Cháu trưởng.', 0),
('bbbbbbbb-0022-4000-b000-000000000022', 'P022', 'Phạm Thị Hoa', 2, 3, false, 1915, 1990, '7/10', 'Vợ ông Tài.', 0),
('bbbbbbbb-0023-4000-b000-000000000023', 'P023', 'Đặng Thị Liên', 2, 3, false, 1912, 1985, '25/8', 'Con gái ông Nhất.', 0),
('bbbbbbbb-0024-4000-b000-000000000024', 'P024', 'Đặng Văn Đức', 1, 3, false, 1915, 1988, '10/5', 'Con ông Nhị.', 0);

-- Đời 4: 4 chắt
INSERT INTO public.people (id, handle, display_name, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level) VALUES
('bbbbbbbb-0031-4000-b000-000000000031', 'P031', 'Đặng Văn Minh', 1, 4, true, 1945, NULL, NULL, 'Trưởng nam đời 4.', 0),
('bbbbbbbb-0032-4000-b000-000000000032', 'P032', 'Nguyễn Thị Hằng', 2, 4, true, 1948, NULL, NULL, 'Vợ ông Minh.', 0),
('bbbbbbbb-0033-4000-b000-000000000033', 'P033', 'Đặng Văn Hùng', 1, 4, true, 1950, NULL, NULL, 'Con thứ ông Tài.', 0),
('bbbbbbbb-0034-4000-b000-000000000034', 'P034', 'Đặng Thị Phượng', 2, 4, true, 1947, NULL, NULL, 'Con gái ông Đức.', 0);

-- Đời 5: 3 chút
INSERT INTO public.people (id, handle, display_name, gender, generation, is_living, birth_year, biography, privacy_level) VALUES
('bbbbbbbb-0041-4000-b000-000000000041', 'P041', 'Đặng Văn An', 1, 5, true, 1975, 'Con ông Minh. Kỹ sư CNTT.', 0),
('bbbbbbbb-0042-4000-b000-000000000042', 'P042', 'Đặng Thị Bình', 2, 5, true, 1978, 'Con gái ông Minh.', 0),
('bbbbbbbb-0043-4000-b000-000000000043', 'P043', 'Đặng Văn Cường', 1, 5, true, 1980, 'Con ông Hùng.', 0);

-- ─── Families ─────────────────────────────────────────────────────────────

INSERT INTO public.families (id, handle, father_id, mother_id, marriage_date, sort_order) VALUES
('cccccccc-0001-4000-c000-000000000001', 'F001', 'bbbbbbbb-0001-4000-b000-000000000001', 'bbbbbbbb-0002-4000-b000-000000000002', '1878-01-01', 1),
('cccccccc-0002-4000-c000-000000000002', 'F002', 'bbbbbbbb-0011-4000-b000-000000000011', 'bbbbbbbb-0012-4000-b000-000000000012', '1908-01-01', 1),
('cccccccc-0003-4000-c000-000000000003', 'F003', 'bbbbbbbb-0013-4000-b000-000000000013', 'bbbbbbbb-0014-4000-b000-000000000014', '1912-01-01', 2),
('cccccccc-0004-4000-c000-000000000004', 'F004', 'bbbbbbbb-0021-4000-b000-000000000021', 'bbbbbbbb-0022-4000-b000-000000000022', '1938-01-01', 1),
('cccccccc-0005-4000-c000-000000000005', 'F005', 'bbbbbbbb-0031-4000-b000-000000000031', 'bbbbbbbb-0032-4000-b000-000000000032', '1970-01-01', 1);

-- ─── Children ─────────────────────────────────────────────────────────────

INSERT INTO public.children (family_id, person_id, sort_order) VALUES
-- Đời 1 → Đời 2
('cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0011-4000-b000-000000000011', 1),
('cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0013-4000-b000-000000000013', 2),
('cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0015-4000-b000-000000000015', 3),
-- Đời 2 (Nhất) → Đời 3
('cccccccc-0002-4000-c000-000000000002', 'bbbbbbbb-0021-4000-b000-000000000021', 1),
('cccccccc-0002-4000-c000-000000000002', 'bbbbbbbb-0023-4000-b000-000000000023', 2),
-- Đời 2 (Nhị) → Đời 3
('cccccccc-0003-4000-c000-000000000003', 'bbbbbbbb-0024-4000-b000-000000000024', 1),
-- Đời 3 (Tài) → Đời 4
('cccccccc-0004-4000-c000-000000000004', 'bbbbbbbb-0031-4000-b000-000000000031', 1),
('cccccccc-0004-4000-c000-000000000004', 'bbbbbbbb-0033-4000-b000-000000000033', 2),
-- Đời 3 (Đức) → Đời 4
-- (Đức chưa có family record — Phượng là con gái, tạm gắn qua Tài family)
-- Đời 4 (Minh) → Đời 5
('cccccccc-0005-4000-c000-000000000005', 'bbbbbbbb-0041-4000-b000-000000000041', 1),
('cccccccc-0005-4000-c000-000000000005', 'bbbbbbbb-0042-4000-b000-000000000042', 2);

-- ─── Events (Ngày giỗ) ───────────────────────────────────────────────────

INSERT INTO public.events (title, event_type, event_lunar, person_id, recurring, location) VALUES
('Giỗ Cụ Thủy Tổ', 'gio', '12/3', 'bbbbbbbb-0001-4000-b000-000000000001', true, 'Nhà thờ họ'),
('Giỗ Bà Thủy Tổ', 'gio', '8/7', 'bbbbbbbb-0002-4000-b000-000000000002', true, 'Nhà thờ họ'),
('Giỗ Ông Nhất', 'gio', '15/1', 'bbbbbbbb-0011-4000-b000-000000000011', true, 'Nhà trưởng'),
('Rằm tháng Bảy', 'le_tet', '15/7', NULL, true, 'Nhà thờ họ'),
('Tết Nguyên Đán', 'le_tet', '1/1', NULL, true, 'Nhà thờ họ');

-- ─── Achievements ─────────────────────────────────────────────────────────

INSERT INTO public.achievements (person_id, title, category, year, description) VALUES
('bbbbbbbb-0041-4000-b000-000000000041', 'Tốt nghiệp Thạc sĩ CNTT', 'hoc_tap', 2002, 'Đại học Bách Khoa Hà Nội'),
('bbbbbbbb-0042-4000-b000-000000000042', 'Giáo viên Giỏi cấp Tỉnh', 'su_nghiep', 2015, 'Sở GD&ĐT Hà Tĩnh');

-- ─── Clan Articles (Hương ước) ────────────────────────────────────────────

INSERT INTO public.clan_articles (title, content, category, sort_order) VALUES
('Gia huấn dòng họ', 'Kính trên nhường dưới, giữ gìn nề nếp gia phong. Con cháu phải siêng năng học hành, hiếu thảo với cha mẹ.', 'gia_huan', 1),
('Quy ước họp họ', 'Họp họ tổ chức vào ngày Rằm tháng Giêng hàng năm tại nhà thờ họ. Mọi thành viên từ 18 tuổi trở lên đều có quyền tham dự và biểu quyết.', 'quy_uoc', 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — Demo accounts:
--   admin@giapha.local  / admin123  (Quản trị viên)
--   editor@giapha.local / editor123 (Biên tập viên)
--   viewer@giapha.local / viewer123 (Người xem)
-- ═══════════════════════════════════════════════════════════════════════════
