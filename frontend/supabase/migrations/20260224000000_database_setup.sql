-- ═══════════════════════════════════════════════════════════════════════════
-- Gia Phả Điện Tử - Database Setup
-- Họ Đặng làng Kỷ Các
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. People table
CREATE TABLE IF NOT EXISTS people (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle          VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    middle_name     VARCHAR(100),
    surname         VARCHAR(100),
    gender          SMALLINT CHECK (gender IN (1, 2)), -- 1=Male, 2=Female
    generation      INTEGER NOT NULL DEFAULT 1,
    chi             INTEGER,
    
    -- Birth
    birth_date      DATE,
    birth_year      INTEGER,
    birth_place     VARCHAR(255),
    
    -- Death
    death_date      DATE,
    death_year      INTEGER,
    death_place     VARCHAR(255),
    death_lunar     VARCHAR(20), -- Lunar date: "15/7"
    
    -- Status
    is_living       BOOLEAN DEFAULT true,
    is_patrilineal  BOOLEAN DEFAULT true,
    
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

-- 2. Families table
CREATE TABLE IF NOT EXISTS families (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 3. Children junction table
CREATE TABLE IF NOT EXISTS children (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(family_id, person_id)
);

-- 4. Profiles (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email               VARCHAR(255),
    full_name           VARCHAR(255),
    role                VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    linked_person       UUID REFERENCES people(id) ON DELETE SET NULL,
    avatar_url          TEXT,
    -- Verification & moderation (Sprint 12)
    is_verified         BOOLEAN NOT NULL DEFAULT false,
    can_verify_members  BOOLEAN NOT NULL DEFAULT false,
    is_suspended        BOOLEAN NOT NULL DEFAULT false,
    suspension_reason   TEXT,
    -- Timestamps
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contributions (edit suggestions)
CREATE TABLE IF NOT EXISTS contributions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_person   UUID REFERENCES people(id) ON DELETE CASCADE,
    change_type     VARCHAR(20) CHECK (change_type IN ('create', 'update', 'delete')),
    changes         JSONB,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    review_notes    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Events (memorial days)
CREATE TABLE IF NOT EXISTS events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    event_date      DATE,
    event_lunar     VARCHAR(20),
    event_type      VARCHAR(50) DEFAULT 'other' CHECK (event_type IN ('gio', 'hop_ho', 'le_tet', 'other')),
    person_id       UUID REFERENCES people(id) ON DELETE SET NULL,
    location        VARCHAR(255),
    recurring       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Media (photos, documents)
CREATE TABLE IF NOT EXISTS media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id       UUID REFERENCES people(id) ON DELETE CASCADE,
    type            VARCHAR(20) DEFAULT 'photo' CHECK (type IN ('photo', 'document', 'video')),
    url             TEXT NOT NULL,
    caption         TEXT,
    is_primary      BOOLEAN DEFAULT false,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_people_surname ON people(surname);
CREATE INDEX IF NOT EXISTS idx_people_generation ON people(generation);
CREATE INDEX IF NOT EXISTS idx_people_chi ON people(chi);
CREATE INDEX IF NOT EXISTS idx_people_display_name ON people USING GIN(to_tsvector('simple', display_name));

CREATE INDEX IF NOT EXISTS idx_families_father ON families(father_id);
CREATE INDEX IF NOT EXISTS idx_families_mother ON families(mother_id);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_person ON children(person_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- People policies
CREATE POLICY "Public read for public people" ON people
    FOR SELECT USING (privacy_level = 0);

CREATE POLICY "Members can read all people" ON people
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid())
    );

CREATE POLICY "Admins and editors can insert people" ON people
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins and editors can update people" ON people
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins can delete people" ON people
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Families policies (similar pattern)
CREATE POLICY "Anyone can read families" ON families FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage families" ON families
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Children policies
CREATE POLICY "Anyone can read children" ON children FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage children" ON children
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Events policies
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Media policies
CREATE POLICY "Anyone can read media" ON media FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage media" ON media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Contributions policies
CREATE POLICY "Users can read own contributions" ON contributions
    FOR SELECT USING (
        author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Members can create contributions" ON contributions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid())
    );

CREATE POLICY "Admins can update contributions" ON contributions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Sample Family)
-- ═══════════════════════════════════════════════════════════════════════════

-- Uncomment to add sample data
/*
INSERT INTO people (handle, display_name, surname, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal) VALUES
('P001', 'Đặng Văn Thủy Tổ', 'Đặng', 'Thủy Tổ', 1, 1, 1, 1850, false, true),
('P002', 'Nguyễn Thị A', 'Nguyễn', 'A', 2, 1, 1, 1855, false, false),
('P003', 'Đặng Văn B', 'Đặng', 'B', 1, 2, 1, 1880, false, true),
('P004', 'Đặng Văn C', 'Đặng', 'C', 1, 2, 1, 1882, false, true),
('P005', 'Đặng Thị D', 'Đặng', 'D', 2, 2, 1, 1885, false, true);

INSERT INTO families (handle, father_id, mother_id) VALUES
('F001', (SELECT id FROM people WHERE handle = 'P001'), (SELECT id FROM people WHERE handle = 'P002'));

INSERT INTO children (family_id, person_id, sort_order) VALUES
((SELECT id FROM families WHERE handle = 'F001'), (SELECT id FROM people WHERE handle = 'P003'), 1),
((SELECT id FROM families WHERE handle = 'F001'), (SELECT id FROM people WHERE handle = 'P004'), 2),
((SELECT id FROM families WHERE handle = 'F001'), (SELECT id FROM people WHERE handle = 'P005'), 3);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- Set first admin (replace with your email after signup)
-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
