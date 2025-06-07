/*
  # Initial Schema for Journal App

  1. Tables
    - `users` - stores teachers and students
    - `journals` - stores journal entries created by teachers
    - `attachments` - stores attachments for journals
    - `journal_students` - junction table for tagging students in journals

  2. Relationships
    - One teacher can create many journals
    - One journal can have many attachments
    - Many students can be tagged in many journals
*/

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journals Table
CREATE TABLE IF NOT EXISTS journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  teacher_id INTEGER NOT NULL,
  published_at TIMESTAMP,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'url', 'pdf')),
  url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
);

-- Junction Table for Many-to-Many relationship between Journals and Students
CREATE TABLE IF NOT EXISTS journal_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  has_viewed_journal BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE (journal_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journals_teacher_id ON journals (teacher_id);
CREATE INDEX IF NOT EXISTS idx_journals_published_at ON journals (published_at);
CREATE INDEX IF NOT EXISTS idx_journals_is_published ON journals (is_published);
CREATE INDEX IF NOT EXISTS idx_attachments_journal_id ON attachments (journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_students_journal_id ON journal_students (journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_students_student_id ON journal_students (student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);