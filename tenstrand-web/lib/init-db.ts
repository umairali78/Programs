import { getRawClient } from '@/lib/db'

const DDL = `
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  county TEXT,
  superintendent_email TEXT,
  enrollment_total INTEGER
);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  district_id TEXT REFERENCES districts(id),
  address TEXT,
  city TEXT,
  county TEXT,
  lat REAL,
  lng REAL,
  enrollment INTEGER,
  title1_flag INTEGER DEFAULT 0,
  geocoding_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  school_id TEXT REFERENCES schools(id),
  grade_levels TEXT,
  subjects TEXT,
  lat REAL,
  lng REAL,
  zip TEXT,
  last_active INTEGER
);

CREATE TABLE IF NOT EXISTS teacher_interests (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  topic TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  address TEXT,
  lat REAL,
  lng REAL,
  county TEXT,
  contact_email TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  profile_score REAL DEFAULT 0,
  geocoding_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  title TEXT NOT NULL,
  description TEXT,
  grade_levels TEXT,
  subjects TEXT,
  max_students INTEGER,
  duration_mins INTEGER,
  cost REAL DEFAULT 0,
  season TEXT,
  lat REAL,
  lng REAL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS program_standards (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id),
  standard_code TEXT NOT NULL,
  standard_desc TEXT,
  framework TEXT
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  program_id TEXT NOT NULL REFERENCES programs(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  program_id TEXT NOT NULL REFERENCES programs(id),
  type TEXT NOT NULL,
  occurred_at INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  program_id TEXT NOT NULL REFERENCES programs(id),
  rating INTEGER,
  text TEXT,
  visited_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  program_id TEXT REFERENCES programs(id),
  title TEXT NOT NULL,
  content TEXT,
  grade_level TEXT,
  subjects TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  recipient_type TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  content_json TEXT,
  opened_at INTEGER
);

CREATE TABLE IF NOT EXISTS partner_prospects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  source_url TEXT,
  address TEXT,
  lat REAL,
  lng REAL,
  county TEXT,
  ai_score REAL,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  outreach_sent_at INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS outreach_log (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES partner_prospects(id),
  email_subject TEXT,
  email_body TEXT,
  sent_at INTEGER,
  response_status TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

let initPromise: Promise<void> | null = null

export async function ensureDatabaseInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      const client = getRawClient()
      const statements = DDL.split(';').map((s) => s.trim()).filter(Boolean)
      // batch() sends all DDL in one HTTP round-trip to Turso
      await client.batch(statements, 'write')
    })()
  }
  await initPromise
}
