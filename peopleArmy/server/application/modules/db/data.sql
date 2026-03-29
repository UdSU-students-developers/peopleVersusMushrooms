  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    guid TEXT
  );
  ALTER TABLE users ADD COLUMN token TEXT;

  CREATE TABLE IF NOT EXISTS unit_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    hp INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    unit_range INTEGER NOT NULL,
    visible INTEGER NOT NULL
  );

  INSERT OR IGNORE INTO unit_types (code, hp, speed, unit_range, visible) VALUES
    ('soldier', 10, 1, 3, 5),
    ('bmp', 100, 3, 5, 3);