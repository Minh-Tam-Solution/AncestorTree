-- Sprint 11: Kho tài liệu (Document Repository) — SQLite

CREATE TABLE IF NOT EXISTS clan_documents (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    file_type       TEXT,
    file_size       INTEGER,
    category        TEXT NOT NULL DEFAULT 'khac',
    tags            TEXT,
    person_id       TEXT REFERENCES people(id) ON DELETE SET NULL,
    uploaded_by     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clan_documents_category ON clan_documents(category);
CREATE INDEX IF NOT EXISTS idx_clan_documents_person ON clan_documents(person_id);
