-- Client portal schema

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  company       TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff', 'admin')),
  password_hash TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,            -- SHA-256 of the cookie token
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- One-time links for invites and password resets
CREATE TABLE auth_tokens (
  id         TEXT PRIMARY KEY,            -- SHA-256 of the token in the link
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('invite', 'reset')),
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE documents (
  id           TEXT PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_by  TEXT NOT NULL REFERENCES users(id),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'General',
  r2_key       TEXT NOT NULL UNIQUE,
  file_name    TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_documents_client ON documents(client_id, created_at DESC);

-- One conversation per client; messages are either from the client or the team
CREATE TABLE messages (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  read_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_client ON messages(client_id, created_at);

-- Public form submissions (no sign-in required)
CREATE TABLE submissions (
  id         TEXT PRIMARY KEY,
  form_slug  TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  plan_name  TEXT,
  payload    TEXT NOT NULL,               -- JSON of all submitted fields
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  client_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_submissions_status ON submissions(status, created_at DESC);
CREATE INDEX idx_submissions_email ON submissions(email COLLATE NOCASE);
